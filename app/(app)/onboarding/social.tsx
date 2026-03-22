import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';

export default function OnboardingSocial() {
  const router = useRouter();
  const artist = useQuery(api.artists.list);
  const updateArtist = useMutation(api.artists.update);

  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  const artistData = artist?.[0];

  useEffect(() => {
    if (artistData) {
      setInstagram(artistData.instagramHandle ?? '');
      setSpotify(artistData.spotifyArtistId ?? '');
      setTiktok((artistData as any).tiktokHandle ?? '');
      setYoutube((artistData as any).youtubeHandle ?? '');
      setWebsite(artistData.websiteUrl ?? '');
    }
  }, [artistData]);

  const handleNext = async () => {
    if (!artistData?._id) return;
    setLoading(true);
    try {
      await updateArtist({
        id: artistData._id,
        instagramHandle: instagram || undefined,
        spotifyArtistId: spotify || undefined,
        tiktokHandle: tiktok || undefined,
        youtubeHandle: youtube || undefined,
        websiteUrl: website || undefined,
      });
      router.push('/(app)/onboarding/show');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 16 } as const;

  const SocialRow = ({ icon, placeholder, value, onChangeText }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        style={{ flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={3} totalSteps={5} title="Social Links" subtitle="Connect your profiles so fans and promoters can find you." onSkip={() => router.push('/(app)/onboarding/show')} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <SocialRow icon="📸" placeholder="@instagram_handle" value={instagram} onChangeText={setInstagram} />
        <SocialRow icon="🎧" placeholder="Spotify Artist ID" value={spotify} onChangeText={setSpotify} />
        <SocialRow icon="🎬" placeholder="@tiktok_handle" value={tiktok} onChangeText={setTiktok} />
        <SocialRow icon="▶️" placeholder="YouTube channel handle" value={youtube} onChangeText={setYoutube} />
        <SocialRow icon="🌐" placeholder="https://yourwebsite.com" value={website} onChangeText={setWebsite} />

        <TouchableOpacity
          onPress={handleNext}
          disabled={loading}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Next →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
