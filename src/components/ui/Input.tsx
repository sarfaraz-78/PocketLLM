import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../../theme/tokens';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
  autoCorrect?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  editable?: boolean;
  style?: ViewStyle;
  variant?: 'glass' | 'default';
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCorrect = true,
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
  style,
  variant = 'glass',
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.glassBorder, error ? colors.error : colors.primary],
  });

  const glowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: variant === 'glass' ? colors.glassBg : colors.inputBackground,
            borderColor,
            shadowColor: colors.glow,
            shadowOpacity: glowOpacity,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: isFocused ? 4 : 0,
          },
          multiline && { minHeight: 100, alignItems: 'flex-start' },
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={18}
            color={isFocused ? colors.primary : colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            multiline && { textAlignVertical: 'top', paddingTop: SPACING.md },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} hitSlop={8}>
            <Icon name={rightIcon} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? (
        <Text style={[styles.helperText, { color: colors.error }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    paddingVertical: SPACING.md,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
});
