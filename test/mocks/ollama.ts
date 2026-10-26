import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { pathToFileURL } from 'node:url';

// A fake Ollama server speaking the subset of the API the app uses
// (POST /api/chat with stream: false, GET /api/tags). Tests point
// OLLAMA_HOST / `host` at it. Replies come from, in order: queued
// replies, the handler, or a default that fills in whatever `format`
// schema the request asks for.
//
// Standalone: `npx tsx test/mocks/ollama.ts [port]` serves the defaults,
// so the app can run without a GPU (OLLAMA_HOST=http://127.0.0.1:11435).

export type FakeChatRequest = {
  model: string;
  messages: { role: string; content: string; images?: string[] }[];
  format?: { properties?: Record<string, unknown> };
  stream?: boolean;
  options?: Record<string, unknown>;
};

export type FakeReply =
  // `content` is the assistant message: objects are JSON-encoded, strings sent as-is
  | { content: unknown; delayMs?: number }
  // Raw HTTP response, for error cases
  | { status: number; body?: unknown; delayMs?: number };

export type FakeHandler = (request: FakeChatRequest) => FakeReply | Promise<FakeReply>;

export type FakeOllama = {
  url: string;
  requests: FakeChatRequest[];
  enqueue: (...replies: FakeReply[]) => void;
  setHandler: (handler: FakeHandler | null) => void;
  reset: () => void;
  close: () => Promise<void>;
};

export const DEFAULT_MODELS = ['qwen2.5vl:7b'];

export const fakeCandidates = [
  { scientificName: 'Monstera deliciosa', commonName: 'Swiss cheese plant', confidence: 0.82 },
  { scientificName: 'Thaumatophyllum bipinnatifidum', commonName: 'Lacy tree philodendron', confidence: 0.1 },
  { scientificName: 'Rhaphidophora tetrasperma', commonName: 'Mini monstera', confidence: 0.05 }
];

export const fakeDetails = {
  description: 'A climbing evergreen with large, split leaves.',
  careInfo: {
    light: 'Bright, indirect light',
    water: 'When the top 5 cm of soil is dry',
    temperature: '18-27 °C',
    soil: 'Chunky, well-draining mix',
    humidity: 'Medium to high'
  },
  funFacts: ['Its fruit is edible when ripe.', 'The leaf holes are called fenestrations.'],
  nativeRegions: ['North America', 'South America']
};

// Answers with every field the requested schema has
export const defaultHandler: FakeHandler = (request) => {
  const fields = Object.keys(request.format?.properties ?? {});
  const all: Record<string, unknown> = { isPlant: true, candidates: fakeCandidates, ...fakeDetails };
  return { content: Object.fromEntries(fields.map((field) => [field, all[field]])) };
};

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function startFakeOllama(
  { models = DEFAULT_MODELS, handler = null, port = 0 }: { models?: string[]; handler?: FakeHandler | null; port?: number } = {}
): Promise<FakeOllama> {
  const requests: FakeChatRequest[] = [];
  const queue: FakeReply[] = [];
  let currentHandler = handler;

  const server: Server = createServer(async (req, res) => {
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    };

    if (req.method === 'GET' && req.url === '/api/tags') {
      return send(200, { models: models.map((name) => ({ name, model: name })) });
    }
    if (req.method !== 'POST' || req.url !== '/api/chat') {
      return send(404, { error: 'not found' });
    }

    const body = (await readJson(req)) as FakeChatRequest;
    requests.push(body);

    if (!models.includes(body.model)) {
      return send(404, { error: `model "${body.model}" not found, try pulling it first` });
    }

    const reply = queue.shift() ?? (await (currentHandler ?? defaultHandler)(body));
    if (reply.delayMs) await new Promise((resolve) => setTimeout(resolve, reply.delayMs));

    if ('status' in reply) return send(reply.status, reply.body ?? {});
    send(200, {
      model: body.model,
      created_at: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: typeof reply.content === 'string' ? reply.content : JSON.stringify(reply.content)
      },
      done: true,
      done_reason: 'stop'
    });
  });

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const { port: actualPort } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${actualPort}`,
    requests,
    enqueue: (...replies) => queue.push(...replies),
    setHandler: (next) => {
      currentHandler = next;
    },
    reset: () => {
      requests.length = 0;
      queue.length = 0;
      currentHandler = handler;
    },
    close: () =>
      new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? 11435);
  startFakeOllama({ port, models: [process.env.OLLAMA_MODEL ?? DEFAULT_MODELS[0]!] }).then((fake) =>
    console.log(`Fake Ollama listening on ${fake.url}`)
  );
}
