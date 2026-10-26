import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  buildClassifyPrompt,
  buildDescribePrompt,
  buildSinglePrompt,
  identifyPlant,
  InvalidModelOutputError,
  type IdentifyOptions,
  type IdentifyOutcome,
  type PipelineMode
} from '@/lib/pipeline';
import { classificationSchema, combinedResultSchema, plantDetailsSchema } from '@/lib/schema';
import type { EvalConfig, EvalSettings } from '../config';
import { DATA_DIR, EVAL_DIR, splitOf, toJsonl, type ManifestEntry } from './manifest';
import { summarize, type Sample } from './metrics';
import { renderMarkdown, type RunSummary } from './report';
import { sameGenus, sameSpecies, Taxonomy } from './taxonomy';

export const CACHE_DIR = path.join(EVAL_DIR, 'cache');
export const RUNS_DIR = path.join(EVAL_DIR, 'runs');

export type RunConfig = {
  id: string;
  mode: PipelineMode;
  model: string;
  settings: EvalSettings;
};

// What a cache entry stores: the raw pipeline result, before scoring
type CachedResult =
  | { status: 'ok'; outcome: IdentifyOutcome }
  | { status: 'invalid-output'; stage: string; error: string };

const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

export function expandConfig(config: EvalConfig): RunConfig[] {
  return config.modes.flatMap((mode) =>
    config.models.flatMap((model) =>
      config.settings.map((settings) => ({
        id: `${mode}__${model.replace(/[^\w.-]+/g, '-')}__${settings.name}`,
        mode,
        model,
        settings
      }))
    )
  );
}

export function pipelineOptions(run: RunConfig, host?: string): IdentifyOptions {
  return {
    mode: run.mode,
    host,
    classifyModel: run.model,
    describeModel: run.settings.describeModel,
    topK: run.settings.topK,
    describe: run.settings.describe,
    describeWithImage: run.settings.describeWithImage
  };
}

// Changes whenever anything that affects the model's answer changes:
// mode, models, settings, prompts or output schemas. Not the host.
export function configHash(run: RunConfig): string {
  const { host: _host, ...options } = pipelineOptions(run);
  const topK = options.topK ?? 3;
  const describes = run.mode === 'two-stage' && options.describe !== false;
  const inputs =
    run.mode === 'single'
      ? [buildSinglePrompt(topK), z.toJSONSchema(combinedResultSchema)]
      : [
          buildClassifyPrompt(topK),
          z.toJSONSchema(classificationSchema),
          ...(describes
            ? [buildDescribePrompt({ scientificName: '<species>', commonName: '<common>' }, !!options.describeWithImage), z.toJSONSchema(plantDetailsSchema)]
            : [])
        ];
  return sha256(JSON.stringify({ options, inputs }));
}

async function runPipeline(image: Uint8Array, run: RunConfig, host?: string): Promise<CachedResult> {
  try {
    return { status: 'ok', outcome: await identifyPlant(image, pipelineOptions(run, host)) };
  } catch (error) {
    // Invalid output is a result worth measuring; anything else (Ollama
    // down, model missing) aborts the run instead of polluting the cache
    if (error instanceof InvalidModelOutputError) {
      return { status: 'invalid-output', stage: error.stage, error: error.message };
    }
    throw error;
  }
}

export async function scoreSample(
  entry: ManifestEntry,
  base: Pick<Sample, 'configId' | 'imageHash' | 'cached'>,
  result: CachedResult,
  taxonomy: Taxonomy
): Promise<Sample> {
  const outcome = result.status === 'ok' ? result.outcome : null;
  const candidates = outcome?.candidates ?? [];
  const unresolved: string[] = [];

  const resolve = async (name: string) => {
    const taxon = await taxonomy.resolve(name);
    if (!taxon) unresolved.push(name);
    return taxon;
  };

  let speciesRank: number | null = null;
  let genusTop1 = false;
  if (entry.scientificName !== null && candidates.length > 0) {
    const label = await resolve(entry.scientificName);
    for (const [index, candidate] of candidates.entries()) {
      const predicted = await resolve(candidate.scientificName);
      if (index === 0) genusTop1 = sameGenus(label, entry.scientificName, predicted, candidate.scientificName);
      if (speciesRank === null && sameSpecies(label, entry.scientificName, predicted, candidate.scientificName)) {
        speciesRank = index + 1;
      }
    }
  }

  return {
    ...base,
    file: entry.file,
    split: splitOf(entry),
    label: entry.scientificName,
    status: result.status,
    ...(result.status === 'invalid-output' && { invalidStage: result.stage, error: result.error }),
    isPlant: outcome?.isPlant ?? null,
    candidates,
    timings: outcome?.timings ?? null,
    speciesRank,
    genusTop1,
    unresolved
  };
}

