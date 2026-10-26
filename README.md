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

---

## How it works

1. The image is selected or captured in the browser and sent to `/api/identify`.
2. The API route sends the image, a prompt and the JSON schema from `lib/schema.ts` to the local Ollama server (`/api/chat`, temperature 0).
3. Ollama uses the schema to force a response in the expected format.
4. The route also validates the response with zod. Only complete, valid data reaches the frontend; otherwise it returns a clear error message.

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
│   ├── api/identify/route.ts   # API route: sends the image to Ollama, validates the response
│   ├── components/             # UI components (upload, results, map, ...)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── schema.ts               # zod schema: types, validation, JSON schema for Ollama
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
- Two-stage pipeline: a specialised plant classifier with a confidence score, followed by the vision model for care info
- Privacy: strip EXIF and GPS data in the browser, shrink images before sending, keep history only in the browser, offline map without external tiles, Content Security Policy
- Tests with Vitest and Playwright, CI with GitHub Actions
