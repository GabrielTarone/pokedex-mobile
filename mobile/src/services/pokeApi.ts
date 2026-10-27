import type {
  Pokemon,
  PokemonStatName,
  PokemonTypeCombinationMode,
  PokemonType,
} from '@/types/pokemon';
import { POKEMON_CARD_COLORS } from '@/constants/pokemonTypes';

const API_URL = 'https://pokeapi.co/api/v2';
const DETAIL_BATCH_SIZE = 8;

type Resource = { name: string; url: string };

type PokemonListResponse = {
  count: number;
  results: Resource[];
};

type PokemonSpeciesResponse = {
  id: number;
  name: string;
  varieties: { is_default: boolean; pokemon: Resource }[];
};

type PokemonDetailsResponse = {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  sprites: { front_default: string | null };
  height: number;
  weight: number;
  stats: { base_stat: number; stat: { name: PokemonStatName } }[];
};

type PokemonTypeResponse = {
  pokemon: { pokemon: Resource }[];
};

export type PokemonSpeciesEntry = {
  id: number;
  name: string;
};

const typeNames: Record<string, PokemonType> = {
  normal: 'Normal',
  fighting: 'Lutador',
  flying: 'Voador',
  poison: 'Veneno',
  ground: 'Terrestre',
  rock: 'Pedra',
  bug: 'Inseto',
  ghost: 'Fantasma',
  steel: 'Aço',
  fire: 'Fogo',
  water: 'Água',
  grass: 'Grama',
  electric: 'Elétrico',
  psychic: 'Psíquico',
  ice: 'Gelo',
  dragon: 'Dragão',
  dark: 'Sombrio',
  fairy: 'Fada',
};

const typeApiNames = Object.fromEntries(
  Object.entries(typeNames).map(([apiName, localizedName]) => [localizedName, apiName]),
) as Record<PokemonType, string>;

let cachedSpeciesIndex: PokemonSpeciesEntry[] | null = null;
let pendingSpeciesIndex: Promise<PokemonSpeciesEntry[]> | null = null;
const pokemonCache = new Map<number, Pokemon>();
const pokemonNameCache = new Map<string, Pokemon>();
const pendingPokemon = new Map<number, Promise<Pokemon>>();
const typeIdCache = new Map<string, number[]>();
const pendingTypeIds = new Map<string, Promise<number[]>>();

async function getJson<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error('Não foi possível conectar à PokéAPI. Verifique a internet e tente novamente.');
  }

  if (!response.ok) {
    throw new Error('A PokéAPI não respondeu corretamente. Tente novamente.');
  }

  return (await response.json()) as T;
}

