import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { normalizeName, sameGenus, sameSpecies, Taxonomy, type Lookup } from './taxonomy';

// GBIF answers for a synonym and its accepted name share the accepted keys
const gbif: Record<string, Awaited<ReturnType<Lookup>>> = {
  'sansevieria trifasciata': {
    matchType: 'EXACT', status: 'SYNONYM', rank: 'SPECIES',
    species: 'Dracaena trifasciata', speciesKey: 11041822, genus: 'Dracaena', genusKey: 2752062, family: 'Asparagaceae', familyKey: 7683
  },
  'dracaena trifasciata': {
    matchType: 'EXACT', status: 'ACCEPTED', rank: 'SPECIES',
    species: 'Dracaena trifasciata', speciesKey: 11041822, genus: 'Dracaena', genusKey: 2752062, family: 'Asparagaceae', familyKey: 7683
  },
  'dracaena marginata': {
    matchType: 'EXACT', status: 'SYNONYM', rank: 'SPECIES',
    species: 'Dracaena reflexa', speciesKey: 2770622, genus: 'Dracaena', genusKey: 2752062, family: 'Asparagaceae', familyKey: 7683
  },
  'plantus fakeus': { matchType: 'NONE' }
};

async function load() {
  const file = path.join(await mkdtemp(path.join(tmpdir(), 'taxonomy-')), 'cache.json');
  const lookup = vi.fn<Lookup>(async (name) => gbif[name] ?? { matchType: 'NONE' });
  return { taxonomy: await Taxonomy.load({ file, lookup }), lookup, file };
}

describe('normalizeName', () => {
  it('drops cultivars, ranks below species and case', () => {
    expect(normalizeName("Monstera deliciosa 'Thai Constellation'")).toBe('monstera deliciosa');
    expect(normalizeName('Hedera  helix subsp. hibernica')).toBe('hedera helix');
    expect(normalizeName(' Ficus Elastica ')).toBe('ficus elastica');
  });
});

describe('Taxonomy', () => {
  it('resolves synonyms to the accepted species', async () => {
    const { taxonomy } = await load();
    const synonym = await taxonomy.resolve('Sansevieria trifasciata');
    const accepted = await taxonomy.resolve('Dracaena trifasciata');
    expect(synonym?.species).toBe('Dracaena trifasciata');
    expect(sameSpecies(accepted, 'Dracaena trifasciata', synonym, 'Sansevieria trifasciata')).toBe(true);
  });

  it('tells apart species in the same genus', async () => {
    const { taxonomy } = await load();
    const a = await taxonomy.resolve('Dracaena trifasciata');
    const b = await taxonomy.resolve('Dracaena marginata');
    expect(sameSpecies(a, 'Dracaena trifasciata', b, 'Dracaena marginata')).toBe(false);
    expect(sameGenus(a, 'Dracaena trifasciata', b, 'Dracaena marginata')).toBe(true);
  });

  it('caches lookups, including misses, and saves them', async () => {
    const { taxonomy, lookup, file } = await load();
    await taxonomy.resolve('Plantus fakeus');
    await taxonomy.resolve('plantus  FAKEUS');
    await taxonomy.resolve('Dracaena trifasciata');
    expect(lookup).toHaveBeenCalledTimes(2);

    await taxonomy.save();
    const saved = JSON.parse(await readFile(file, 'utf8'));
    expect(Object.keys(saved)).toEqual(['dracaena trifasciata', 'plantus fakeus']);
    expect(saved['plantus fakeus']).toBeNull();

    const reloaded = await Taxonomy.load({ file, lookup });
    await reloaded.resolve('Dracaena trifasciata');
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it('falls back to text when a name is unresolved', () => {
    expect(sameSpecies(null, 'Plantus fakeus', null, 'plantus fakeus')).toBe(true);
    expect(sameGenus(null, 'Plantus fakeus', null, 'Plantus other')).toBe(true);
  });
});
