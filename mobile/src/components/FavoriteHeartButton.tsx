import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type FavoriteHeartButtonProps = {
  pokemonName: string;
  isFavorite: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function FavoriteHeartButton({
  pokemonName,
  isFavorite,
  disabled = false,
  onPress,
  style,
}: FavoriteHeartButtonProps) {
  return (
    <Pressable
      accessibilityLabel={
        isFavorite
          ? `Remover ${pokemonName} dos favoritos`
          : `Adicionar ${pokemonName} aos favoritos`
      }
      accessibilityRole="button"
      accessibilityState={{ selected: isFavorite, disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        isFavorite && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.heart, isFavorite && styles.heartSelected]}>
        {isFavorite ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 33, 59, 0.12)',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
  selected: {
    borderColor: 'rgba(239, 51, 64, 0.2)',
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.5,
  },
  heart: {
    color: '#17213B',
    fontSize: 23,
    lineHeight: 26,
  },
  heartSelected: {
    color: '#EF3340',
  },
});
