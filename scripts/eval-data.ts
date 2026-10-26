import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';
import { DATA_DIR, EVAL_DIR, readManifest, writeManifestSource, type ManifestEntry } from '../eval/lib/manifest';
import { Taxonomy } from '../eval/lib/taxonomy';

// npm run eval:data -- public     Build the public + non-plant manifest entries from iNaturalist
// npm run eval:data -- download   Download every manifest image that is missing in eval/data/
// npm run eval:data -- personal   Add eval/data/personal/<Scientific name>/*.jpg to the manifest

const INAT_API = 'https://api.inaturalist.org/v1';
const USER_AGENT = 'plant-identifier-eval (https://github.com/parwely/Plant-Identifier-Webapp)';
// Licences that allow use in an evaluation set, with attribution
const LICENSES = ['cc0', 'cc-by', 'cc-by-nc', 'cc-by-sa', 'cc-by-nc-sa'];
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const NOT_A_PLANT_DIR = 'not-a-plant';

type SpeciesFile = {
  perSpecies: number;
  species: string[];
  nonPlant: { iconicTaxon: string; count: number }[];
};

type INatObservation = {
  id: number;
  uri: string;
  user: { id: number };
  taxon: { id: number; name: string } | null;
  photos: { id: number; url: string; license_code: string | null; attribution: string }[];
};

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// iNaturalist asks API users to stay around one request per second
async function inat<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  await sleep(1000);
  const response = await fetch(`${INAT_API}${endpoint}?${new URLSearchParams(params)}`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) throw new Error(`iNaturalist ${response.status} for ${endpoint}`);
  return (await response.json()) as T;
}

// Research-grade observations, one photo each, from different observers
async function pickObservations(
  params: Record<string, string>,
  count: number,
  accept: (observation: INatObservation) => boolean = () => true
) {
  const { results } = await inat<{ results: INatObservation[] }>('/observations', {
    quality_grade: 'research',
    photo_license: LICENSES.join(','),
    order_by: 'votes',
    per_page: '50',
    ...params
  });
  const seenUsers = new Set<number>();
  const picked: { observation: INatObservation; photo: INatObservation['photos'][number] }[] = [];
  for (const observation of results) {
    const photo = observation.photos.find((p) => p.license_code && LICENSES.includes(p.license_code));
    if (!photo || !accept(observation) || seenUsers.has(observation.user.id)) continue;
    seenUsers.add(observation.user.id);
    picked.push({ observation, photo });
    if (picked.length === count) break;
  }
  return picked;
}

// iNaturalist's taxon for a name; its own name may differ (synonyms, "×" in hybrids)
async function inatTaxon(name: string) {
  const { results } = await inat<{ results: { id: number; name: string; rank: string }[] }>('/taxa', {
    q: name,
    per_page: '5'
  });
  // Skip same-named complexes and genera
  const candidates = results.filter((taxon) => ['species', 'hybrid'].includes(taxon.rank));
  const plain = (value: string) => value.replace(/×\s*/g, '').toLowerCase();
  return candidates.find((taxon) => plain(taxon.name) === plain(name)) ?? candidates[0];
}

const photoFields = (observation: INatObservation, photo: INatObservation['photos'][number]) => ({
  // "square" is a 75 px thumbnail; "large" is up to 1024 px
  url: photo.url.replace('/square.', '/large.'),
  license: photo.license_code!,
  attribution: photo.attribution,
  observation: observation.uri
});

