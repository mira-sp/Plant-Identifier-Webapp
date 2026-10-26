import { NextResponse } from 'next/server';
import type { IdentifyError, PlantResult } from '@/lib/schema';
import {
  identifyPlant,
  InvalidModelOutputError,
  ModelNotInstalledError,
  OllamaUnavailableError
} from '@/lib/pipeline';

type ErrorResponse = NextResponse<IdentifyError>;

const fail = (error: string, status: number): ErrorResponse => NextResponse.json({ error }, { status });

function mapError(error: unknown): ErrorResponse {
  if (error instanceof OllamaUnavailableError) {
    return fail('The local AI model is not running. Start Ollama and try again.', 503);
  }
  if (error instanceof ModelNotInstalledError) {
    return fail(`Model "${error.model}" is not installed. Run: ollama pull ${error.model}`, 502);
  }
  if (error instanceof InvalidModelOutputError) {
    return fail('The local AI model returned incomplete plant data. Please try again.', 502);
  }
  return fail('Failed to identify plant', 500);
}

export async function POST(request: Request): Promise<NextResponse<PlantResult | IdentifyError>> {
  let image: File;
  try {
    const formData = await request.formData();
    const value = formData.get('image');
    if (!(value instanceof File)) return fail('No image provided', 400);
    image = value;
  } catch {
    return fail('No image provided', 400);
  }

  try {
    const { plant } = await identifyPlant(new Uint8Array(await image.arrayBuffer()), { signal: request.signal });
    if (!plant) {
      return fail("We couldn't find a plant in this photo. Try a closer shot of the leaves or flowers.", 422);
    }
    return NextResponse.json(plant);
  } catch (error) {
    console.error('Plant identification error:', error);
    return mapError(error);
  }
}
