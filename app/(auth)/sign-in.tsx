import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [pendingCode, setPendingCode] = useState(false);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
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
      setError(e.message ?? 'Apple sign in failed');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
      setError(e.message ?? 'Google sign in failed');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleRequestCode = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      // Step 1: create sign in with just the identifier
      const { supportedFirstFactors } = await signIn.create({ identifier: email });
      
      // Step 2: find email_code factor
      const emailFactor = supportedFirstFactors?.find(
        (f: any) => f.strategy === 'email_code'
      ) as any;
      
      if (!emailFactor) {
        setError('Email code sign-in is not enabled for this account.');
        return;
      }

      // Step 3: prepare the factor
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setPendingCode(true);
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)');
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? 'Invalid code');
    } finally {
      setLoading(false);
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}>
          <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 52, letterSpacing: 8, color: Colors.accent, textAlign: 'center', marginBottom: 6 }}>
            COBREX
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center', letterSpacing: 3, marginBottom: 40 }}>
            ARTIST MANAGEMENT OS
          </Text>

          {!pendingCode && (
            <View style={{ flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: 10, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border }}>
              <TouchableOpacity
                onPress={() => setMode('password')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'password' ? Colors.accent : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: mode === 'password' ? '#000' : Colors.textMuted }}>Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('code')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'code' ? Colors.accent : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: mode === 'code' ? '#000' : Colors.textMuted }}>Email Code</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
            editable={!pendingCode}
          />

          {mode === 'password' && !pendingCode && (
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              style={{ ...inputStyle, marginBottom: 24 }}
            />
          )}

          {mode === 'code' && !pendingCode && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 24, marginTop: 4 }}>
              We'll send a 6-digit code to your email.
            </Text>
          )}

          {pendingCode && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 12 }}>
                Code sent to {email}
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                style={{ ...inputStyle, marginBottom: 0, fontSize: 24, letterSpacing: 12, textAlign: 'center' }}
                maxLength={6}
                autoFocus
              />
            </View>
          )}

          {error ? (
            <Text style={{ color: Colors.accentRed, fontFamily: 'DMSans_400Regular', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={pendingCode ? handleVerifyCode : mode === 'password' ? handlePasswordSignIn : handleRequestCode}
            disabled={loading}
            style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 }}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>
                  {pendingCode ? 'Verify Code' : mode === 'password' ? 'Sign In' : 'Send Code'}
                </Text>
            }
          </TouchableOpacity>

          {pendingCode && (
            <TouchableOpacity onPress={() => { setPendingCode(false); setCode(''); setError(''); }} style={{ alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginHorizontal: 12 }}>or continue with</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
        </View>

        {/* Apple button */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          disabled={appleLoading}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, marginBottom: 12, gap: 10 }}
        >
          {appleLoading
            ? <ActivityIndicator color={Colors.textPrimary} size="small" />
            : <>
                <Text style={{ fontSize: 18 }}>🍎</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>Continue with Apple</Text>
              </>
          }
        </TouchableOpacity>

        {/* Google button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={oauthLoading}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, marginBottom: 16, gap: 10 }}
        >
          {oauthLoading
            ? <ActivityIndicator color={Colors.textPrimary} size="small" />
            : <>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>Continue with Google</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>
              Don't have an account?{'  '}
              <Text style={{ color: Colors.accent, fontFamily: 'DMSans_600SemiBold' }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
