import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = '@pokedex/favorite-pokemon-ids';

export async function loadFavoriteIds(): Promise<number[]> {
  const savedValue = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
  if (!savedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(savedValue);
    if (!Array.isArray(parsedValue)) return [];

    return Array.from(
      new Set(
        parsedValue.filter(
          (id): id is number => Number.isSafeInteger(id) && id > 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

export async function saveFavoriteIds(ids: number[]): Promise<void> {
  const uniqueIds = Array.from(new Set(ids)).sort((first, second) => first - second);
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(uniqueIds));
}
