import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import type { EvalConfig } from '../eval/config';
import { readManifest, splitOf } from '../eval/lib/manifest';
import { runEval } from '../eval/lib/run';

// npm run eval -- [--config eval/config.ts] [--only <id part>] [--split personal|public|non-plant]
//                 [--limit <about n images>] [--no-cache] [--run-id <id>]

const { values } = parseArgs({
  options: {
    config: { type: 'string', default: 'eval/config.ts' },
    only: { type: 'string' },
    split: { type: 'string', multiple: true },
    limit: { type: 'string' },
    'no-cache': { type: 'boolean', default: false },
    'run-id': { type: 'string' }
  }
});

const config: EvalConfig = (await import(pathToFileURL(path.resolve(values.config)).href)).default;
const manifest = await readManifest();
if (manifest.length === 0) {
  console.error('eval/manifest.jsonl is empty. See the "Evaluation" section in the README.');
  process.exit(1);
}

let entries = values.split ? manifest.filter((entry) => values.split!.includes(splitOf(entry))) : manifest;
if (values.limit) {
  // Every k-th entry, so a quick run still covers all splits and species
  const step = Math.max(1, Math.ceil(entries.length / Number(values.limit)));
  entries = entries.filter((_, index) => index % step === 0);
}

const { summary, dir } = await runEval({
  config,
  only: values.only,
  entries,
  manifestEntries: manifest.length,
  runId: values['run-id'],
  useCache: !values['no-cache']
});

console.log(`\nWrote ${path.relative(process.cwd(), dir)}/{samples.jsonl,summary.json,summary.md}`);
for (const c of summary.configs) {
  const all = c.splits.all!;
  const fmt = (rate: number | null) => (rate === null ? '–' : `${(rate * 100).toFixed(1)}%`);
  console.log(
    `${c.id}: top-1 ${fmt(all.speciesTop1.rate)}, top-3 ${fmt(all.speciesTop3.rate)}, ` +
      `abstention ${fmt(all.abstention.rate)}, schema ${fmt(all.schemaValid.rate)}`
  );
}
