import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  darkMode?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0,
  onChange,
  formatValue,
  darkMode = true,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={[styles.valueBadge, { backgroundColor: colors.primary + '12' }]}>
          <Text style={[styles.valueText, { color: colors.primary }]}>
            {displayValue}
          </Text>
        </View>
      </View>
      <RNSlider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        onSlidingComplete={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  valueBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  valueText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});