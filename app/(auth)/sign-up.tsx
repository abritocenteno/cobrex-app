import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
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
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setAppleLoading(true);
    try {
      const { createdSessionId, setActive } = await startAppleOAuthFlow({
        redirectUrl: Linking.createURL('/(app)', { scheme: 'cobrex' }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.message ?? 'Apple sign up failed');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setOauthLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(app)', { scheme: 'cobrex' }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign up failed');
    } finally {
      setOauthLoading(false);
    }
  };

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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32, maxWidth: 440, alignSelf: 'center', width: '100%' }}>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 56, letterSpacing: 8, color: Colors.accent, textAlign: 'center', marginBottom: 8 }}>
          COBREX
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', letterSpacing: 3, marginBottom: 48 }}>
          {pendingVerification ? 'CHECK YOUR EMAIL' : 'CREATE ACCOUNT'}
        </Text>
        {!pendingVerification ? (
          <>
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={inputStyle} />
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={Colors.textMuted} secureTextEntry style={{ ...inputStyle, marginBottom: 24 }} />
          </>
        ) : (
          <TextInput value={code} onChangeText={setCode} placeholder="Verification code" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={{ ...inputStyle, marginBottom: 24 }} />
        )}
        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}
        <TouchableOpacity onPress={pendingVerification ? handleVerify : handleSignUp} disabled={loading} style={{ backgroundColor: Colors.accent, borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>{pendingVerification ? 'Verify Email' : 'Create Account'}</Text>}
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
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, marginBottom: 16, gap: 10 }}
        >
          {oauthLoading
            ? <ActivityIndicator color={Colors.textPrimary} size="small" />
            : <>
                <GoogleLogo size={20} />
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>Continue with Google</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>
            Already have an account? <Text style={{ color: Colors.accent }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
