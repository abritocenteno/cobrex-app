import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import AppShell from '../../src/components/AppShell';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

function PushNotificationSetup() {
  usePushNotifications();
  return null;
}

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return (
    <AppShell>
      <PushNotificationSetup />
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  );
}
