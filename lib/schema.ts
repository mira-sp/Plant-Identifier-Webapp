import { z } from 'zod';

// Single source of truth for the plant result: TS types, runtime
// validation of model output, and the JSON schema sent to Ollama.

export const REGIONS = [
  'North America',
  'South America',
  'Europe',
  'Africa',
  'Asia',
  'Australia'
] as const;

export const regionSchema = z.enum(REGIONS);

export const careInfoSchema = z.object({
  light: z.string(),
  water: z.string(),
  temperature: z.string(),
  soil: z.string(),
  humidity: z.string()
});

export const plantResultSchema = z.object({
  name: z.string(),
  scientificName: z.string(),
  description: z.string(),
  careInfo: careInfoSchema,
  funFacts: z.array(z.string()),
  nativeRegions: z.array(regionSchema)
});

export type Region = z.infer<typeof regionSchema>;
export type CareInfo = z.infer<typeof careInfoSchema>;
export type PlantResult = z.infer<typeof plantResultSchema>;

export type IdentifyError = { error: string };

// Passed as Ollama's `format` to constrain the model's output
export const plantResultJsonSchema = z.toJSONSchema(plantResultSchema);
