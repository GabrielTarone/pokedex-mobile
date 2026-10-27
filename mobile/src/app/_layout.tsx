import { Stack } from 'expo-router';

import { FavoritesProvider } from '@/contexts/FavoritesContext';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </FavoritesProvider>
  );
}
