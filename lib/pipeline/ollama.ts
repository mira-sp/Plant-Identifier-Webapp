import { z } from 'zod';

// Shared Ollama client for the pipeline stages. Every call sends a JSON
// schema as `format` and validates the reply with the same zod schema.

export type Stage = 'classify' | 'describe' | 'single';

export class PipelineError extends Error {}

export class OllamaUnavailableError extends PipelineError {
  constructor(readonly host: string, options?: ErrorOptions) {
    super(`Could not reach Ollama at ${host}`, options);
  }
}

export class ModelNotInstalledError extends PipelineError {
  constructor(readonly model: string) {
    super(`Model "${model}" is not installed`);
  }
}

export class OllamaRequestError extends PipelineError {
  constructor(readonly status: number, readonly details: string) {
    super(`Ollama returned ${status}: ${details}`);
  }
}

// The model answered, but not with data matching the schema
export class InvalidModelOutputError extends PipelineError {
  constructor(readonly stage: Stage, readonly raw: string, readonly reason: string) {
    super(`Invalid ${stage} output: ${reason}`);
  }
}

export type ChatOptions = {
  host: string;
  model: string;
  signal?: AbortSignal;
};

export async function chatJson<T>(
  stage: Stage,
  schema: z.ZodType<T>,
  prompt: string,
  images: string[],
  { host, model, signal }: ChatOptions
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt, ...(images.length > 0 && { images }) }],
        format: z.toJSONSchema(schema),
        stream: false,
        options: { temperature: 0 }
      }),
      signal
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new OllamaUnavailableError(host, { cause: error });
  }

  if (!response.ok) {
    const details = await response.text();
    if (response.status === 404) throw new ModelNotInstalledError(model);
    throw new OllamaRequestError(response.status, details);
  }

  const { message } = (await response.json()) as { message?: { content?: string } };
  const content = message?.content ?? '';

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new InvalidModelOutputError(stage, content, 'not valid JSON');
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidModelOutputError(stage, content, z.prettifyError(parsed.error));
  }
  return parsed.data;
}
