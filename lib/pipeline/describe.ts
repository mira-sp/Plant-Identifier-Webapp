import { plantDetailsSchema, REGIONS, type Candidate, type PlantDetails } from '@/lib/schema';
import { chatJson, type ChatOptions } from './ollama';

// Stage 2: known species (+ optionally the image) → description and care info

export const buildDescribePrompt = (species: Pick<Candidate, 'scientificName' | 'commonName'>, withImage: boolean) => `
  The plant is ${species.scientificName} (${species.commonName || 'no common name'}).
  ${withImage ? 'The attached image shows the plant. Use it only for context; do not change the species.' : ''}
  Describe this species.
  - description: A paragraph describing the plant
  - careInfo: light, water, temperature, soil and humidity requirements
  - funFacts: 3-5 interesting facts about the plant
  - nativeRegions: Regions where this plant is native. Only use: ${REGIONS.join(', ')}. If unknown, use an empty array.

  Respond with JSON only.
`;

export async function describe(
  species: Pick<Candidate, 'scientificName' | 'commonName'>,
  image: string | null,
  options: ChatOptions
): Promise<PlantDetails> {
  const prompt = buildDescribePrompt(species, image !== null);
  return chatJson('describe', plantDetailsSchema, prompt, image ? [image] : [], options);
}
