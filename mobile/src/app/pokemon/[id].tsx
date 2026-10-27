import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FavoriteHeartButton } from '@/components/FavoriteHeartButton';
import { PokeballMark } from '@/components/PokeballMark';
import { getPokemonBiomeImage } from '@/constants/pokemonBiomes';
import { POKEMON_TYPE_ICONS } from '@/constants/pokemonTypes';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getPokemonById } from '@/services/pokeApi';
import type { Pokemon, PokemonStatName } from '@/types/pokemon';

const statLabels: Record<PokemonStatName, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Ataque especial',
  'special-defense': 'Defesa especial',
  speed: 'Velocidade',
};

const statOrder: PokemonStatName[] = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
];

export default function PokemonDetailsScreen() {
  const router = useRouter();
  const {
    isFavorite,
    isFavoritesLoading,
    storageError,
    toggleFavorite,
  } = useFavorites();
  const params = useLocalSearchParams<{ id: string }>();
  const identifier = Array.isArray(params.id) ? params.id[0] : params.id;
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCurrentScreen = true;
    setIsLoading(true);
    setErrorMessage(null);

    if (!identifier) {
      setErrorMessage('Não encontramos este Pokémon.');
      setIsLoading(false);
      return () => {
        isCurrentScreen = false;
      };
    }

    getPokemonById(identifier)
      .then((result) => {
        if (isCurrentScreen) setPokemon(result);
      })
      .catch((error: unknown) => {
        if (!isCurrentScreen) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os detalhes. Tente novamente.',
        );
      })
      .finally(() => {
        if (isCurrentScreen) setIsLoading(false);
      });

    return () => {
      isCurrentScreen = false;
    };
  }, [identifier, retryCount]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  const biomeImage = getPokemonBiomeImage(pokemon?.types[0]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para a Pokédex"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Voltar</Text>
          </Pressable>
          <View style={styles.topBrand}>
            <PokeballMark size={24} />
            <Text style={styles.topBarTitle}>POKÉDEX</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.messageState}>
            <ActivityIndicator color="#EF3340" size="large" />
            <Text style={styles.messageText}>Carregando detalhes...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.messageState}>
            <Text style={styles.messageTitle}>Não foi possível carregar</Text>
            <Text style={styles.messageText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRetryCount((count) => count + 1)}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : pokemon ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.pokemonHero, { backgroundColor: pokemon.color }]}>
              <Text style={styles.number}>Nº {String(pokemon.id).padStart(3, '0')}</Text>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {pokemon.name}
                </Text>
                <FavoriteHeartButton
                  pokemonName={pokemon.name}
                  isFavorite={isFavorite(pokemon.id)}
                  disabled={isFavoritesLoading}
                  onPress={() => void toggleFavorite(pokemon.id)}
                />
              </View>

              <View style={styles.types}>
                {pokemon.types.map((type) => (
                  <View key={type} style={styles.typeBadge}>
                    <Image
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      resizeMode="contain"
                      source={POKEMON_TYPE_ICONS[type]}
                      style={styles.typeIcon}
                    />
                    <Text style={styles.typeName}>{type}</Text>
                  </View>
                ))}
              </View>

              <View
                style={
                  biomeImage ? styles.biomeSceneContainer : styles.spriteContainer
                }
              >
                <PokemonBiomeBackground imageSource={biomeImage} />
                <View pointerEvents="none" style={styles.spriteOverlay}>
                  <PokemonSprite pokemon={pokemon} />
                </View>
              </View>
            </View>

            {storageError && <Text style={styles.storageError}>{storageError}</Text>}

            <Text style={styles.sectionTitle}>Informações</Text>
            <View style={styles.measurements}>
              <Measurement label="Altura" value={`${(pokemon.height / 10).toFixed(1)} m`} />
              <Measurement label="Peso" value={`${(pokemon.weight / 10).toFixed(1)} kg`} />
            </View>

            <Text style={styles.sectionTitle}>Atributos básicos</Text>
            <View style={styles.statsCard}>
              {statOrder.map((name) => {
                const stat = pokemon.stats.find((item) => item.name === name);
                if (!stat) return null;

                const barWidth = `${Math.min((stat.value / 255) * 100, 100)}%` as `${number}%`;

                return (
                  <View key={stat.name} style={styles.statRow}>
                    <Text style={styles.statLabel}>{statLabels[stat.name]}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: barWidth }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Measurement({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.measurementCard}>
      <Text style={styles.measurementLabel}>{label}</Text>
      <Text style={styles.measurementValue}>{value}</Text>
    </View>
  );
}

function PokemonBiomeBackground({
  imageSource,
}: {
  imageSource: ReturnType<typeof getPokemonBiomeImage>;
}) {
  if (!imageSource) {
    return <View pointerEvents="none" style={styles.spriteCircle} />;
  }

  return (
    <View pointerEvents="none" style={styles.biomeImageClip}>
      <Image
        source={imageSource}
        resizeMode="contain"
        style={styles.biomeImage}
      />
    </View>
  );
}

function PokemonSprite({ pokemon }: { pokemon: Pokemon }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!pokemon.spriteUrl || imageFailed) {
    return (
      <View style={styles.spriteFallback}>
        <Text style={styles.fallbackMark}>?</Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={`${pokemon.name}, sprite pixel art`}
      onError={() => setImageFailed(true)}
      source={{ uri: pokemon.spriteUrl }}
      resizeMode="contain"
      style={styles.sprite}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#C92734',
  },
  screen: {
    flex: 1,
    backgroundColor: '#EEF1F4',
  },
  topBar: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#D82D39',
    borderBottomWidth: 3,
    borderBottomColor: '#A91F2C',
  },
  backButton: {
    minWidth: 88,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 5,
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  topBarSpacer: {
    width: 88,
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  pokemonHero: {
    minHeight: 255,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 33, 59, 0.14)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  number: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    color: '#344054',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },
  name: {
    flex: 1,
    color: '#17213B',
    fontSize: 27,
    fontWeight: '900',
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  typeBadge: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 33, 59, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  typeIcon: {
    width: 20,
    height: 20,
  },
  typeName: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '700',
  },
  spriteContainer: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  biomeSceneContainer: {
    width: '80%',
    maxWidth: 240,
    aspectRatio: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  biomeImageClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    zIndex: 0,
  },
  biomeImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 30,
    opacity: 0.88,
    zIndex: 0,
  },
  spriteOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  spriteCircle: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EDE2CB',
  },
  sprite: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  spriteFallback: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 0,
    borderRadius: 56,
    backgroundColor: 'transparent',
  },
  storageError: {
    marginTop: 10,
    color: '#C0392B',
    fontSize: 12,
    textAlign: 'center',
  },
  fallbackMark: {
    color: '#526071',
    fontSize: 36,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    color: '#17213B',
    fontSize: 19,
    fontWeight: '800',
  },
  measurements: {
    flexDirection: 'row',
    gap: 12,
  },
  measurementCard: {
    minHeight: 78,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D9DEE5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  measurementLabel: {
    color: '#7B8297',
    fontSize: 12,
  },
  measurementValue: {
    marginTop: 5,
    color: '#17213B',
    fontSize: 18,
    fontWeight: '800',
  },
  statsCard: {
    gap: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D9DEE5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 7,
  },
  statLabel: {
    width: 126,
    color: '#526071',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    width: 30,
    color: '#17213B',
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    height: 8,
    flex: 1,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#ECEEF3',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#EF3340',
  },
  messageState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  messageTitle: {
    color: '#17213B',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  messageText: {
    marginTop: 10,
    color: '#7B8297',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#D82D39',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
