import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
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
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync state if value changes from outside (like dragging the slider or resetting)
  useEffect(() => {
    setInputValue(formatValue ? formatValue(value) : value.toString());
  }, [value, formatValue]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      // Clamp value within bounds
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
      setInputValue(value.toString());
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      setInputValue(formatValue ? formatValue(clamped) : clamped.toString());
      onChange(clamped);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={[styles.valueBadge, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25', borderWidth: 1 }]}>
          <TextInput
            style={[styles.valueInput, { color: colors.primary }]}
            value={inputValue}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="numeric"
            selectTextOnFocus
            underlineColorAndroid="transparent"
          />
        </View>
      </View>
      <RNSlider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={(val) => {
          onChange(val);
          setInputValue(formatValue ? formatValue(val) : val.toString());
        }}
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueInput: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    padding: 0,
    minWidth: 42,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});