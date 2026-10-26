import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fakeCandidates, fakeDetails, startFakeOllama, type FakeOllama } from '@/test/mocks/ollama';
import {
  identifyPlant,
  InvalidModelOutputError,
  ModelNotInstalledError,
  OllamaRequestError,
  OllamaUnavailableError,
  type IdentifyOptions
} from '@/lib/pipeline';

const image = new Uint8Array([1, 2, 3, 4]);
const imageBase64 = Buffer.from(image).toString('base64');

let fake: FakeOllama;
let options: IdentifyOptions;

beforeAll(async () => {
  fake = await startFakeOllama();
});
afterAll(() => fake.close());
beforeEach(() => {
  fake.reset();
  options = { host: fake.url, classifyModel: 'qwen2.5vl:7b', mode: 'two-stage' };
});

describe('identifyPlant, two-stage', () => {
  it('classifies the image, then describes the top candidate', async () => {
    const outcome = await identifyPlant(image, options);

    expect(outcome.isPlant).toBe(true);
    expect(outcome.candidates).toEqual(fakeCandidates);
    expect(outcome.plant).toEqual({
      name: 'Swiss cheese plant',
      scientificName: 'Monstera deliciosa',
      ...fakeDetails
    });

    const [classifyRequest, describeRequest] = fake.requests;
    expect(fake.requests).toHaveLength(2);
    expect(classifyRequest?.messages[0]?.images).toEqual([imageBase64]);
    expect(classifyRequest?.options).toEqual({ temperature: 0 });
    expect(describeRequest?.messages[0]?.content).toContain('Monstera deliciosa');
    expect(describeRequest?.messages[0]?.images).toBeUndefined();
  });

  it('reports timings per stage', async () => {
    const { timings } = await identifyPlant(image, options);
    expect(Object.keys(timings.stages)).toEqual(['classify', 'describe']);
    expect(timings.totalMs).toBeGreaterThanOrEqual(timings.stages.classify! + timings.stages.describe!);
  });

  it('ranks candidates by confidence and keeps the top k', async () => {
    fake.enqueue({ content: { isPlant: true, candidates: [...fakeCandidates].reverse() } });
    const { candidates } = await identifyPlant(image, { ...options, topK: 2, describe: false });
    expect(candidates.map((c) => c.scientificName)).toEqual(['Monstera deliciosa', 'Thaumatophyllum bipinnatifidum']);
  });

  it('skips the describe stage when describe is false', async () => {
    const outcome = await identifyPlant(image, { ...options, describe: false });
    expect(outcome.plant).toBeNull();
    expect(fake.requests).toHaveLength(1);
  });

  it('sends the image to describe when describeWithImage is set, using describeModel', async () => {
    const withSecondModel = await startFakeOllama({ models: ['qwen2.5vl:7b', 'gemma3:4b'] });
    try {
      await identifyPlant(image, { ...options, host: withSecondModel.url, describeModel: 'gemma3:4b', describeWithImage: true });
      const describeRequest = withSecondModel.requests[1];
      expect(describeRequest?.model).toBe('gemma3:4b');
      expect(describeRequest?.messages[0]?.images).toEqual([imageBase64]);
    } finally {
      await withSecondModel.close();
    }
  });

  it('abstains on non-plant images without calling describe', async () => {
    fake.enqueue({ content: { isPlant: false, candidates: [] } });
    const outcome = await identifyPlant(image, options);
    expect(outcome).toMatchObject({ isPlant: false, candidates: [], plant: null });
    expect(fake.requests).toHaveLength(1);
  });
});

describe('identifyPlant, single', () => {
  it('identifies and describes in one call', async () => {
    const outcome = await identifyPlant(image, { ...options, mode: 'single' });
    expect(fake.requests).toHaveLength(1);
    expect(outcome.plant?.scientificName).toBe('Monstera deliciosa');
    expect(outcome.plant?.careInfo).toEqual(fakeDetails.careInfo);
    expect(Object.keys(outcome.timings.stages)).toEqual(['single']);
  });
});

describe('identifyPlant errors', () => {
  it('rejects output that is not JSON', async () => {
    fake.enqueue({ content: 'Sorry, I cannot help with that.' });
    await expect(identifyPlant(image, options)).rejects.toMatchObject({
      constructor: InvalidModelOutputError,
      stage: 'classify'
    });
  });

  it('rejects output that does not match the schema', async () => {
    fake.enqueue({ content: { isPlant: true, candidates: [{ scientificName: 'Monstera deliciosa', commonName: '', confidence: 82 }] } });
    await expect(identifyPlant(image, options)).rejects.toBeInstanceOf(InvalidModelOutputError);
  });

  it('rejects a plant with no candidates', async () => {
    fake.enqueue({ content: { isPlant: true, candidates: [] } });
    await expect(identifyPlant(image, options)).rejects.toBeInstanceOf(InvalidModelOutputError);
  });

  it('reports which stage failed', async () => {
    fake.enqueue({ content: { isPlant: true, candidates: fakeCandidates } }, { content: { description: 'no care info' } });
    await expect(identifyPlant(image, options)).rejects.toMatchObject({ stage: 'describe' });
  });

  it('reports a missing model', async () => {
    await expect(identifyPlant(image, { ...options, classifyModel: 'llava:13b' })).rejects.toMatchObject({
      constructor: ModelNotInstalledError,
      model: 'llava:13b'
    });
  });

  it('reports other Ollama errors', async () => {
    fake.enqueue({ status: 500, body: { error: 'out of memory' } });
    await expect(identifyPlant(image, options)).rejects.toMatchObject({ constructor: OllamaRequestError, status: 500 });
  });

  it('reports an unreachable server', async () => {
    await expect(identifyPlant(image, { ...options, host: 'http://127.0.0.1:1' })).rejects.toBeInstanceOf(
      OllamaUnavailableError
    );
  });
});
