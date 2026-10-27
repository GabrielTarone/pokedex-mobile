import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_ICONS,
  POKEMON_TYPE_OPTIONS,
} from '@/constants/pokemonTypes';
import type {
  PokemonType,
  PokemonTypeCombinationMode,
} from '@/types/pokemon';

type PokemonTypeFilterSheetProps = {
  visible: boolean;
  appliedTypes: PokemonType[];
  appliedMode: PokemonTypeCombinationMode;
  onCancel: () => void;
  onApply: (types: PokemonType[], mode: PokemonTypeCombinationMode) => void;
};

export function PokemonTypeFilterSheet({
  visible,
  appliedTypes,
  appliedMode,
  onCancel,
  onApply,
}: PokemonTypeFilterSheetProps) {
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>(appliedTypes);
  const [combinationMode, setCombinationMode] =
    useState<PokemonTypeCombinationMode>(appliedMode);

  useEffect(() => {
    if (visible) {
      setSelectedTypes([...appliedTypes]);
      setCombinationMode(appliedMode);
    }
  }, [visible, appliedTypes, appliedMode]);

  function toggleType(type: PokemonType) {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((selectedType) => selectedType !== type)
        : [...current, type],
    );
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar filtros sem aplicar"
          accessibilityRole="button"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>FILTROS DA POKÉDEX</Text>
                <Text style={styles.title}>Filtrar Pokémon</Text>
              </View>
              <Pressable
                accessibilityLabel="Fechar filtros sem aplicar"
                accessibilityRole="button"
                hitSlop={4}
                onPress={onCancel}
                style={styles.closeButton}
              >
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.description}>Selecione um ou mais tipos</Text>

            <View style={styles.combinationRow}>
              <View style={styles.combinationCopy}>
                <Text style={styles.combinationLabel}>Combinar tipos</Text>
                <Text style={styles.combinationHint}>
                  {combinationMode === 'or' ? 'Qualquer tipo selecionado' : 'Todos os tipos selecionados'}
                </Text>
              </View>
              <View style={styles.modeSwitch}>
                <Pressable
                  accessibilityLabel="Modo OU: Pokémon com qualquer tipo selecionado"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: combinationMode === 'or' }}
                  onPress={() => setCombinationMode('or')}
                  style={[styles.modeButton, combinationMode === 'or' && styles.modeButtonSelected]}
                >
                  <Text style={[styles.modeButtonText, combinationMode === 'or' && styles.modeButtonTextSelected]}>
                    OU
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Modo E: Pokémon com todos os tipos selecionados"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: combinationMode === 'and' }}
                  onPress={() => setCombinationMode('and')}
                  style={[styles.modeButton, combinationMode === 'and' && styles.modeButtonSelected]}
                >
                  <Text style={[styles.modeButtonText, combinationMode === 'and' && styles.modeButtonTextSelected]}>
                    E
                  </Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.typeGrid}
              showsVerticalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {POKEMON_TYPE_OPTIONS.map((type) => {
                const selected = selectedTypes.includes(type);
                const color = POKEMON_TYPE_COLORS[type];

                return (
                  <Pressable
                    key={type}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleType(type)}
                    style={[
                      styles.typeOption,
                      selected && styles.typeOptionSelected,
                      selected && { borderColor: color, backgroundColor: '#FFF8F8' },
                    ]}
                  >
                    <Image
                      accessibilityIgnoresInvertColors
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      resizeMode="contain"
                      source={POKEMON_TYPE_ICONS[type]}
                      style={styles.typeIcon}
                    />
                    <Text style={styles.typeName}>{type}</Text>
                    <View
                      style={[
                        styles.selectionMark,
                        selected && { backgroundColor: color, borderColor: color },
                      ]}
                    >
                      {selected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedTypes([])}
                style={styles.clearButton}
              >
                <Text style={styles.clearText}>Limpar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onApply(selectedTypes, combinationMode)}
                style={styles.applyButton}
              >
                <Text style={styles.applyText}>Aplicar filtros</Text>
                <Text style={styles.applyCount}>{selectedTypes.length}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12, 22, 36, 0.52)',
  },
  safeArea: {
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: '#F8F9FB',
  },
  dragHandle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginBottom: 14,
    borderRadius: 4,
    backgroundColor: '#AAB3C0',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: 5,
    color: '#778294',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#17213B',
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#E9EDF2',
  },
  closeIcon: {
    marginTop: -3,
    color: '#17213B',
    fontSize: 30,
    lineHeight: 34,
  },
  description: {
    marginTop: 5,
    marginBottom: 13,
    color: '#697588',
    fontSize: 13,
  },
  combinationRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D9DEE6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  combinationCopy: {
    flex: 1,
  },
  combinationLabel: {
    color: '#243248',
    fontSize: 12,
    fontWeight: '800',
  },
  combinationHint: {
    marginTop: 2,
    color: '#778294',
    fontSize: 10,
  },
  modeSwitch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    backgroundColor: '#EDF0F4',
  },
  modeButton: {
    minWidth: 44,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modeButtonSelected: {
    backgroundColor: '#D82D39',
  },
  modeButtonText: {
    color: '#526071',
    fontSize: 12,
    fontWeight: '900',
  },
  modeButtonTextSelected: {
    color: '#FFFFFF',
  },
  typeScroll: {
    flexShrink: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
    paddingBottom: 10,
  },
  typeOption: {
    width: '48%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#D9DEE6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  typeOptionSelected: {
    borderWidth: 2,
  },
  typeIcon: {
    width: 28,
    height: 28,
  },
  typeName: {
    flex: 1,
    color: '#243248',
    fontSize: 12,
    fontWeight: '700',
  },
  selectionMark: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9D0D9',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E4EA',
  },
  clearButton: {
    minWidth: 92,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFC8D4',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  clearText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '800',
  },
  applyButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 12,
    backgroundColor: '#D82D39',
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  applyCount: {
    minWidth: 22,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
});
