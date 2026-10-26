import type { Percentiles, Rate, Summary } from './metrics';

export type ConfigSummary = {
  id: string;
  config: Record<string, unknown>;
  splits: Record<string, Summary>;
};

export type RunSummary = {
  runId: string;
  createdAt: string;
  manifestEntries: number;
  missingImages: number;
  configs: ConfigSummary[];
};

const pct = (value: number | null) => (value === null ? '–' : `${(value * 100).toFixed(1)}%`);
const fmtRate = (r: Rate) => (r.n === 0 ? '–' : `${pct(r.rate)} (${r.hits}/${r.n})`);
const fmtMs = (ms: number | null) => (ms === null ? '–' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`);
const fmtLatency = (p: Percentiles) => `${fmtMs(p.p50)} / ${fmtMs(p.p95)}`;

function table(header: string[], rows: string[][]) {
  return [
    `| ${header.join(' | ')} |`,
    `|${header.map((_, i) => (i === 0 ? '---' : '---:')).join('|')}|`,
    ...rows.map((row) => `| ${row.join(' | ')} |`)
  ].join('\n');
}

export function renderMarkdown(run: RunSummary): string {
  const splitNames = [...new Set(run.configs.flatMap((c) => Object.keys(c.splits)))];
  const sections = [
    `# Eval run ${run.runId}`,
    `${run.createdAt} · ${run.manifestEntries} manifest entries` +
      (run.missingImages > 0 ? ` · ${run.missingImages} images missing on disk (skipped)` : '')
  ];

  for (const split of splitNames) {
    const rows = run.configs
      .filter((c) => c.splits[split])
      .map((c) => {
        const s = c.splits[split]!;
        return split === 'non-plant'
          ? [c.id, String(s.n), fmtRate(s.abstention), fmtRate(s.schemaValid), fmtLatency(s.latency.total)]
          : [
              c.id,
              String(s.n),
              fmtRate(s.speciesTop1),
              fmtRate(s.speciesTop3),
              fmtRate(s.genusTop1),
              fmtRate(s.abstention),
              fmtRate(s.falseAbstention),
              fmtRate(s.schemaValid),
              fmtLatency(s.latency.total)
            ];
      });
    const header =
      split === 'non-plant'
        ? ['Config', 'n', 'Abstained', 'Schema valid', 'Latency p50 / p95']
        : ['Config', 'n', 'Species top-1', 'Species top-3', 'Genus top-1', 'Abstention (non-plants)', 'False abstention', 'Schema valid', 'Latency p50 / p95'];
    sections.push(`## Split: ${split}`, table(header, rows));
  }

  sections.push('## Latency by stage (all images)');
  for (const c of run.configs) {
    const stages = Object.entries(c.splits.all?.latency.stages ?? {});
    if (stages.length === 0) continue;
    sections.push(`**${c.id}**`, table(['Stage', 'n', 'p50 / p95'], stages.map(([stage, p]) => [stage, String(p.n), fmtLatency(p)])));
  }

  sections.push(
    '## Calibration (all plant images)',
    'Top-1 confidence against species top-1 accuracy. The threshold table shows how many answers remain, and how accurate they are, if the app only shows a single answer at or above that confidence.'
  );
  for (const c of run.configs) {
    const cal = c.splits.all?.calibration;
    if (!cal) continue;
    sections.push(
      `### ${c.id}`,
      `ECE: ${cal.ece === null ? '–' : cal.ece.toFixed(3)}`,
      table(
        ['Confidence', 'n', 'Mean confidence', 'Accuracy'],
        cal.buckets.map((b) => [`${b.from.toFixed(1)}–${b.to.toFixed(1)}`, String(b.n), pct(b.meanConfidence), pct(b.accuracy)])
      ),
      table(
        ['Threshold', 'Coverage', 'Accuracy'],
        cal.thresholds.map((t) => [`≥ ${t.threshold.toFixed(1)}`, pct(t.coverage), pct(t.accuracy)])
      )
    );
  }

  return sections.join('\n\n') + '\n';
}
