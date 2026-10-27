import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { loadFavoriteIds, saveFavoriteIds } from '@/services/favoritesStorage';

type FavoritesContextValue = {
  favoriteIds: number[];
  isFavoritesLoading: boolean;
  storageError: string | null;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const favoriteIdsRef = useRef<number[]>([]);
  const isReadyRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestSaveVersionRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    loadFavoriteIds()
      .then((ids) => {
        if (!isMounted) return;
        favoriteIdsRef.current = ids;
        setFavoriteIds(ids);
      })
      .catch(() => {
        if (isMounted) {
          setStorageError('Não foi possível ler os favoritos salvos.');
        }
      })
      .finally(() => {
        if (isMounted) {
          isReadyRef.current = true;
          setIsFavoritesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isFavorite = useCallback(
    (id: number) => favoriteIds.includes(id),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(async (id: number) => {
    if (!isReadyRef.current) return;

    const currentIds = favoriteIdsRef.current;
    const nextIds = currentIds.includes(id)
      ? currentIds.filter((favoriteId) => favoriteId !== id)
      : [...currentIds, id];

    favoriteIdsRef.current = nextIds;
    setFavoriteIds(nextIds);
    setStorageError(null);
    const saveVersion = latestSaveVersionRef.current + 1;
    latestSaveVersionRef.current = saveVersion;

    const saveOperation = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveFavoriteIds(nextIds));
    saveQueueRef.current = saveOperation;

    try {
      await saveOperation;
      if (saveVersion === latestSaveVersionRef.current) setStorageError(null);
    } catch {
      if (saveVersion === latestSaveVersionRef.current) {
        setStorageError('Não foi possível salvar seus favoritos neste dispositivo.');
      }
    }
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isFavoritesLoading,
        storageError,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites deve ser usado dentro de FavoritesProvider.');
  }

  return context;
}
