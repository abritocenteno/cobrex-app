import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/colors';
import ScreenContainer from '../../src/components/ScreenContainer';
import Toast from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const updateProfile = useMutation(api.users.update);

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await updateProfile({ displayName: displayName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save');
      showToast(e.message ?? 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  if (profile === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 4 };

  return (
    <ScreenContainer>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Profile</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          Manage your account settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0, maxWidth: 600, width: '100%', alignSelf: 'center' }}>

        {/* Avatar placeholder */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: `${Colors.accent}30`, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 32, color: Colors.accent }}>
              {(profile?.displayName ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.accent}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1 }}>
              {profile?.role ?? 'artist'}
            </Text>
          </View>
        </View>

        {/* Profile info */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>👤 Profile Info</Text>

          <Text style={labelStyle}>Display Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={Colors.textMuted}
            style={inputStyle}
          />

          <Text style={labelStyle}>Email</Text>
          <View style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>{profile?.email ?? '—'}</Text>
          </View>

          <Text style={labelStyle}>Role</Text>
          <View style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textTransform: 'capitalize' }}>{profile?.role ?? '—'}</Text>
          </View>

          {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: saved ? Colors.green : Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          >
            {saving
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>
                  {saved ? '✓ Saved!' : 'Save Changes'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Account info */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>⚙️ Account</Text>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Profile complete</Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: profile?.profileComplete ? Colors.green : Colors.orange }}>
                {profile?.profileComplete ? '✓ Yes' : '✗ No'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Onboarding</Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: profile?.onboardingDone ? Colors.green : Colors.orange }}>
                {profile?.onboardingDone ? '✓ Done' : '✗ Pending'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Member since</Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{ borderWidth: 1, borderColor: `${Colors.accentRed}40`, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 }}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.accentRed }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
          Cobrex Artist Management OS
        </Text>

      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
