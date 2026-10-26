import type { Candidate, PlantDetails, PlantResult } from '@/lib/schema';
import { classify, classifyAndDescribe } from './classify';
import { describe } from './describe';
import type { Stage } from './ollama';

export * from './ollama';
export { buildClassifyPrompt, buildSinglePrompt } from './classify';
export { buildDescribePrompt } from './describe';

// The API route and the eval script both call identifyPlant(), so the
// eval measures exactly the code that runs in production.

export type PipelineMode = 'two-stage' | 'single';

export type IdentifyOptions = {
  mode?: PipelineMode;
  host?: string;
  classifyModel?: string;
  // Two-stage only; defaults to classifyModel
  describeModel?: string;
  topK?: number;
  // Set to false to stop after identification (two-stage only)
  describe?: boolean;
  // Also send the image to the describe stage
  describeWithImage?: boolean;
  signal?: AbortSignal;
};

export type Timings = {
  totalMs: number;
  stages: Partial<Record<Stage, number>>;
};

export type IdentifyOutcome = {
  isPlant: boolean;
  // Ranked, at most topK; empty when isPlant is false
  candidates: Candidate[];
  // Top candidate plus details; null if not a plant or describe was skipped
  plant: PlantResult | null;
  timings: Timings;
};

export function resolveOptions(options: IdentifyOptions = {}): Required<Omit<IdentifyOptions, 'signal'>> {
  const classifyModel = options.classifyModel ?? process.env.OLLAMA_MODEL ?? 'qwen2.5vl:7b';
  return {
    mode: options.mode ?? (process.env.PIPELINE_MODE as PipelineMode | undefined) ?? 'two-stage',
    host: options.host ?? process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
    classifyModel,
    describeModel: options.describeModel ?? process.env.OLLAMA_DESCRIBE_MODEL ?? classifyModel,
    topK: options.topK ?? 3,
    describe: options.describe ?? true,
    describeWithImage: options.describeWithImage ?? false
  };
}

async function timed<T>(stages: Timings['stages'], stage: Stage, run: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await run();
  } finally {
    stages[stage] = performance.now() - start;
  }
}

const toPlant = (top: Candidate, details: PlantDetails): PlantResult => ({
  name: top.commonName || top.scientificName,
  scientificName: top.scientificName,
  ...details
});

export async function identifyPlant(image: Uint8Array, options: IdentifyOptions = {}): Promise<IdentifyOutcome> {
  const opts = resolveOptions(options);
  const base64 = Buffer.from(image).toString('base64');
  const stages: Timings['stages'] = {};
  const start = performance.now();
  const finish = (result: Omit<IdentifyOutcome, 'timings'>): IdentifyOutcome => ({
    ...result,
    timings: { totalMs: performance.now() - start, stages }
  });

  if (opts.mode === 'single') {
    const { classification, details } = await timed(stages, 'single', () =>
      classifyAndDescribe(base64, opts.topK, { host: opts.host, model: opts.classifyModel, signal: options.signal })
    );
    const top = classification.candidates[0];
    return finish({ ...classification, plant: top ? toPlant(top, details) : null });
  }

  const classification = await timed(stages, 'classify', () =>
    classify(base64, opts.topK, { host: opts.host, model: opts.classifyModel, signal: options.signal })
  );
  const top = classification.candidates[0];
  if (!top || !opts.describe) return finish({ ...classification, plant: null });

  const details = await timed(stages, 'describe', () =>
    describe(top, opts.describeWithImage ? base64 : null, {
      host: opts.host,
      model: opts.describeModel,
      signal: options.signal
    })
  );
  return finish({ ...classification, plant: toPlant(top, details) });
}
