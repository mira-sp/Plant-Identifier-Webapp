import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDetails, startFakeOllama, type FakeOllama } from '@/test/mocks/ollama';
import { POST } from './route';

let fake: FakeOllama;

beforeAll(async () => {
  fake = await startFakeOllama();
  vi.stubEnv('OLLAMA_HOST', fake.url);
  vi.stubEnv('OLLAMA_MODEL', 'qwen2.5vl:7b');
  vi.stubEnv('PIPELINE_MODE', 'two-stage');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await fake.close();
});
beforeEach(() => fake.reset());

function upload(file?: File) {
  const body = new FormData();
  if (file) body.append('image', file);
  return POST(new Request('http://localhost/api/identify', { method: 'POST', body }));
}

const photo = () => new File([new Uint8Array([1, 2, 3])], 'plant.jpg', { type: 'image/jpeg' });

describe('POST /api/identify', () => {
  it('returns the identified plant', async () => {
    const response = await upload(photo());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      name: 'Swiss cheese plant',
      scientificName: 'Monstera deliciosa',
      ...fakeDetails
    });
  });

  it('returns 400 without an image', async () => {
    const response = await upload();
    expect(response.status).toBe(400);
    expect(fake.requests).toHaveLength(0);
  });

  it('returns 422 when the photo shows no plant', async () => {
    fake.enqueue({ content: { isPlant: false, candidates: [] } });
    const response = await upload(photo());
    expect(response.status).toBe(422);
    expect((await response.json()).error).toMatch(/couldn't find a plant/);
  });

  it('returns 502 on invalid model output', async () => {
    fake.enqueue({ content: 'not json' });
    const response = await upload(photo());
    expect(response.status).toBe(502);
    expect((await response.json()).error).toMatch(/incomplete plant data/);
  });

  it('returns 502 with a pull hint when the model is missing', async () => {
    vi.stubEnv('OLLAMA_MODEL', 'llava:13b');
    try {
      const response = await upload(photo());
      expect(response.status).toBe(502);
      expect((await response.json()).error).toBe('Model "llava:13b" is not installed. Run: ollama pull llava:13b');
    } finally {
      vi.stubEnv('OLLAMA_MODEL', 'qwen2.5vl:7b');
    }
  });

  it('returns 503 when Ollama is not running', async () => {
    vi.stubEnv('OLLAMA_HOST', 'http://127.0.0.1:1');
    try {
      const response = await upload(photo());
      expect(response.status).toBe(503);
    } finally {
      vi.stubEnv('OLLAMA_HOST', fake.url);
    }
  });
});
