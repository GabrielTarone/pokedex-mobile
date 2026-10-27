import type { ImageSourcePropType } from 'react-native';

import type { PokemonType } from '@/types/pokemon';

const biomeImages: Record<PokemonType, ImageSourcePropType> = {
  Normal: require('../../assets/biomes/forest.png'),
  Lutador: require('../../assets/biomes/cave.png'),
  Voador: require('../../assets/biomes/forest.png'),
  Veneno: require('../../assets/biomes/forest.png'),
  Terrestre: require('../../assets/biomes/cave.png'),
  Pedra: require('../../assets/biomes/cave.png'),
  Inseto: require('../../assets/biomes/forest.png'),
  Fantasma: require('../../assets/biomes/cave.png'),
  Aço: require('../../assets/biomes/cave.png'),
  Fogo: require('../../assets/biomes/volcano.png'),
  Água: require('../../assets/biomes/aquatic.png'),
  Grama: require('../../assets/biomes/forest.png'),
  Elétrico: require('../../assets/biomes/forest.png'),
  Psíquico: require('../../assets/biomes/forest.png'),
  Gelo: require('../../assets/biomes/aquatic.png'),
  Dragão: require('../../assets/biomes/volcano.png'),
  Sombrio: require('../../assets/biomes/cave.png'),
  Fada: require('../../assets/biomes/forest.png'),
};

export function getPokemonBiomeImage(
  primaryType: string | undefined,
): ImageSourcePropType | null {
  if (!primaryType || !Object.prototype.hasOwnProperty.call(biomeImages, primaryType)) {
    return null;
  }

  return biomeImages[primaryType as PokemonType];
}
