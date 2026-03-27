import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const registerToken = useMutation(api.pushTokens.register);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Push notifications only work on physical devices
    if (!Device.isDevice || Platform.OS === 'web') return;

    async function setup() {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      // Get the Expo push token (projectId is required for SDK 53+)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'cobrex-app',
      });

      await registerToken({
        token: tokenData.data,
        platform: Platform.OS,
      });
    }

    setup().catch(console.warn);

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // In-app notification handling can go here if needed
      }
    );

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Navigate based on response.notification.request.content.data if needed
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
