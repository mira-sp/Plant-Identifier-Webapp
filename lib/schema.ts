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

// Stage 1 output: ranked species candidates, or an abstention
export const candidateSchema = z.object({
  scientificName: z.string().min(1),
  commonName: z.string(),
  confidence: z.number().min(0).max(1)
});

export const classificationSchema = z.object({
  isPlant: z.boolean(),
  candidates: z.array(candidateSchema)
});

// Stage 2 output: everything about the plant except its identity
export const plantDetailsSchema = plantResultSchema.pick({
  description: true,
  careInfo: true,
  funFacts: true,
  nativeRegions: true
});

// Single-call mode: both stages in one model response
export const combinedResultSchema = classificationSchema.extend(plantDetailsSchema.shape);

export type Region = z.infer<typeof regionSchema>;
export type CareInfo = z.infer<typeof careInfoSchema>;
export type PlantResult = z.infer<typeof plantResultSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type PlantDetails = z.infer<typeof plantDetailsSchema>;

export type IdentifyError = { error: string };
