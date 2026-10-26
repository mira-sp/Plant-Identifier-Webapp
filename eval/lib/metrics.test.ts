import { describe, expect, it } from 'vitest';
import { calibration, percentile, summarize, type Sample } from './metrics';

const sample = (overrides: Partial<Sample>): Sample => ({
  configId: 'c',
  file: 'f.jpg',
  split: 'public',
  imageHash: 'h',
  label: 'Monstera deliciosa',
  status: 'ok',
  isPlant: true,
  candidates: [{ scientificName: 'Monstera deliciosa', commonName: '', confidence: 0.9 }],
  timings: { totalMs: 1000, stages: { classify: 600, describe: 400 } },
  cached: false,
  speciesRank: 1,
  genusTop1: true,
  unresolved: [],
  ...overrides
});

describe('percentile', () => {
  it('interpolates between ranks', () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(percentile([10, 20, 30, 40, 50], 0.95)).toBe(48);
    expect(percentile([], 0.5)).toBeNull();
  });
});

describe('summarize', () => {
  const samples = [
    sample({ speciesRank: 1 }),
    sample({ speciesRank: 2, genusTop1: true, timings: { totalMs: 3000, stages: { classify: 2000, describe: 1000 } } }),
    sample({ speciesRank: null, genusTop1: false }),
    sample({ status: 'invalid-output', candidates: [], isPlant: null, speciesRank: null, genusTop1: false, timings: null }),
    sample({ split: 'personal', isPlant: false, candidates: [], speciesRank: null, genusTop1: false }),
    sample({ split: 'non-plant', label: null, isPlant: false, candidates: [], speciesRank: null, genusTop1: false }),
    sample({ split: 'non-plant', label: null, isPlant: true, speciesRank: null, genusTop1: false })
  ];
  const summary = summarize(samples);

  it('counts invalid output as wrong in accuracy', () => {
    expect(summary.speciesTop1).toEqual({ hits: 1, n: 5, rate: 0.2 });
    expect(summary.speciesTop3).toEqual({ hits: 2, n: 5, rate: 0.4 });
    expect(summary.genusTop1).toEqual({ hits: 2, n: 5, rate: 0.4 });
  });

  it('reports schema validity over all samples', () => {
    expect(summary.schemaValid).toEqual({ hits: 6, n: 7, rate: 6 / 7 });
  });

  it('separates abstention on non-plants from false abstention on plants', () => {
    expect(summary.abstention).toEqual({ hits: 1, n: 2, rate: 0.5 });
    expect(summary.falseAbstention).toEqual({ hits: 1, n: 5, rate: 0.2 });
  });

  it('reports latency overall and per stage', () => {
    expect(summary.latency.total.n).toBe(6);
    expect(summary.latency.stages.classify?.p50).toBe(600);
    expect(Object.keys(summary.latency.stages)).toEqual(['classify', 'describe']);
  });

  it('calibrates only on plant images that got an answer', () => {
    expect(summary.calibration.buckets.reduce((n, b) => n + b.n, 0)).toBe(3);
  });
});

describe('calibration', () => {
  it('buckets by confidence, with 1.0 in the top bucket', () => {
    const { buckets } = calibration([
      { confidence: 0.05, correct: false },
      { confidence: 0.95, correct: true },
      { confidence: 1, correct: false }
    ]);
    expect(buckets[0]).toMatchObject({ n: 1, accuracy: 0 });
    expect(buckets[9]).toMatchObject({ n: 2, accuracy: 0.5, meanConfidence: 0.975 });
  });

  it('is zero ECE when confidence matches accuracy', () => {
    const points = [
      ...Array.from({ length: 4 }, (_, i) => ({ confidence: 0.75, correct: i < 3 })),
      ...Array.from({ length: 4 }, (_, i) => ({ confidence: 0.25, correct: i < 1 }))
    ];
    expect(calibration(points).ece).toBeCloseTo(0);
  });

  it('reports coverage and accuracy above each threshold', () => {
    const { thresholds } = calibration([
      { confidence: 0.3, correct: false },
      { confidence: 0.8, correct: true }
    ]);
    expect(thresholds[0]).toEqual({ threshold: 0, coverage: 1, accuracy: 0.5 });
    expect(thresholds[5]).toEqual({ threshold: 0.5, coverage: 0.5, accuracy: 1 });
  });
});
