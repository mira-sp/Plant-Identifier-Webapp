import { classificationSchema, combinedResultSchema, REGIONS, type Classification } from '@/lib/schema';
import { chatJson, InvalidModelOutputError, type ChatOptions } from './ollama';

// Stage 1: image → top-k species candidates. Uses the vision model for
// now; a dedicated classifier can replace it behind the same signature.

const candidateInstructions = (topK: number) => `
  - isPlant: false if the image does not show a plant, otherwise true
  - candidates: up to ${topK} likely species, most likely first. For each:
    - scientificName: binomial scientific name (genus and species)
    - commonName: common English name
    - confidence: probability from 0 to 1 that this is the correct species.
      The confidences of all candidates must add up to at most 1.
  If isPlant is false, candidates must be empty.
`;

export const buildClassifyPrompt = (topK: number) => `
  Identify the plant species in this image.
  ${candidateInstructions(topK)}
  Respond with JSON only.
`;

// Single mode asks for identification and care info in one response
export const buildSinglePrompt = (topK: number) => `
  Identify the plant in this image and describe it.
  ${candidateInstructions(topK)}
  - description: A paragraph describing the most likely species
  - careInfo: light, water, temperature, soil and humidity requirements
  - funFacts: 3-5 interesting facts about the plant
  - nativeRegions: Regions where this plant is native. Only use: ${REGIONS.join(', ')}. If unknown, use an empty array.

  If the image does not show a plant, leave the description fields empty.
  Respond with JSON only.
`;

// Rank by confidence, keep the top k, and reject plants with no candidates
export function rankCandidates(result: Classification, topK: number, raw: string, stage: 'classify' | 'single'): Classification {
  if (!result.isPlant) return { isPlant: false, candidates: [] };
  if (result.candidates.length === 0) {
    throw new InvalidModelOutputError(stage, raw, 'isPlant is true but no candidates were returned');
  }
  const candidates = [...result.candidates]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topK);
  return { isPlant: true, candidates };
}

export async function classify(image: string, topK: number, options: ChatOptions): Promise<Classification> {
  const result = await chatJson('classify', classificationSchema, buildClassifyPrompt(topK), [image], options);
  return rankCandidates(result, topK, JSON.stringify(result), 'classify');
}

export async function classifyAndDescribe(image: string, topK: number, options: ChatOptions) {
  const result = await chatJson('single', combinedResultSchema, buildSinglePrompt(topK), [image], options);
  const { isPlant, candidates, ...details } = result;
  return {
    classification: rankCandidates({ isPlant, candidates }, topK, JSON.stringify(result), 'single'),
    details
  };
}