export type RunOptions = {
  config: EvalConfig;
  entries: ManifestEntry[];
  manifestEntries?: number;
  runId?: string;
  useCache?: boolean;
  // Only run configs whose id contains this
  only?: string;
  dataDir?: string;
  cacheDir?: string;
  runsDir?: string;
  taxonomy?: Taxonomy;
  log?: (line: string) => void;
};

export async function runEval({
  config,
  entries,
  manifestEntries = entries.length,
  runId = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15),
  useCache = true,
  only,
  dataDir = DATA_DIR,
  cacheDir = CACHE_DIR,
  runsDir = RUNS_DIR,
  taxonomy,
  log = console.log
}: RunOptions): Promise<{ summary: RunSummary; samples: Sample[]; dir: string }> {
  taxonomy ??= await Taxonomy.load();
  const present = entries.filter((entry) => existsSync(path.join(dataDir, entry.file)));
  if (present.length < entries.length) {
    log(`${entries.length - present.length} of ${entries.length} images are missing on disk and will be skipped. Run: npm run eval:data -- download`);
  }

  const images = await Promise.all(
    present.map(async (entry) => {
      const bytes = new Uint8Array(await readFile(path.join(dataDir, entry.file)));
      return { entry, bytes, hash: sha256(bytes) };
    })
  );

  await mkdir(cacheDir, { recursive: true });
  const allSamples: Sample[] = [];
  const configs: RunSummary['configs'] = [];

  const runs = expandConfig(config).filter((run) => !only || run.id.includes(only));
  if (runs.length === 0) throw new Error(`No config id contains "${only}"`);

  for (const run of runs) {
    const hash = configHash(run);
    const cachePath = (imageHash: string) => path.join(cacheDir, `${sha256(imageHash + hash)}.json`);
    log(`\n${run.id} (${hash.slice(0, 8)})`);

    let warmedUp = !config.warmup;
    const samples: Sample[] = [];
    for (const [index, { entry, bytes, hash: imageHash }] of images.entries()) {
      const file = cachePath(imageHash);
      let result: CachedResult | null = null;
      if (useCache && existsSync(file)) result = JSON.parse(await readFile(file, 'utf8')) as CachedResult;
      const cached = result !== null;

      if (!result) {
        if (!warmedUp) {
          await runPipeline(bytes, run, config.host);
          warmedUp = true;
        }
        result = await runPipeline(bytes, run, config.host);
        await writeFile(file, JSON.stringify(result));
      }

      const sample = await scoreSample(entry, { configId: run.id, imageHash, cached }, result, taxonomy);
      samples.push(sample);
      log(`  ${index + 1}/${images.length} ${describeSample(sample)}`);
    }

    const bySplit = Object.groupBy(samples, (s) => s.split);
    configs.push({
      id: run.id,
      config: { mode: run.mode, model: run.model, ...run.settings, hash },
      splits: {
        all: summarize(samples),
        ...Object.fromEntries(Object.entries(bySplit).map(([split, list]) => [split, summarize(list ?? [])]))
      }
    });
    allSamples.push(...samples);
  }

  await taxonomy.save();

  const summary: RunSummary = {
    runId,
    createdAt: new Date().toISOString(),
    manifestEntries,
    missingImages: entries.length - present.length,
    configs
  };
  const dir = path.join(runsDir, runId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'samples.jsonl'), toJsonl(allSamples));
  await writeFile(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  await writeFile(path.join(dir, 'summary.md'), renderMarkdown(summary));
  return { summary, samples: allSamples, dir };
}

function describeSample(s: Sample): string {
  const tag = s.cached ? ' (cached)' : '';
  const time = s.timings ? ` ${(s.timings.totalMs / 1000).toFixed(1)}s` : '';
  if (s.status === 'invalid-output') return `${s.file}: invalid ${s.invalidStage} output${tag}`;
  if (s.label === null) return `${s.file}: ${s.isPlant ? `✗ said ${s.candidates[0]?.scientificName}` : '✓ not a plant'}${time}${tag}`;
  const top = s.candidates[0];
  const verdict = s.speciesRank === 1 ? '✓' : s.speciesRank ? `top-${s.speciesRank}` : '✗';
  return `${s.file}: ${verdict} ${top ? `${top.scientificName} (${top.confidence.toFixed(2)})` : 'not a plant'}${time}${tag}`;
}
