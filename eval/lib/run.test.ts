import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startFakeOllama, type FakeOllama } from '@/test/mocks/ollama';
import type { EvalConfig } from '../config';
import type { ManifestEntry } from './manifest';
import { configHash, expandConfig, runEval } from './run';
import { Taxonomy, type Lookup } from './taxonomy';

const keys: Record<string, number> = { 'monstera deliciosa': 1, 'ficus elastica': 2, 'thaumatophyllum bipinnatifidum': 3, 'rhaphidophora tetrasperma': 4 };
const lookup: Lookup = async (name) =>
  keys[name] ? { matchType: 'EXACT', species: name, speciesKey: keys[name], genusKey: keys[name] } : { matchType: 'NONE' };

const entries: ManifestEntry[] = [
  { file: 'public/monstera.jpg', scientificName: 'Monstera deliciosa', genus: 'Monstera', family: 'Araceae', source: 'inaturalist' },
  { file: 'public/ficus.jpg', scientificName: 'Ficus elastica', genus: 'Ficus', family: 'Moraceae', source: 'inaturalist' },
  { file: 'non-plant/cat.jpg', scientificName: null, genus: null, family: null, source: 'inaturalist' },
  { file: 'public/missing.jpg', scientificName: 'Ficus elastica', genus: 'Ficus', family: 'Moraceae', source: 'inaturalist' }
];

let fake: FakeOllama;
let dirs: { dataDir: string; cacheDir: string; runsDir: string };
let config: EvalConfig;

beforeAll(async () => {
  fake = await startFakeOllama();
  const root = await mkdtemp(path.join(tmpdir(), 'eval-'));
  dirs = { dataDir: path.join(root, 'data'), cacheDir: path.join(root, 'cache'), runsDir: path.join(root, 'runs') };
  for (const [index, entry] of entries.slice(0, 3).entries()) {
    await mkdir(path.dirname(path.join(dirs.dataDir, entry.file)), { recursive: true });
    await writeFile(path.join(dirs.dataDir, entry.file), new Uint8Array([index]));
  }
  config = { host: fake.url, modes: ['two-stage'], models: ['qwen2.5vl:7b'], settings: [{ name: 'top3', topK: 3, describe: false }], warmup: true };
});
afterAll(() => fake.close());

const run = async (runId: string) =>
  runEval({ config, entries, runId, ...dirs, taxonomy: await Taxonomy.load({ file: path.join(dirs.dataDir, 'taxonomy.json'), lookup }), log: () => {} });

describe('runEval', () => {
  it('scores each image, writes the run files and caches results', async () => {
    // Replies in image order: monstera right, ficus invalid, cat abstains
    fake.enqueue(
      { content: { isPlant: false, candidates: [] } }, // warmup, discarded
      { content: { isPlant: true, candidates: [{ scientificName: 'Monstera deliciosa', commonName: '', confidence: 0.8 }] } },
      { content: 'not json' },
      { content: { isPlant: false, candidates: [] } }
    );
    const { samples, summary, dir } = await run('first');

    expect(samples.map((s) => [s.file, s.status, s.speciesRank])).toEqual([
      ['public/monstera.jpg', 'ok', 1],
      ['public/ficus.jpg', 'invalid-output', null],
      ['non-plant/cat.jpg', 'ok', null]
    ]);
    const all = summary.configs[0]!.splits.all!;
    expect(all.speciesTop1.rate).toBe(0.5);
    expect(all.schemaValid.rate).toBeCloseTo(2 / 3);
    expect(all.abstention.rate).toBe(1);
    expect(summary.missingImages).toBe(1);

    const lines = (await readFile(path.join(dir, 'samples.jsonl'), 'utf8')).trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(await readFile(path.join(dir, 'summary.md'), 'utf8')).toContain('## Split: public');
    expect(fake.requests).toHaveLength(4);
  });

  it('re-runs nothing that is cached', async () => {
    fake.reset();
    const { samples } = await run('second');
    expect(fake.requests).toHaveLength(0);
    expect(samples.every((s) => s.cached)).toBe(true);
    expect(samples[1]?.status).toBe('invalid-output');
  });

  it('only computes new configs', async () => {
    fake.reset();
    config = { ...config, settings: [...config.settings, { name: 'top5', topK: 5, describe: false }] };
    const { summary } = await run('third');
    expect(summary.configs.map((c) => c.id)).toEqual(['two-stage__qwen2.5vl-7b__top3', 'two-stage__qwen2.5vl-7b__top5']);
    // Warmup plus three images, for the new config only
    expect(fake.requests).toHaveLength(4);
  });
});

describe('configHash', () => {
  const [base] = expandConfig({ modes: ['two-stage'], models: ['m'], settings: [{ name: 'a', topK: 3 }] });

  it('ignores the setting name but not the settings', () => {
    expect(configHash({ ...base!, settings: { name: 'b', topK: 3 } })).toBe(configHash(base!));
    expect(configHash({ ...base!, settings: { name: 'a', topK: 5 } })).not.toBe(configHash(base!));
    expect(configHash({ ...base!, mode: 'single' })).not.toBe(configHash(base!));
  });
});
