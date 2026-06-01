import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION } from '../../theme/tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number | string;
  showHandle?: boolean;
  showClose?: boolean;
}

const BottomSheetBase: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  height = '60%',
  showHandle = true,
  showClose = true,
}) => {
  const { colors } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const numericHeight =
    typeof height === 'string'
      ? (parseFloat(height) / 100) * screenHeight
      : height;

  const translateY = useRef(new Animated.Value(numericHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: numericHeight,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [numericHeight]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(numericHeight);
      backdropOpacity.setValue(0);
      open();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.glassBgStrong,
                borderColor: colors.glassBorder,
                borderTopWidth: 1,
                height: numericHeight,
                transform: [{ translateY }],
                shadowColor: colors.glow,
                shadowOpacity: 0.4,
              },
              ELEVATION[4],
            ]}
          >
            {showHandle && <View style={[styles.handle, { backgroundColor: colors.glassBorder }]} />}

            {(title || showClose) && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {showClose && (
                  <TouchableOpacity onPress={close} hitSlop={8}>
                    <Icon name="close" size={22} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.content}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const arePropsEqual = (p: BottomSheetProps, n: BottomSheetProps) => {
  return (
    p.visible === n.visible &&
    p.title === n.title &&
    p.height === n.height &&
    p.children === n.children
  );
};

export const BottomSheet = React.memo(BottomSheetBase, arePropsEqual);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  content: {
    flex: 1,
  },
});
