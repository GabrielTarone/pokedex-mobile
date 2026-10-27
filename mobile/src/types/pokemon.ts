export type PokemonType =
  | 'Normal'
  | 'Lutador'
  | 'Voador'
  | 'Veneno'
  | 'Terrestre'
  | 'Pedra'
  | 'Inseto'
  | 'Fantasma'
  | 'Aço'
  | 'Fogo'
  | 'Água'
  | 'Grama'
  | 'Elétrico'
  | 'Psíquico'
  | 'Gelo'
  | 'Dragão'
  | 'Sombrio'
  | 'Fada';

export type PokemonTypeCombinationMode = 'or' | 'and';

export type PokemonStatName =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

export type PokemonStat = {
  name: PokemonStatName;
  value: number;
};

export type Pokemon = {
  id: number;
  name: string;
  types: PokemonType[];
  color: string;
  spriteUrl: string | null;
  height: number;
  weight: number;
  stats: PokemonStat[];
};
