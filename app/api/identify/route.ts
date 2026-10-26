import { NextResponse } from 'next/server';
import { REGIONS, plantResultJsonSchema, plantResultSchema, type IdentifyError, type PlantResult } from '@/lib/schema';

// Local Ollama server; images never leave this machine
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5vl:7b';

const prompt = `
  Identify the plant in this image.
  - name: Common name of the plant
  - scientificName: Scientific name
  - description: A paragraph describing the plant
  - careInfo: light, water, temperature, soil and humidity requirements
  - funFacts: 3-5 interesting facts about the plant
  - nativeRegions: Regions where this plant is native. Only use: ${REGIONS.join(', ')}. If unknown, use an empty array.

  If the image does not show a plant, set name to "Unknown" and leave the other fields empty.
  Respond with JSON only.
`;

export async function POST(request: Request): Promise<NextResponse<PlantResult | IdentifyError>> {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const base64Data = Buffer.from(await imageFile.arrayBuffer()).toString('base64');

    let ollamaResponse: Response;
    try {
      ollamaResponse = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [{ role: 'user', content: prompt, images: [base64Data] }],
          format: plantResultJsonSchema,
          stream: false,
          options: { temperature: 0 }
        })
      });
    } catch (connectionError) {
      console.error('Could not reach Ollama:', connectionError);
      return NextResponse.json(
        { error: 'The local AI model is not running. Start Ollama and try again.' },
        { status: 503 }
      );
    }

    if (!ollamaResponse.ok) {
      const details = await ollamaResponse.text();
      console.error('Ollama error:', ollamaResponse.status, details);
      const error = ollamaResponse.status === 404
        ? `Model "${OLLAMA_MODEL}" is not installed. Run: ollama pull ${OLLAMA_MODEL}`
        : 'The local AI model failed to analyse the image.';
      return NextResponse.json({ error }, { status: 502 });
    }

    const { message } = (await ollamaResponse.json()) as { message?: { content?: string } };

    let raw: unknown;
    try {
      raw = JSON.parse(message?.content ?? '');
    } catch (parseError) {
      console.error('Error parsing plant data:', parseError, message?.content);
      return NextResponse.json(
        { error: 'Could not parse plant identification data' },
        { status: 500 }
      );
    }

    const parsed = plantResultSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('Model output failed validation:', parsed.error.issues);
      return NextResponse.json(
        { error: 'The local AI model returned incomplete plant data. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Plant identification error:', error);
    return NextResponse.json(
      { error: 'Failed to identify plant' },
      { status: 500 }
    );
  }
}