function getResourceId(url: string): number | null {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function formatName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

export function getSpeciesIndex(forceRefresh = false): Promise<PokemonSpeciesEntry[]> {
  if (forceRefresh) {
    cachedSpeciesIndex = null;
    pendingSpeciesIndex = null;
  }
  if (cachedSpeciesIndex) return Promise.resolve(cachedSpeciesIndex);
  if (pendingSpeciesIndex) return pendingSpeciesIndex;

  pendingSpeciesIndex = (async () => {
    // A primeira resposta informa o total atual; a segunda traz somente o índice leve de espécies.
    const firstPage = await getJson<PokemonListResponse>(
      `${API_URL}/pokemon-species?limit=1&offset=0`,
    );
    const list = firstPage.count <= 1
      ? firstPage
      : await getJson<PokemonListResponse>(
          `${API_URL}/pokemon-species?limit=${firstPage.count}&offset=0`,
        );

    const species = list.results
      .map(({ name, url }) => ({ id: getResourceId(url), name }))
      .filter((item): item is { id: number; name: string } => item.id !== null)
      .sort((first, second) => first.id - second.id);

    cachedSpeciesIndex = species;
    return species;
  })().finally(() => {
    pendingSpeciesIndex = null;
  });

  return pendingSpeciesIndex;
}

function mapPokemonDetails(details: PokemonDetailsResponse, speciesId: number): Pokemon {
  const types = [...details.types]
    .sort((first, second) => first.slot - second.slot)
    .map(({ type }) => typeNames[type.name] ?? 'Normal');
  const primaryType = types[0] ?? 'Normal';

  return {
    // O número exibido e salvo corresponde à espécie, mesmo que a API acrescente formas.
    id: speciesId,
    name: formatName(details.name),
    types,
    color: POKEMON_CARD_COLORS[primaryType],
    spriteUrl: details.sprites.front_default,
    height: details.height,
    weight: details.weight,
    stats: details.stats.map(({ base_stat, stat }) => ({
      name: stat.name,
      value: base_stat,
    })),
  };
}

async function getPokemonDetails(url: string, speciesId: number): Promise<Pokemon> {
  const details = await getJson<PokemonDetailsResponse>(url);
  return mapPokemonDetails(details, speciesId);
}

async function loadSpeciesPokemon(species: PokemonSpeciesEntry): Promise<Pokemon> {
  const cached = pokemonCache.get(species.id);
  if (cached) return cached;

  const pending = pendingPokemon.get(species.id);
  if (pending) return pending;

  const request = (async () => {
    const speciesDetails = await getJson<PokemonSpeciesResponse>(
      `${API_URL}/pokemon-species/${species.id}/`,
    );
    const defaultVariety = speciesDetails.varieties.find((variety) => variety.is_default);
    if (!defaultVariety) {
      throw new Error(`A espécie ${species.name} não possui uma forma padrão disponível.`);
    }

    const pokemon = await getPokemonDetails(defaultVariety.pokemon.url, species.id);
    pokemonCache.set(species.id, pokemon);
    pokemonNameCache.set(species.name.toLowerCase(), pokemon);
    pokemonNameCache.set(pokemon.name.toLowerCase(), pokemon);
    return pokemon;
  })().finally(() => {
    pendingPokemon.delete(species.id);
  });

  pendingPokemon.set(species.id, request);
  return request;
}

export async function getPokemonByIds(ids: number[]): Promise<Pokemon[]> {
  if (!ids.length) return [];
  const species = await getSpeciesIndex();
  const speciesById = new Map(species.map((entry) => [entry.id, entry]));
  const entries = ids
    .map((id) => speciesById.get(id))
    .filter((entry): entry is PokemonSpeciesEntry => entry !== undefined);
  const pokemon: Pokemon[] = [];

  // Cada página é carregada em grupos pequenos para limitar a concorrência de rede.
  for (let index = 0; index < entries.length; index += DETAIL_BATCH_SIZE) {
    const batch = entries.slice(index, index + DETAIL_BATCH_SIZE);
    pokemon.push(...await Promise.all(batch.map(loadSpeciesPokemon)));
  }

  return pokemon;
}

export async function getPokemonPage(offset: number, limit: number): Promise<Pokemon[]> {
  const species = await getSpeciesIndex();
  const page = species.slice(offset, offset + limit);
  return getPokemonByIds(page.map((entry) => entry.id));
}

export async function getPokemonIdsByTypes(
  types: PokemonType[],
  mode: PokemonTypeCombinationMode = 'or',
): Promise<number[]> {
  if (!types.length) return [];
  const species = await getSpeciesIndex();
  const speciesIds = new Set(species.map((entry) => entry.id));
  const idsByType = await Promise.all(types.map(async (type) => {
    const apiType = typeApiNames[type];
    let ids = typeIdCache.get(apiType);
    if (!ids) {
      let pending = pendingTypeIds.get(apiType);
      if (!pending) {
        pending = getJson<PokemonTypeResponse>(`${API_URL}/type/${apiType}/`).then((response) => {
          const typeIds = response.pokemon
            .map(({ pokemon }) => getResourceId(pokemon.url))
            .filter((id): id is number => id !== null);
          typeIdCache.set(apiType, typeIds);
          return typeIds;
        }).finally(() => {
          pendingTypeIds.delete(apiType);
        });
        pendingTypeIds.set(apiType, pending);
      }
      ids = await pending;
    }

    return new Set(ids.filter((id) => speciesIds.has(id)));
  }));

  const result = mode === 'and'
    ? idsByType.slice(1).reduce(
        (matches, ids) => new Set([...matches].filter((id) => ids.has(id))),
        new Set(idsByType[0]),
      )
    : idsByType.reduce((matches, ids) => new Set([...matches, ...ids]), new Set<number>());

  return [...result].sort((first, second) => first - second);
}

export async function getPokemonById(identifier: string): Promise<Pokemon> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const species = await getSpeciesIndex();
  const speciesEntry = /^\d+$/.test(normalizedIdentifier)
    ? species.find((entry) => entry.id === Number(normalizedIdentifier))
    : species.find((entry) => entry.name === normalizedIdentifier);

  if (speciesEntry) {
    const cached = pokemonCache.get(speciesEntry.id);
    if (cached) return cached;
    const pending = pendingPokemon.get(speciesEntry.id);
    if (pending) return pending;
    return loadSpeciesPokemon(speciesEntry);
  }

  const cachedByName = pokemonNameCache.get(normalizedIdentifier);
  if (cachedByName) return cachedByName;

  // Mantém compatibilidade com links de detalhe que usem um Pokémon fora do índice de espécies.
  const details = await getJson<PokemonDetailsResponse>(
    `${API_URL}/pokemon/${encodeURIComponent(normalizedIdentifier)}/`,
  );
  const pokemon = mapPokemonDetails(details, details.id);
  pokemonCache.set(pokemon.id, pokemon);
  pokemonNameCache.set(pokemon.name.toLowerCase(), pokemon);
  return pokemon;
}
