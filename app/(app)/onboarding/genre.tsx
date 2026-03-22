import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';

const GENRES = ['Electronic', 'Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'R&B', 'Folk', 'Metal', 'Reggae', 'Country', 'Latin', 'Afrobeat', 'Punk', 'Soul', 'Indie', 'Dance', 'Ambient', 'World', 'Other'];
const SUBGENRES: Record<string, string[]> = {
  Electronic: ['House', 'Techno', 'Drum & Bass', 'Trance', 'Ambient', 'Dubstep', 'EDM', 'Lo-fi'],
  'Hip-Hop': ['Trap', 'Boom Bap', 'Conscious', 'Drill', 'Cloud Rap'],
  Pop: ['Synth Pop', 'Indie Pop', 'K-Pop', 'Dream Pop', 'Art Pop'],
  Rock: ['Alternative', 'Garage', 'Psychedelic', 'Post-Rock', 'Grunge'],
  Jazz: ['Fusion', 'Bebop', 'Nu-Jazz', 'Smooth Jazz', 'Free Jazz'],
};

export default function OnboardingGenre() {
  const router = useRouter();
  const artist = useQuery(api.artists.list);
  const updateArtist = useMutation(api.artists.update);

  const [genre, setGenre] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [loading, setLoading] = useState(false);

  const artistData = artist?.[0];

  useEffect(() => {
    if (artistData) {
      setGenre(artistData.genre ?? '');
      setSubGenre(artistData.subGenre ?? '');
    }
  }, [artistData]);

  const handleNext = async () => {
    if (!artistData?._id) return;
    setLoading(true);
    try {
      await updateArtist({
        id: artistData._id,
        genre: genre || undefined,
        subGenre: subGenre || undefined,
      });
      router.push('/(app)/onboarding/social');
    } finally {
      setLoading(false);
    }
  };

  const availableSubGenres = SUBGENRES[genre] ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={2} totalSteps={5} title="Genre & Style" subtitle="Help venues and promoters find you more easily." onSkip={() => router.push('/(app)/onboarding/social')} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>

        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>Main Genre</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {GENRES.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => { setGenre(g); setSubGenre(''); }}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: genre === g ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: genre === g ? Colors.accent : Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: genre === g ? '#000' : Colors.textMuted }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {availableSubGenres.length > 0 && (
          <>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>Subgenre</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {availableSubGenres.map((sg) => (
                <TouchableOpacity
                  key={sg}
                  onPress={() => setSubGenre(sg === subGenre ? '' : sg)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: subGenre === sg ? `${Colors.accentBlue}30` : Colors.surface2, borderWidth: 1, borderColor: subGenre === sg ? Colors.accentBlue : Colors.border }}
                >
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: subGenre === sg ? Colors.accentBlue : Colors.textMuted }}>{sg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={handleNext}
          disabled={loading}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Next →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
