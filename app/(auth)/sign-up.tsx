import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../../src/constants/colors';

const ROLES = [
  { id: 'artist', label: 'Artist', description: 'Manage your shows, deals, and career', emoji: '🎤' },
  { id: 'manager', label: 'Manager', description: 'Manage your roster and bookings', emoji: '🎯' },
  { id: 'venue', label: 'Venue', description: 'Manage your venue and events', emoji: '🏛️' },
];

const NAME_CONFIG: Record<string, { label: string; placeholder: string }> = {
  artist:  { label: 'Artist Name',  placeholder: 'Your artist or stage name' },
  manager: { label: 'Full Name',    placeholder: 'Your full name' },
  venue:   { label: 'Venue Name',   placeholder: 'Your venue or company name' },
};

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const inputStyle = {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginBottom: 12,
  } as const;

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep(2);
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace({
          pathname: '/(app)/role-selection',
          params: { role, displayName: name },
        });
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setOauthLoading(true);
    try {
      const { createdSessionId, setActive: sa } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(app)', { scheme: 'cobrex' }),
      });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign up failed');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setAppleLoading(true);
    try {
      const { createdSessionId, setActive: sa } = await startAppleOAuthFlow({
        redirectUrl: Linking.createURL('/(app)', { scheme: 'cobrex' }),
      });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.message ?? 'Apple sign up failed');
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32, maxWidth: 440, alignSelf: 'center', width: '100%' }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 56, letterSpacing: 8, color: Colors.accent, textAlign: 'center', marginBottom: 8 }}>
          COBREX
        </Text>

        {/* ── Step 0: Role picker ── */}
        {step === 0 && (
          <>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', letterSpacing: 3, marginBottom: 32 }}>
              I AM A...
            </Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => { setRole(r.id); setError(''); }}
                style={{
                  backgroundColor: role === r.id ? Colors.surface2 : Colors.surface,
                  borderWidth: 1,
                  borderColor: role === r.id ? Colors.accent : Colors.border,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28, marginRight: 14 }}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 }}>{r.label}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{r.description}</Text>
                </View>
                {role === r.id && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#000', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginTop: 4, marginBottom: 8, textAlign: 'center' }}>{error}</Text> : null}

            <TouchableOpacity
              onPress={() => { if (!role) { setError('Please select a role to continue'); return; } setError(''); setStep(1); }}
              style={{ backgroundColor: role ? Colors.accent : Colors.surface2, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, opacity: role ? 1 : 0.5 }}
            >
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: role ? '#000' : Colors.textMuted }}>Continue →</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginHorizontal: 12 }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignUp}
              disabled={oauthLoading}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, marginBottom: 12, gap: 10 }}
            >
              {oauthLoading
                ? <ActivityIndicator color={Colors.textPrimary} size="small" />
                : <><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4285F4' }}>G</Text><Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>Continue with Google</Text></>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>
                Already have an account? <Text style={{ color: Colors.accent }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 1: Name + Email + Password ── */}
        {step === 1 && (
          <>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', letterSpacing: 3, marginBottom: 32 }}>
              CREATE ACCOUNT
            </Text>

            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              {NAME_CONFIG[role]?.label ?? 'Name'}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={NAME_CONFIG[role]?.placeholder ?? 'Your name'}
              placeholderTextColor={Colors.textMuted}
              style={inputStyle}
            />

            <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={inputStyle} />
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={Colors.textMuted} secureTextEntry style={{ ...inputStyle, marginBottom: 24 }} />

            {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

            <TouchableOpacity onPress={handleSignUp} disabled={loading} style={{ backgroundColor: Colors.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setError(''); setStep(0); }} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 2: Email verification ── */}
        {step === 2 && (
          <>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', letterSpacing: 3, marginBottom: 32 }}>
              CHECK YOUR EMAIL
            </Text>

            <TextInput value={code} onChangeText={setCode} placeholder="Verification code" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={{ ...inputStyle, marginBottom: 24 }} />

            {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

            <TouchableOpacity onPress={handleVerify} disabled={loading} style={{ backgroundColor: Colors.accent, borderRadius: 12, padding: 16, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Verify Email</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
