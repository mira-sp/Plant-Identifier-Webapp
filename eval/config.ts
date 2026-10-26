import type { PipelineMode } from '@/lib/pipeline';

// What `npm run eval` compares: every mode × model × settings combination
// becomes one config. Results are cached per image and config, so adding
// a row here only runs the new combinations.

export type EvalSettings = {
  // Used in the config id, keep it short
  name: string;
  topK?: number;
  // false stops after identification: faster, but no describe latency
  describe?: boolean;
  describeWithImage?: boolean;
  describeModel?: string;
};

export type EvalConfig = {
  host?: string;
  modes: PipelineMode[];
  models: string[];
  settings: EvalSettings[];
  // One untimed call per config first, so model loading isn't in p95
  warmup?: boolean;
};

const config: EvalConfig = {
  modes: ['two-stage', 'single'],
  models: [process.env.OLLAMA_MODEL ?? 'qwen2.5vl:7b'],
  settings: [{ name: 'top3', topK: 3 }],
  warmup: true
};

export default config;