async function buildPublic() {
  const spec = JSON.parse(await readFile(path.join(EVAL_DIR, 'species.json'), 'utf8')) as SpeciesFile;
  const taxonomy = await Taxonomy.load();
  const entries: ManifestEntry[] = [];

  for (const name of spec.species) {
    const taxon = await taxonomy.resolve(name);
    const inat = await inatTaxon(name);
    if (!inat) {
      console.warn(`${name}: not found on iNaturalist`);
      continue;
    }
    // taxon_id also matches subspecies; keep observations of the species itself
    const picked = await pickObservations({ taxon_id: String(inat.id) }, spec.perSpecies, (o) => o.taxon?.id === inat.id);
    const alias = inat.name === name ? '' : ` (iNaturalist: ${inat.name})`;
    console.log(`${name}${alias}: ${picked.length}/${spec.perSpecies}`);
    for (const { observation, photo } of picked) {
      entries.push({
        file: `public/${slug(name)}/${photo.id}.jpg`,
        scientificName: name,
        genus: taxon?.genus ?? null,
        family: taxon?.family ?? null,
        source: 'inaturalist',
        ...photoFields(observation, photo)
      });
    }
  }

  for (const { iconicTaxon, count } of spec.nonPlant) {
    const picked = await pickObservations({ iconic_taxa: iconicTaxon }, count);
    console.log(`not a plant, ${iconicTaxon}: ${picked.length}/${count}`);
    for (const { observation, photo } of picked) {
      entries.push({
        file: `non-plant/${slug(iconicTaxon)}/${photo.id}.jpg`,
        scientificName: null,
        genus: null,
        family: null,
        source: 'inaturalist',
        note: `${iconicTaxon}: ${observation.taxon?.name ?? 'unknown'}`,
        ...photoFields(observation, photo)
      });
    }
  }

  await taxonomy.save();
  const all = await writeManifestSource('inaturalist', entries);
  console.log(`Wrote ${entries.length} iNaturalist entries (${all.length} total) to eval/manifest.jsonl`);
}

async function download() {
  const missing = (await readManifest()).filter((entry) => !existsSync(path.join(DATA_DIR, entry.file)));
  const downloadable = missing.filter((entry) => entry.url);
  const personal = missing.length - downloadable.length;
  console.log(`${downloadable.length} images to download`);

  let failed = 0;
  for (const [index, entry] of downloadable.entries()) {
    const target = path.join(DATA_DIR, entry.file);
    await mkdir(path.dirname(target), { recursive: true });
    try {
      const response = await fetch(entry.url!, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('not an image');
      // Write to a temp file first so an interrupted download isn't mistaken for a finished one
      await pipeline(Readable.fromWeb(response.body as ReadableStream), createWriteStream(`${target}.part`));
      await rename(`${target}.part`, target);
      console.log(`  ${index + 1}/${downloadable.length} ${entry.file}`);
    } catch (error) {
      failed++;
      console.error(`  ${index + 1}/${downloadable.length} ${entry.file} failed: ${(error as Error).message}`);
    }
    await sleep(200);
  }

  if (failed > 0) console.error(`${failed} downloads failed; run the command again to retry them.`);
  if (personal > 0) console.warn(`${personal} personal images in the manifest are missing from eval/data/personal/.`);
}

async function indexPersonal() {
  const root = path.join(DATA_DIR, 'personal');
  if (!existsSync(root)) {
    console.error(`Create eval/data/personal/<Scientific name>/ folders with your photos first (non-plants go in ${NOT_A_PLANT_DIR}/).`);
    process.exit(1);
  }

  const taxonomy = await Taxonomy.load();
  const entries: ManifestEntry[] = [];
  for (const folder of (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory())) {
    const files = (await readdir(path.join(root, folder.name))).filter((file) => {
      const extension = path.extname(file).toLowerCase();
      if (extension === '.heic') console.warn(`  skipping ${folder.name}/${file}: Ollama can't read HEIC, export it as JPEG`);
      return IMAGE_EXTENSIONS.has(extension);
    });

    const isPlant = folder.name !== NOT_A_PLANT_DIR;
    const taxon = isPlant ? await taxonomy.resolve(folder.name) : null;
    if (isPlant && !taxon?.speciesKey) console.warn(`  "${folder.name}" did not resolve to a species in GBIF; check the spelling`);
    if (taxon?.species && taxon.species !== folder.name) console.log(`  "${folder.name}" is a synonym of ${taxon.species}`);

    for (const file of files.sort()) {
      entries.push({
        file: `personal/${folder.name}/${file}`,
        scientificName: isPlant ? folder.name : null,
        genus: taxon?.genus ?? null,
        family: taxon?.family ?? null,
        source: 'personal'
      });
    }
    console.log(`${folder.name}: ${files.length}`);
  }

  await taxonomy.save();
  const all = await writeManifestSource('personal', entries);
  console.log(`Wrote ${entries.length} personal entries (${all.length} total) to eval/manifest.jsonl`);
}

const commands: Record<string, () => Promise<void>> = { public: buildPublic, download, personal: indexPersonal };
const command = commands[process.argv[2] ?? ''];
if (!command) {
  console.error('Usage: npm run eval:data -- public | download | personal');
  process.exit(1);
}
await command();
