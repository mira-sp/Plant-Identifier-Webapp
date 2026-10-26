# Plant Identifier Webapp

A web app that identifies plants with an AI model running locally. Upload a photo of a plant or take one with your camera. A vision model analyses it through [Ollama](https://ollama.com) on your own machine, so images never leave your device and no API key is needed.

---

## Features

- **Image capture and upload:** drag and drop, file picker, or take a photo directly with the camera.
- **Local AI identification:** a vision model (default: `qwen2.5vl:7b`) runs on your machine through Ollama.
- **Structured output:** a single zod schema defines the response format. It provides the TypeScript types, runtime validation, and the JSON schema Ollama uses to constrain the model's output.
- **Plant information:** common name, scientific name, description, care info (light, water, temperature, soil, humidity) and fun facts.
- **Map view:** Leaflet shows the plant's native regions.
- **Clear error messages:** for example when Ollama isn't running or the model isn't installed yet.

---

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 |
| Schema and validation | zod 4 |
| AI | Ollama with a local vision model |
| Maps | Leaflet, react-leaflet |
| Camera | `navigator.mediaDevices.getUserMedia()` |

---

## Requirements

- Node.js 20.9 or newer
- [Ollama](https://ollama.com)
- A vision model. `qwen2.5vl:7b` needs about 6 GB. A GPU with at least 8 GB of VRAM or an Apple Silicon Mac with 16 GB of RAM is recommended; without a GPU it runs much slower.

---

## Installation

```bash
# 1. Install Ollama (macOS; for Linux and Windows see ollama.com)
brew install ollama

# 2. Start Ollama (skip this if the Ollama app is already running)
ollama serve

# 3. Download the model
ollama pull qwen2.5vl:7b

# 4. Install dependencies and start the dev server
npm install
npm run dev
```

The app then runs at [http://localhost:3000](http://localhost:3000).

### Configuration

Optional, via `.env.local` (template: `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Address of the Ollama server |
| `OLLAMA_MODEL` | `qwen2.5vl:7b` | Vision model to use |
| `OLLAMA_DESCRIBE_MODEL` | `OLLAMA_MODEL` | Model for the describe stage (can be text-only) |
| `PIPELINE_MODE` | `two-stage` | `two-stage` (identify, then describe) or `single` (one call) |

To try a different model:

```bash
ollama pull gemma3:4b
OLLAMA_MODEL=gemma3:4b npm run dev
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build, including type checking |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit, API route and component tests) |
| `npm run typecheck` | TypeScript without a build |

---

## How it works

1. The image is selected or captured in the browser and sent to `/api/identify`.
2. The route calls `identifyPlant()` from `lib/pipeline/`, which runs two stages against the local Ollama server (`/api/chat`, temperature 0):
   - **classify:** image → up to k ranked species candidates with confidences, or "not a plant".
   - **describe:** top species (optionally with the image) → description, care info, fun facts and native regions.
3. Each stage sends its JSON schema from `lib/schema.ts` as Ollama's `format` and validates the reply with zod. Only complete, valid data reaches the frontend; otherwise the route returns a clear error message.
4. The evaluation script calls the same `identifyPlant()`, so it measures the code that runs in production.

---

## Privacy

- Images are only sent to the local Ollama server and are never stored.
- No external AI services and no API keys.
- Fonts are bundled at build time via `next/font` and served by the app itself.
- Limitation: the map view loads map tiles from OpenStreetMap. This is planned to be replaced with a bundled offline map.
- Next.js collects anonymous telemetry by default. Turn it off with `npx next telemetry disable`.

---

## Project structure

```
├── app/
│   ├── api/identify/route.ts   # Thin API route: parse upload, call identifyPlant, map errors
│   ├── components/             # UI components (upload, results, map, ...)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── schema.ts               # zod schemas: types, validation, JSON schemas for Ollama
│   └── pipeline/
│       ├── classify.ts         # Stage 1: image → top-k candidates
│       ├── describe.ts         # Stage 2: species (+ image) → care info
│       ├── ollama.ts           # Ollama client and pipeline errors
│       └── index.ts            # identifyPlant(image, opts) → candidates, plant, timings
├── test/
│   ├── mocks/ollama.ts         # Fake Ollama server for tests (also runs standalone)
│   └── setup.ts
├── .env.example                # Configuration template
├── eslint.config.mjs
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Troubleshooting

| Message | Cause and fix |
|---|---|
| "The local AI model is not running" | Ollama isn't running. Start it with `ollama serve` or the Ollama app. |
| "Model ... is not installed" | The model is missing. Download it with `ollama pull <model>`. |
| "The local AI model returned incomplete plant data" | The model's response was incomplete. Try again or use a larger model. |
| "We couldn't find a plant in this photo" | The model decided the image shows no plant. Try a closer photo of the leaves or flowers. |

---

## Example output

After uploading a photo of a plant, the app shows something like:

- **Name:** Rubber Plant
- **Scientific name:** *Ficus elastica*
- **Care:** bright, indirect light; water moderately; well-draining soil
- **Native region:** Asia
- **Fun facts:** purifies the air; has a milky sap

Note: local models of this size usually identify common houseplants and garden plants reliably, but are wrong more often on rare species or blurry photos.

---

## Roadmap

- Evaluation script with a custom test set (top-1/top-3 accuracy, latency, calibration)
- Replace the vision-model classify stage with a dedicated plant classifier
- Privacy: strip EXIF and GPS data in the browser, shrink images before sending, keep history only in the browser, offline map without external tiles, Content Security Policy
- Playwright end-to-end tests, CI with GitHub Actions
