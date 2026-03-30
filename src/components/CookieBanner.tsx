import React from 'react';
import { View, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import { useCookieConsent } from '../hooks/useCookieConsent';

const PRIVACY_POLICY_URL = 'https://cobrex.app/privacy';

export function CookieBanner() {
  const { pending, accept, reject } = useCookieConsent();

  if (Platform.OS !== 'web' || !pending) return null;

  return (
    <View
      style={{
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#12121A',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        zIndex: 9999,
      }}
    >
      <Text style={{ color: '#6B6B80', fontSize: 13, flex: 1, lineHeight: 20 }}>
        We use cookies to keep you signed in and improve your experience.{' '}
        <Text
          style={{ color: '#2563EB', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        >
          Privacy Policy
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
        <TouchableOpacity
          onPress={reject}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
          accessibilityRole="button"
          accessibilityLabel="Reject non-essential cookies"
        >
          <Text style={{ color: '#6B6B80', fontSize: 13, fontWeight: '500' }}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={accept}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#2563EB',
          }}
          accessibilityRole="button"
          accessibilityLabel="Accept cookies"
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
