import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { FavoriteHeartButton } from '@/components/FavoriteHeartButton';
import { POKEMON_TYPE_ICONS } from '@/constants/pokemonTypes';
import type { Pokemon } from '@/types/pokemon';

type PokemonCardProps = {
  pokemon: Pokemon;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoriteDisabled?: boolean;
};

export function PokemonCard({
  pokemon,
  onPress,
  isFavorite,
  onToggleFavorite,
  favoriteDisabled = false,
}: PokemonCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: pokemon.color }]}>
      <Pressable
        accessibilityLabel={`${pokemon.name}, número ${pokemon.id}, tipos ${pokemon.types.join(', ')}. Abrir detalhes.`}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.cardContent}
      >
        <Text style={styles.number}>#{String(pokemon.id).padStart(3, '0')}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {pokemon.name}
        </Text>

        <View style={styles.types}>
          {pokemon.types.map((type) => (
            <Image
              key={type}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              resizeMode="contain"
              source={POKEMON_TYPE_ICONS[type]}
              style={styles.typeIcon}
            />
          ))}
        </View>

        <View pointerEvents="none" style={styles.spriteCircle} />

        {pokemon.spriteUrl && !imageFailed ? (
          <Image
            accessibilityLabel={`${pokemon.name}, sprite pixel art`}
            onError={() => setImageFailed(true)}
            source={{ uri: pokemon.spriteUrl }}
            resizeMode="contain"
            style={styles.sprite}
          />
        ) : (
          <View style={styles.spriteFallback}>
            <Text style={styles.fallbackMark}>?</Text>
          </View>
        )}
      </Pressable>

      <FavoriteHeartButton
        pokemonName={pokemon.name}
        isFavorite={isFavorite}
        disabled={favoriteDisabled}
        onPress={onToggleFavorite}
        style={styles.favoriteButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    minHeight: 174,
    flex: 1,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 33, 59, 0.12)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    minHeight: 174,
    padding: 14,
  },
  number: {
    color: '#526071',
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    marginTop: 5,
    paddingRight: 48,
    color: '#17213B',
    fontSize: 15,
    fontWeight: '800',
  },
  types: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  typeIcon: {
    width: 24,
    height: 24,
  },
  spriteCircle: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE2CB',
  },
  sprite: {
    position: 'absolute',
    right: 2,
    bottom: 0,
    width: 96,
    height: 96,
  },
  spriteFallback: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: 'transparent',
  },
  fallbackMark: {
    color: '#526071',
    fontSize: 28,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 32,
    right: 8,
  },
});
