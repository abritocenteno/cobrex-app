import '../global.css';
import { Slot } from 'expo-router';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import * as SecureStore from 'expo-secure-store';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/constants/colors';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk
      client={convex}
      useAuth={useAuth}
      templateName="convex"
    >
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    BebasNeue_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <ConvexClerkProvider>
          <Slot />
        </ConvexClerkProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
