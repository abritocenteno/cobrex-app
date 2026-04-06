import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';

export default function OnboardingWelcome() {
  const router = useRouter();
  const dismissOnboarding = useMutation(api.users.dismissOnboarding);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32, width: '100%', maxWidth: 560, alignSelf: 'center' }}
        style={{ width: '100%' }}
      >
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 52, letterSpacing: 8, color: Colors.accent, marginBottom: 8, textAlign: 'center' }}>
          COBREX
        </Text>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 26, color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>
          Welcome to your Artist OS
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
          Let's set up your artist profile in just a few steps. You can always skip and come back later.
        </Text>

        {/* Steps preview */}
        <View style={{ marginBottom: 40 }}>
          {[
            { icon: 'user' as const, label: 'Artist Profile', desc: 'Name, bio & location' },
            { icon: 'music' as const, label: 'Genre & Style', desc: 'Help people find you' },
            { icon: 'link' as const, label: 'Social Links', desc: 'Spotify, Instagram & more' },
            { icon: 'microphone' as const, label: 'First Show', desc: 'Add an upcoming show' },
            { icon: 'folder' as const, label: 'First Asset', desc: 'Upload a tech rider' },
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <FontAwesome name={step.icon} size={20} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{step.label}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{step.desc}</Text>
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, backgroundColor: Colors.surface2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>Optional</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/onboarding/profile')}
          style={{ backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14 }}
        >
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#000' }}>Let's get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => { await dismissOnboarding(); router.replace('/(app)/dashboard'); }}
          style={{ alignItems: 'center', paddingVertical: 10 }}
        >
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
