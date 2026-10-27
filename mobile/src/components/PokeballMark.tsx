import { StyleSheet, View } from 'react-native';

type PokeballMarkProps = {
  size?: number;
  opacity?: number;
};

export function PokeballMark({ size = 28, opacity = 1 }: PokeballMarkProps) {
  const lineWidth = Math.max(1.5, size * 0.055);
  const centerSize = size * 0.36;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: lineWidth,
          opacity,
        },
      ]}
    >
      <View style={styles.redTop} />
      <View style={[styles.middleLine, { height: lineWidth * 1.5 }]} />
      <View
        style={[
          styles.centerButton,
          {
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            borderWidth: lineWidth,
          },
        ]}
      >
        <View style={styles.centerDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ball: {
    position: 'relative',
    overflow: 'hidden',
    borderColor: '#17213B',
    backgroundColor: '#FFFFFF',
  },
  redTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '49%',
    backgroundColor: '#EF3340',
  },
  middleLine: {
    position: 'absolute',
    top: '47%',
    left: 0,
    right: 0,
    backgroundColor: '#17213B',
  },
  centerButton: {
    position: 'absolute',
    top: '31%',
    left: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#17213B',
    backgroundColor: '#FFFFFF',
  },
  centerDot: {
    width: '42%',
    height: '42%',
    borderRadius: 20,
    backgroundColor: '#EF3340',
  },
});
