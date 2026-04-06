import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '../src/constants/colors';

// Landing page for web OAuth redirect flow.
// Clerk processes the token from the URL on mount; once isSignedIn is true we route normally.
export default function SSOCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace('/(app)');
    } else {
      // Auth didn't complete (cancelled or failed) — send back to sign-in
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}
