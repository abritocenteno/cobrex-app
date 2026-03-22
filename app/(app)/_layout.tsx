import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AppShell from '../../src/components/AppShell';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  );
}
