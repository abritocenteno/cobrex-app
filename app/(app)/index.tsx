import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function AppIndex() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);

  useEffect(() => {
    if (profile === undefined) return; // still loading
    if (profile === null || !profile.role) {
      router.replace('/(app)/role-selection');
    } else {
      router.replace('/(app)/dashboard');
    }
  }, [profile]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 40, color: Colors.accent, letterSpacing: 4, marginBottom: 16 }}>
        COBREX
      </Text>
      <ActivityIndicator color={Colors.accent} />
    </View>
  );
}
