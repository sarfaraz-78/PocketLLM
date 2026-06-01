import React, { useRef } from 'react';
import { Animated, PanResponder, ViewStyle, StyleProp } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHaptics } from '../services/Haptics';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon: string; color?: string; label?: string };
  rightAction?: { icon: string; color?: string; label?: string };
  threshold?: number;
  style?: StyleProp<ViewStyle>;
}

const SwipeableMessageBase: React.FC<SwipeableMessageProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
  style,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const triggered = useRef(false);
  const haptics = useHaptics();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy);
      },
      onPanResponderGrant: () => {
        startX.current = 0;
        triggered.current = false;
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
        if (Math.abs(g.dx) > threshold && !triggered.current) {
          triggered.current = true;
          haptics.selection();
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -threshold && onSwipeLeft) {
          haptics.medium();
          onSwipeLeft();
        } else if (g.dx > threshold && onSwipeRight) {
          haptics.medium();
          onSwipeRight();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const leftBg = leftAction?.color || '#EF4444';
  const rightBg = rightAction?.color || '#10B981';

  return (
    <Animated.View
      style={[{ transform: [{ translateX }] }, style]}
      {...panResponder.panHandlers}
    >
      {leftAction && (
        <Animated.View
          style={[
            actionStyle.actionLeft,
            { backgroundColor: leftBg, opacity: translateX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: 'clamp' }) },
          ]}
          pointerEvents="none"
        >
          <Icon name={leftAction.icon} size={20} color="#fff" />
          {leftAction.label && <Animated.Text style={actionStyle.actionLabel}>{leftAction.label}</Animated.Text>}
        </Animated.View>
      )}
      {rightAction && (
        <Animated.View
          style={[
            actionStyle.actionRight,
            { backgroundColor: rightBg, opacity: translateX.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' }) },
          ]}
          pointerEvents="none"
        >
          <Icon name={rightAction.icon} size={20} color="#fff" />
          {rightAction.label && <Animated.Text style={actionStyle.actionLabel}>{rightAction.label}</Animated.Text>}
        </Animated.View>
      )}
      {children}
    </Animated.View>
  );
};

const actionStyle = {
  actionLeft: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionRight: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
    marginTop: 4,
  },
};

export const SwipeableMessage = React.memo(SwipeableMessageBase);
