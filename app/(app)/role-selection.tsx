import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Colors } from '../../src/constants/colors';

const ROLES = [
  { id: 'artist', label: 'Artist', description: 'Manage your shows, deals, and career', emoji: '🎤' },
  { id: 'manager', label: 'Manager', description: 'Manage your roster and bookings', emoji: '🎯' },
  { id: 'venue', label: 'Venue', description: 'Manage your venue and events', emoji: '🏛️' },
];

function onboardingPath(role: string) {
  if (role === 'artist') return '/(app)/onboarding';
  if (role === 'manager') return '/(app)/onboarding/manager';
  if (role === 'venue') return '/(app)/onboarding/venue';
  return '/(app)/dashboard';
}

export default function RoleSelection() {
  const { user } = useUser();
  const router = useRouter();
  const { role: preRole, displayName: preDisplayName } = useLocalSearchParams<{ role?: string; displayName?: string }>();

  const createProfile = useMutation(api.users.createProfile);
  const [selected, setSelected] = useState<string>(preRole ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-submit when coming from the sign-up stepper with pre-filled role + name
  useEffect(() => {
    if (!preRole || !preDisplayName || !user || loading) return;
    setLoading(true);
    createProfile({
      role: preRole as any,
      displayName: preDisplayName,
      email: user.primaryEmailAddress?.emailAddress ?? '',
    })
      .then(() => router.replace(onboardingPath(preRole) as any))
      .catch((e: any) => {
        setLoading(false);
        setError(e.message ?? 'Failed to create profile');
      });
  // Only run once when user becomes available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Show a loading screen while auto-submitting
  if (preRole && preDisplayName) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        {error ? (
          <Text style={{ color: Colors.accentRed, fontSize: 14, textAlign: 'center', padding: 32 }}>{error}</Text>
        ) : (
          <>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 40, color: Colors.accent, letterSpacing: 4, marginBottom: 24 }}>COBREX</Text>
            <ActivityIndicator color={Colors.accent} />
          </>
        )}
      </View>
    );
  }

  // Normal UI for OAuth users who skipped the sign-up stepper
  const handleContinue = async () => {
    if (!selected || !user) return;
    setLoading(true);
    setError('');
    try {
      await createProfile({
        role: selected as any,
        displayName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'User',
        email: user.primaryEmailAddress?.emailAddress ?? '',
      });
      router.replace(onboardingPath(selected) as any);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
        <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
          <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 40, color: Colors.accent, letterSpacing: 4, marginBottom: 8 }}>
            COBREX
          </Text>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 8 }}>
            What's your role?
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 32 }}>
            Choose how you'll use Cobrex. This can't be changed later.
          </Text>

          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => setSelected(role.id)}
              style={{
                backgroundColor: selected === role.id ? Colors.surface2 : Colors.surface,
                borderWidth: 1,
                borderColor: selected === role.id ? Colors.accent : Colors.border,
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 32, marginRight: 16 }}>{role.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 4 }}>{role.label}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{role.description}</Text>
              </View>
              {selected === role.id && (
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selected || loading}
            style={{
              backgroundColor: selected ? Colors.accent : Colors.surface2,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              marginTop: 8,
              opacity: selected ? 1 : 0.5,
            }}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: selected ? '#000' : Colors.textMuted }}>Continue</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
