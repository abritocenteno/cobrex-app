import { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: Colors.surface2,
        opacity,
      }, style]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 18, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SkeletonBox width={48} height={48} borderRadius={10} style={{ marginRight: 14 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="70%" height={15} />
          <SkeletonBox width="50%" height={12} />
        </View>
        <SkeletonBox width={60} height={24} borderRadius={20} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

export function SkeletonStatCards() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, minWidth: 140, gap: 10 }}>
          <SkeletonBox width="60%" height={11} />
          <SkeletonBox width="80%" height={28} />
          <SkeletonBox width="50%" height={12} />
        </View>
      ))}
    </View>
  );
}
