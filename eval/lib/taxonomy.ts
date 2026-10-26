import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EVAL_DIR } from './manifest';

// Labels and predictions are compared by GBIF backbone keys, not by text,
// so synonyms (Sansevieria trifasciata = Dracaena trifasciata) count as
// the same species. Lookups are cached in eval/taxonomy-cache.json.

export const TAXONOMY_CACHE_PATH = path.join(EVAL_DIR, 'taxonomy-cache.json');
const GBIF_MATCH_URL = 'https://api.gbif.org/v1/species/match';

export type Taxon = {
  // Accepted names and keys; for a synonym these are the accepted taxon's
  species: string | null;
  speciesKey: number | null;
  genus: string | null;
  genusKey: number | null;
  family: string | null;
  familyKey: number | null;
  rank: string | null;
  status: string | null;
  matchType: string;
};

type GbifMatch = Partial<Record<'species' | 'genus' | 'family' | 'rank' | 'status', string>> &
  Partial<Record<'speciesKey' | 'genusKey' | 'familyKey', number>> & { matchType: string };

// "Monstera deliciosa 'Thai Constellation'" → "monstera deliciosa"
export function normalizeName(name: string): string {
  return name
    .replace(/['‘’"“”].*$/, '')
    .replace(/\s+(cv\.|var\.|subsp\.|ssp\.|f\.)\s.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export type Lookup = (name: string) => Promise<GbifMatch>;

export const gbifLookup: Lookup = async (name) => {
  const url = `${GBIF_MATCH_URL}?${new URLSearchParams({ name, kingdom: 'Plantae' })}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'plant-identifier-eval' } });
  if (!response.ok) throw new Error(`GBIF ${response.status} for "${name}"`);
  return (await response.json()) as GbifMatch;
};

export class Taxonomy {
  private dirty = false;

  private constructor(
    private readonly cache: Record<string, Taxon | null>,
    private readonly lookup: Lookup,
    private readonly file: string
  ) {}

  static async load({ file = TAXONOMY_CACHE_PATH, lookup = gbifLookup }: { file?: string; lookup?: Lookup } = {}) {
    let cache: Record<string, Taxon | null> = {};
    try {
      cache = JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return new Taxonomy(cache, lookup, file);
  }

  // null: GBIF has no match. Throws if GBIF can't be reached and the name isn't cached.
  async resolve(name: string): Promise<Taxon | null> {
    const key = normalizeName(name);
    if (key === '') return null;
    if (key in this.cache) return this.cache[key]!;

    const match = await this.lookup(key);
    const taxon: Taxon | null =
      match.matchType === 'NONE'
        ? null
        : {
            species: match.species ?? null,
            speciesKey: match.speciesKey ?? null,
            genus: match.genus ?? null,
            genusKey: match.genusKey ?? null,
            family: match.family ?? null,
            familyKey: match.familyKey ?? null,
            rank: match.rank ?? null,
            status: match.status ?? null,
            matchType: match.matchType
          };
    this.cache[key] = taxon;
    this.dirty = true;
    return taxon;
  }

  async save() {
    if (!this.dirty) return;
    const sorted = Object.fromEntries(Object.entries(this.cache).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile(this.file, JSON.stringify(sorted, null, 2) + '\n');
    this.dirty = false;
  }
}

// Same species / genus, by GBIF key; falls back to the normalized text
// when a name can't be resolved
export function sameSpecies(label: Taxon | null, labelName: string, predicted: Taxon | null, predictedName: string) {
  if (label?.speciesKey && predicted?.speciesKey) return label.speciesKey === predicted.speciesKey;
  if (label && predicted) return false;
  return normalizeName(labelName) === normalizeName(predictedName);
}

export function sameGenus(label: Taxon | null, labelName: string, predicted: Taxon | null, predictedName: string) {
  if (label?.genusKey && predicted?.genusKey) return label.genusKey === predicted.genusKey;
  if (label && predicted) return false;
  const genusOf = (name: string) => normalizeName(name).split(' ')[0];
  return genusOf(labelName) === genusOf(predictedName);
}
