import { StyleSheet, View } from 'react-native';

type FilterIconProps = {
  color: string;
  backgroundColor: string;
};

export function FilterIcon({ color, backgroundColor }: FilterIconProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.icon}
    >
      {[3, 10, 5].map((left, index) => (
        <View key={index} style={[styles.track, { backgroundColor: color }]}>
          <View
            style={[
              styles.knob,
              { left, borderColor: color, backgroundColor },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 20,
    height: 18,
    justifyContent: 'space-around',
  },
  track: {
    height: 2,
    width: 18,
    borderRadius: 2,
  },
  knob: {
    position: 'absolute',
    top: -2,
    width: 6,
    height: 6,
    borderWidth: 1.5,
    borderRadius: 3,
  },
});
