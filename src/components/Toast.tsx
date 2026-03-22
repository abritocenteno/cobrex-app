import { useEffect, useRef } from 'react';
import { Animated, Text, View, Platform } from 'react-native';
import { Colors } from '../constants/colors';

export type ToastType = 'success' | 'error' | 'info';

interface Props {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
}

const TOAST_COLORS = {
  success: Colors.green,
  error: Colors.accentRed,
  info: Colors.accentBlue,
};

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export default function Toast({ message, type = 'success', visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const color = TOAST_COLORS[type];

  return (
    <Animated.View style={{
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 20,
      left: 20,
      right: 20,
      zIndex: 9999,
      opacity,
      transform: [{ translateY }],
      alignItems: 'center',
    }}>
      <View style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: `${color}40`,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: `${color}20`, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color, fontSize: 13, fontFamily: 'DMSans_700Bold' }}>{TOAST_ICONS[type]}</Text>
        </View>
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>{message}</Text>
      </View>
    </Animated.View>
  );
}
