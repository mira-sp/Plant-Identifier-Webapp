import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// eval/manifest.jsonl: one line per image. Photos live in eval/data/
// (gitignored); only the manifest is committed.

export const EVAL_DIR = path.resolve(import.meta.dirname, '..');
export const DATA_DIR = path.join(EVAL_DIR, 'data');
export const MANIFEST_PATH = path.join(EVAL_DIR, 'manifest.jsonl');

export type Source = 'personal' | 'inaturalist';
export type Split = 'personal' | 'public' | 'non-plant';

export type ManifestEntry = {
  // Relative to eval/data/
  file: string;
  // null means the image shows no plant and the model should abstain
  scientificName: string | null;
  genus: string | null;
  family: string | null;
  source: Source;
  // Public images: where the photo came from and its licence
  url?: string;
  license?: string;
  attribution?: string;
  observation?: string;
  // What a non-plant image shows
  note?: string;
};

export const splitOf = (entry: ManifestEntry): Split =>
  entry.scientificName === null ? 'non-plant' : entry.source === 'personal' ? 'personal' : 'public';

export function parseJsonl<T>(text: string): T[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as T);
}

export const toJsonl = (rows: unknown[]) => rows.map((row) => JSON.stringify(row)).join('\n') + '\n';

export async function readManifest(file = MANIFEST_PATH): Promise<ManifestEntry[]> {
  try {
    return parseJsonl<ManifestEntry>(await readFile(file, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

// Replaces all entries from `source`, keeps the rest, sorts by file
export async function writeManifestSource(source: Source, entries: ManifestEntry[], file = MANIFEST_PATH) {
  const kept = (await readManifest(file)).filter((entry) => entry.source !== source);
  const all = [...kept, ...entries].sort((a, b) => a.file.localeCompare(b.file));
  await writeFile(file, toJsonl(all));
  return all;
}
