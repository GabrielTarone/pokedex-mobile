import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { PokemonCard } from '@/components/PokemonCard';
import { FilterIcon } from '@/components/FilterIcon';
import { PokemonTypeFilterSheet } from '@/components/PokemonTypeFilterSheet';
import { PokeballMark } from '@/components/PokeballMark';
import { useFavorites } from '@/contexts/FavoritesContext';
import {
  getPokemonByIds,
  getPokemonIdsByTypes,
  getSpeciesIndex,
  type PokemonSpeciesEntry,
} from '@/services/pokeApi';
import type {
  Pokemon,
  PokemonType,
  PokemonTypeCombinationMode,
} from '@/types/pokemon';

type Tab = 'pokedex' | 'favorites';
const CATALOG_PAGE_SIZE = 24;

export default function IndexRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columnCount = width < 360 ? 1 : 2;
  const {
    favoriteIds,
    isFavoritesLoading,
    storageError,
    toggleFavorite,
  } = useFavorites();
  const [activeTab, setActiveTab] = useState<Tab>('pokedex');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);
  const [typeCombinationMode, setTypeCombinationMode] =
    useState<PokemonTypeCombinationMode>('or');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [speciesIndex, setSpeciesIndex] = useState<PokemonSpeciesEntry[]>([]);
  const [pokemonById, setPokemonById] = useState<Record<number, Pokemon>>({});
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTypeFilterLoading, setIsTypeFilterLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [typeFilterError, setTypeFilterError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [typeFilterResult, setTypeFilterResult] = useState<{
    key: string;
    ids: Set<number>;
  } | null>(null);
  const [catalogRetryCount, setCatalogRetryCount] = useState(0);
  const [favoriteRetryCount, setFavoriteRetryCount] = useState(0);
  const loadedCountRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const catalogGenerationRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchText(searchText), 250);
    return () => clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    let isCurrentScreen = true;
    setIsLoading(true);
    setErrorMessage(null);

    getSpeciesIndex(catalogRetryCount > 0)
      .then((species) => {
        if (isCurrentScreen) setSpeciesIndex(species);
      })
      .catch((error: unknown) => {
        if (!isCurrentScreen) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao carregar os Pokémon. Tente novamente.',
        );
      })
      .finally(() => {
        if (isCurrentScreen) setIsLoading(false);
      });

    return () => {
      isCurrentScreen = false;
    };
  }, [catalogRetryCount]);

  const typeFilterKey = `${selectedTypes.join('|')}:${typeCombinationMode}`;

  useEffect(() => {
    let isCurrent = true;

    if (selectedTypes.length === 0) {
      setTypeFilterResult(null);
      setTypeFilterError(null);
      setIsTypeFilterLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setTypeFilterResult(null);
    setTypeFilterError(null);
    setIsTypeFilterLoading(true);
    getPokemonIdsByTypes(selectedTypes, typeCombinationMode)
      .then((ids) => {
        if (isCurrent) setTypeFilterResult({ key: typeFilterKey, ids: new Set(ids) });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setTypeFilterError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os Pokémon desses tipos.',
        );
      })
      .finally(() => {
        if (isCurrent) setIsTypeFilterLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedTypes, typeCombinationMode, typeFilterKey, catalogRetryCount]);

  const normalizedSearch = debouncedSearchText.trim().toLowerCase().replace(/^#/, '');
  const typeFilterReady = selectedTypes.length === 0 || typeFilterResult?.key === typeFilterKey;
  const candidateIds = useMemo(() => {
    if (!typeFilterReady) return [];
    return speciesIndex
      .filter((species) => {
        const number = String(species.id);
        const paddedNumber = number.padStart(3, '0');
        const matchesSearch = normalizedSearch.length === 0 || (
          /^\d+$/.test(normalizedSearch)
            ? number.startsWith(normalizedSearch) || paddedNumber.startsWith(normalizedSearch)
            : species.name.includes(normalizedSearch)
        );
        const matchesType = selectedTypes.length === 0 || Boolean(typeFilterResult?.ids.has(species.id));
        return matchesSearch && matchesType;
      })
      .map((species) => species.id);
  }, [speciesIndex, normalizedSearch, selectedTypes.length, typeFilterReady, typeFilterResult]);

  const [isCatalogPageLoading, setIsCatalogPageLoading] = useState(false);

  useEffect(() => {
    const generation = catalogGenerationRef.current + 1;
    catalogGenerationRef.current = generation;
    let isCurrent = true;
    const firstPageIds = candidateIds.slice(0, CATALOG_PAGE_SIZE);

    loadedCountRef.current = 0;
    setLoadedCount(0);
    setIsCatalogPageLoading(firstPageIds.length > 0);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;
    setLoadMoreError(null);

    if (firstPageIds.length === 0) {
      setIsCatalogPageLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    getPokemonByIds(firstPageIds)
      .then((results) => {
        if (!isCurrent || generation !== catalogGenerationRef.current) return;
        setPokemonById((current) => ({
          ...current,
          ...Object.fromEntries(results.map((item) => [item.id, item])),
        }));
        loadedCountRef.current = firstPageIds.length;
        setLoadedCount(firstPageIds.length);
      })
      .catch((error: unknown) => {
        if (!isCurrent || generation !== catalogGenerationRef.current) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao carregar os Pokémon. Tente novamente.',
        );
      })
      .finally(() => {
        if (isCurrent && generation === catalogGenerationRef.current) {
          setIsCatalogPageLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [candidateIds, catalogRetryCount]);

  const visiblePokemon = useMemo(
    () => candidateIds
      .slice(0, loadedCount)
      .map((id) => pokemonById[id])
      .filter((item): item is Pokemon => item !== undefined),
    [candidateIds, loadedCount, pokemonById],
  );

  const favoritePokemon = useMemo(
    () => favoriteIds
      .map((id) => pokemonById[id])
      .filter((item): item is Pokemon => item !== undefined),
    [favoriteIds, pokemonById],
  );

  useEffect(() => {
    let isCurrent = true;
    if (favoriteIds.length === 0) {
      setFavoriteError(null);
      return () => {
        isCurrent = false;
      };
    }

    getPokemonByIds(favoriteIds)
      .then((results) => {
        if (!isCurrent) return;
        setPokemonById((current) => ({
          ...current,
          ...Object.fromEntries(results.map((item) => [item.id, item])),
        }));
        setFavoriteError(null);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setFavoriteError(
          error instanceof Error ? error.message : 'Não foi possível carregar os favoritos.',
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [favoriteIds, favoriteRetryCount]);

  async function loadMorePokemon(isRetry = false) {
    if (
      isLoadingMoreRef.current ||
      isCatalogPageLoading ||
      errorMessage ||
      (loadMoreError && !isRetry) ||
      loadedCountRef.current >= candidateIds.length
    ) return;

    const generation = catalogGenerationRef.current;
    const start = loadedCountRef.current;
    const nextIds = candidateIds.slice(start, start + CATALOG_PAGE_SIZE);
    if (!nextIds.length) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const results = await getPokemonByIds(nextIds);
      if (generation !== catalogGenerationRef.current) return;
      setPokemonById((current) => ({
        ...current,
        ...Object.fromEntries(results.map((item) => [item.id, item])),
      }));
      loadedCountRef.current = start + nextIds.length;
      setLoadedCount(start + nextIds.length);
      setLoadMoreError(null);
    } catch (error) {
      if (generation === catalogGenerationRef.current) {
        setLoadMoreError(
          error instanceof Error ? error.message : 'Não foi possível carregar mais Pokémon.',
        );
      }
    } finally {
      if (generation === catalogGenerationRef.current) {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }

  function openDetails(item: Pokemon) {
    router.push({
      pathname: '/pokemon/[id]',
      params: { id: String(item.id) },
    });
  }

  const listHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandLockup}>
            <PokeballMark size={28} />
            <Text style={styles.brand}>POKÉDEX</Text>
          </View>
          <View style={styles.deviceBadge}>
            <View style={styles.statusLight} />
            <Text style={styles.deviceBadgeText}>DEX-01</Text>
          </View>
        </View>
        <Text style={styles.eyebrow}>REGIÃO DE KANTO</Text>
        <Text style={styles.title}>Quem você vai{ '\n' }encontrar?</Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Buscar Pokémon pelo nome"
            onChangeText={(value) => {
              if (speciesIndex.length > 0) {
                setErrorMessage(null);
                setLoadMoreError(null);
              }
              setSearchText(value);
            }}
            placeholder="Buscar Pokémon"
            placeholderTextColor="#9298A9"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchText}
          />
        </View>

        <Pressable
          accessibilityLabel={
            selectedTypes.length > 0
              ? `Filtrar por tipo, ${selectedTypes.length} tipos selecionados`
              : 'Filtrar por tipo'
          }
          accessibilityRole="button"
          accessibilityState={{ selected: selectedTypes.length > 0 }}
          onPress={() => {
            Keyboard.dismiss();
            setIsFilterSheetVisible(true);
          }}
          style={({ pressed }) => [styles.filterLauncher, pressed && styles.filterLauncherPressed]}
        >
          <FilterIcon color="#FFFFFF" backgroundColor="#D82D39" />
          <Text style={styles.filterLauncherText}>Filtrar por tipo</Text>
          {selectedTypes.length > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{selectedTypes.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionEyebrow}>EXPLORE</Text>
          <Text style={styles.sectionTitle}>Pokémon</Text>
        </View>
        <Text style={styles.resultCount}>{candidateIds.length} encontrados</Text>
      </View>

    </>
  );

  const favoritesHeader = (
    <View style={styles.favoritesHero}>
      <View style={styles.brandRow}>
        <View style={styles.brandLockup}>
          <PokeballMark size={28} />
          <Text style={styles.brand}>POKÉDEX</Text>
        </View>
        <View style={styles.deviceBadge}>
          <View style={styles.statusLight} />
          <Text style={styles.deviceBadgeText}>DEX-01</Text>
        </View>
      </View>
      <Text style={styles.eyebrow}>ARQUIVO DE CAPTURAS</Text>
      <Text style={styles.favoritesTitle}>Favoritos</Text>
      <Text style={styles.favoritesDescription}>
        {String(favoriteIds.length).padStart(2, '0')} Pokémon salvos
      </Text>
      {storageError && <Text style={styles.storageMessage}>{storageError}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.screen}>
        {activeTab === 'pokedex' ? (
          <FlatList
            key={`catalog-${columnCount}`}
            columnWrapperStyle={columnCount === 1 ? undefined : styles.cardRow}
            contentContainerStyle={styles.listContent}
            data={visiblePokemon}
            keyExtractor={(pokemon) => String(pokemon.id)}
            ListEmptyComponent={
              isLoading || isTypeFilterLoading || isCatalogPageLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color="#EF3340" size="large" />
                  <Text style={styles.emptyText}>
                    {isTypeFilterLoading ? 'Aplicando filtros...' : 'Carregando Pokémon...'}
                  </Text>
                </View>
              ) : errorMessage || typeFilterError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
                  <Text style={styles.emptyText}>{errorMessage ?? typeFilterError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCatalogRetryCount((count) => count + 1)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Nenhum Pokémon encontrado</Text>
                  <Text style={styles.emptyText}>Tente outro nome ou tipo.</Text>
                </View>
              )
            }
            ListHeaderComponent={listHeader}
            numColumns={columnCount}
            renderItem={({ item }) => (
              <PokemonCard
                pokemon={item}
                isFavorite={favoriteIds.includes(item.id)}
                favoriteDisabled={isFavoritesLoading}
                onToggleFavorite={() => void toggleFavorite(item.id)}
                onPress={() =>
                  openDetails(item)
                }
              />
            )}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color="#EF3340" />
                  <Text style={styles.emptyText}>Carregando mais Pokémon...</Text>
                </View>
              ) : loadMoreError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{loadMoreError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void loadMorePokemon(true)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : undefined
            }
            onEndReached={() => void loadMorePokemon()}
            onEndReachedThreshold={0.45}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            key={`favorites-${columnCount}`}
            columnWrapperStyle={columnCount === 1 ? undefined : styles.cardRow}
            contentContainerStyle={styles.listContent}
            data={favoritePokemon}
            keyExtractor={(pokemon) => String(pokemon.id)}
            ListEmptyComponent={
              isFavoritesLoading || (favoriteIds.length > favoritePokemon.length && !favoriteError) ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color="#EF3340" size="large" />
                  <Text style={styles.emptyText}>Carregando favoritos...</Text>
                </View>
              ) : favoriteIds.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Sua coleção está vazia</Text>
                  <Text style={styles.emptyText}>
                    Abra os detalhes de um Pokémon e toque no coração para salvá-lo.
                  </Text>
                </View>
              ) : favoriteError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
                  <Text style={styles.emptyText}>{favoriteError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setFavoriteRetryCount((count) => count + 1)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Favoritos não encontrados</Text>
                  <Text style={styles.emptyText}>
                    Volte à Pokédex para carregar o catálogo novamente.
                  </Text>
                </View>
              )
            }
            ListHeaderComponent={favoritesHeader}
            numColumns={columnCount}
            renderItem={({ item }) => (
              <PokemonCard
                pokemon={item}
                isFavorite
                favoriteDisabled={isFavoritesLoading}
                onPress={() => openDetails(item)}
                onToggleFavorite={() => void toggleFavorite(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}

        <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
          <View style={styles.bottomNav}>
            <TabButton
              label="Pokédex"
              icon="◉"
              selected={activeTab === 'pokedex'}
              onPress={() => setActiveTab('pokedex')}
            />
            <TabButton
              label="Favoritos"
              icon="♡"
              selected={activeTab === 'favorites'}
              onPress={() => setActiveTab('favorites')}
            />
          </View>
        </SafeAreaView>
      </View>

      <PokemonTypeFilterSheet
        visible={isFilterSheetVisible}
        appliedTypes={selectedTypes}
        appliedMode={typeCombinationMode}
        onCancel={() => setIsFilterSheetVisible(false)}
        onApply={(types, mode) => {
          if (speciesIndex.length > 0) {
            setErrorMessage(null);
            setLoadMoreError(null);
          }
          setSelectedTypes(types);
          setTypeCombinationMode(mode);
          setIsFilterSheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
};

function TabButton({ label, icon, selected, onPress }: TabButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tabButton, selected && styles.tabButtonActive]}
    >
      <Text style={[styles.tabIcon, selected && styles.tabSelected]}>{icon}</Text>
      <Text style={[styles.tabLabel, selected && styles.tabSelected]}>{label}</Text>
    </Pressable>
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
  listContent: {
    paddingBottom: 12,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#D82D39',
    borderBottomWidth: 4,
    borderBottomColor: '#A91F2C',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 8,
    backgroundColor: 'rgba(95, 13, 24, 0.2)',
  },
  statusLight: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A9F2C4',
  },
  deviceBadgeText: {
    color: '#FFE7E9',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eyebrow: {
    marginBottom: 8,
    color: '#FFE7E9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  searchBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#C9D0D9',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    color: '#D82D39',
    fontSize: 25,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: '#17213B',
    fontSize: 14,
  },
  filterLauncher: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 9,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 10,
    backgroundColor: 'rgba(100, 13, 24, 0.18)',
  },
  filterLauncherPressed: {
    backgroundColor: 'rgba(100, 13, 24, 0.32)',
  },
  filterLauncherText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterCountBadge: {
    minWidth: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  filterCountText: {
    color: '#C92734',
    fontSize: 11,
    fontWeight: '900',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
  },
  sectionEyebrow: {
    marginBottom: 6,
    color: '#7B8297',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  sectionTitle: {
    color: '#17213B',
    fontSize: 26,
    fontWeight: '800',
  },
  resultCount: {
    paddingBottom: 4,
    color: '#7B8297',
    fontSize: 11,
  },
  cardRow: {
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#17213B',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 7,
    color: '#7B8297',
    fontSize: 13,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EF3340',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  favoritesHero: {
    marginBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 4,
    borderBottomColor: '#A91F2C',
    backgroundColor: '#D82D39',
  },
  favoritesTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  favoritesDescription: {
    marginTop: 8,
    color: '#FFE7E9',
    fontSize: 13,
    fontWeight: '600',
  },
  storageMessage: {
    marginTop: 8,
    color: '#FFE7E9',
    fontSize: 12,
  },
  bottomNav: {
    minHeight: 74,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#314560',
    backgroundColor: '#17213B',
  },
  bottomSafeArea: {
    backgroundColor: '#17213B',
  },
  tabButton: {
    minWidth: 132,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginVertical: 6,
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: '#293D59',
  },
  tabIcon: {
    color: '#AAB5C4',
    fontSize: 21,
  },
  tabLabel: {
    color: '#C6CFDA',
    fontSize: 11,
    fontWeight: '600',
  },
  tabSelected: {
    color: '#FF5A65',
    fontWeight: '800',
  },
});
