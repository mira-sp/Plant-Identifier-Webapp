import type { Candidate } from '@/lib/schema';
import type { Timings } from '@/lib/pipeline';
import type { Split } from './manifest';

// One scored line of samples.jsonl
export type Sample = {
  configId: string;
  file: string;
  split: Split;
  imageHash: string;
  label: string | null;
  // 'invalid-output': the model's reply failed schema validation
  status: 'ok' | 'invalid-output';
  invalidStage?: string;
  error?: string;
  isPlant: boolean | null;
  candidates: Candidate[];
  timings: Timings | null;
  cached: boolean;
  // 1-based rank of the first candidate of the right species, null if none
  speciesRank: number | null;
  genusTop1: boolean;
  // Names that GBIF could not resolve (fell back to text matching)
  unresolved: string[];
};

export type Rate = { hits: number; n: number; rate: number | null };
export type Percentiles = { p50: number | null; p95: number | null; n: number };

export type CalibrationBucket = {
  from: number;
  to: number;
  n: number;
  meanConfidence: number | null;
  accuracy: number | null;
};

// Accuracy and coverage if the app only gave one answer at or above `threshold`
export type ThresholdRow = { threshold: number; coverage: number | null; accuracy: number | null };

export type Summary = {
  n: number;
  schemaValid: Rate;
  speciesTop1: Rate;
  speciesTop3: Rate;
  genusTop1: Rate;
  // Non-plant images where the model said "not a plant"
  abstention: Rate;
  // Plant images where the model said "not a plant"
  falseAbstention: Rate;
  latency: { total: Percentiles; stages: Record<string, Percentiles> };
  calibration: { buckets: CalibrationBucket[]; ece: number | null; thresholds: ThresholdRow[] };
};

const rate = (hits: number, n: number): Rate => ({ hits, n, rate: n === 0 ? null : hits / n });

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower);
}

const percentiles = (values: number[]): Percentiles => ({
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  n: values.length
});

const mean = (values: number[]) => (values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length);

export function calibration(points: { confidence: number; correct: boolean }[], bucketCount = 10) {
  const buckets: CalibrationBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const from = i / bucketCount;
    const to = (i + 1) / bucketCount;
    const inBucket = points.filter(
      (p) => p.confidence >= from && (i === bucketCount - 1 ? p.confidence <= to : p.confidence < to)
    );
    return {
      from,
      to,
      n: inBucket.length,
      meanConfidence: mean(inBucket.map((p) => p.confidence)),
      accuracy: mean(inBucket.map((p) => (p.correct ? 1 : 0)))
    };
  });

  // Expected calibration error: bucket-size-weighted |accuracy - confidence|
  const ece =
    points.length === 0
      ? null
      : buckets.reduce((sum, b) => sum + (b.n / points.length) * Math.abs((b.accuracy ?? 0) - (b.meanConfidence ?? 0)), 0);

  const thresholds: ThresholdRow[] = Array.from({ length: bucketCount }, (_, i) => {
    const threshold = i / bucketCount;
    const above = points.filter((p) => p.confidence >= threshold);
    return {
      threshold,
      coverage: points.length === 0 ? null : above.length / points.length,
      accuracy: mean(above.map((p) => (p.correct ? 1 : 0)))
    };
  });

  return { buckets, ece, thresholds };
}

export function summarize(samples: Sample[]): Summary {
  const answered = samples.filter((s) => s.status === 'ok');
  // Invalid outputs count as wrong: that is what the user would see
  const plants = samples.filter((s) => s.split !== 'non-plant');
  const nonPlants = samples.filter((s) => s.split === 'non-plant');
  const count = (list: Sample[], test: (s: Sample) => boolean) => list.filter(test).length;

  const stageNames = [...new Set(answered.flatMap((s) => Object.keys(s.timings?.stages ?? {})))];
  const stages = Object.fromEntries(
    stageNames.map((stage) => [
      stage,
      percentiles(answered.flatMap((s) => s.timings?.stages[stage as keyof Timings['stages']] ?? []))
    ])
  );

  const calibrationPoints = plants
    .filter((s) => s.status === 'ok' && s.candidates[0])
    .map((s) => ({ confidence: s.candidates[0]!.confidence, correct: s.speciesRank === 1 }));

  return {
    n: samples.length,
    schemaValid: rate(answered.length, samples.length),
    speciesTop1: rate(count(plants, (s) => s.speciesRank === 1), plants.length),
    speciesTop3: rate(count(plants, (s) => s.speciesRank !== null && s.speciesRank <= 3), plants.length),
    genusTop1: rate(count(plants, (s) => s.genusTop1), plants.length),
    abstention: rate(count(nonPlants, (s) => s.isPlant === false), nonPlants.length),
    falseAbstention: rate(count(plants, (s) => s.isPlant === false), plants.length),
    latency: { total: percentiles(answered.flatMap((s) => s.timings?.totalMs ?? [])), stages },
    calibration: calibration(calibrationPoints)
  };
}
