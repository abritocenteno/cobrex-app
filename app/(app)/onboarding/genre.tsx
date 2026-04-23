import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';
import DropdownSelect from '../../../src/components/DropdownSelect';

const GENRE_OPTIONS = [
  { value: 'Electronic', label: 'Electronic' },
  { value: 'Hip-Hop', label: 'Hip-Hop' },
  { value: 'Pop', label: 'Pop' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Jazz', label: 'Jazz' },
  { value: 'Classical', label: 'Classical' },
  { value: 'R&B', label: 'R&B' },
  { value: 'Folk', label: 'Folk' },
  { value: 'Metal', label: 'Metal' },
  { value: 'Reggae', label: 'Reggae' },
  { value: 'Country', label: 'Country' },
  { value: 'Latin', label: 'Latin' },
  { value: 'Afrobeat', label: 'Afrobeat' },
  { value: 'Punk', label: 'Punk' },
  { value: 'Soul', label: 'Soul' },
  { value: 'Indie', label: 'Indie' },
  { value: 'Dance', label: 'Dance' },
  { value: 'Ambient', label: 'Ambient' },
  { value: 'World', label: 'World' },
  { value: 'Other', label: 'Other' },
];

const SUBGENRE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  Electronic: [
    { value: 'House', label: 'House' },
    { value: 'Techno', label: 'Techno' },
    { value: 'Drum & Bass', label: 'Drum & Bass' },
    { value: 'Trance', label: 'Trance' },
    { value: 'Ambient', label: 'Ambient' },
    { value: 'Dubstep', label: 'Dubstep' },
    { value: 'EDM', label: 'EDM' },
    { value: 'Lo-fi', label: 'Lo-fi' },
  ],
  'Hip-Hop': [
    { value: 'Trap', label: 'Trap' },
    { value: 'Boom Bap', label: 'Boom Bap' },
    { value: 'Conscious', label: 'Conscious' },
    { value: 'Drill', label: 'Drill' },
    { value: 'Cloud Rap', label: 'Cloud Rap' },
  ],
  Pop: [
    { value: 'Synth Pop', label: 'Synth Pop' },
    { value: 'Indie Pop', label: 'Indie Pop' },
    { value: 'K-Pop', label: 'K-Pop' },
    { value: 'Dream Pop', label: 'Dream Pop' },
    { value: 'Art Pop', label: 'Art Pop' },
  ],
  Rock: [
    { value: 'Alternative', label: 'Alternative' },
    { value: 'Garage', label: 'Garage' },
    { value: 'Psychedelic', label: 'Psychedelic' },
    { value: 'Post-Rock', label: 'Post-Rock' },
    { value: 'Grunge', label: 'Grunge' },
  ],
  Jazz: [
    { value: 'Fusion', label: 'Fusion' },
    { value: 'Bebop', label: 'Bebop' },
    { value: 'Nu-Jazz', label: 'Nu-Jazz' },
    { value: 'Smooth Jazz', label: 'Smooth Jazz' },
    { value: 'Free Jazz', label: 'Free Jazz' },
  ],
};

export default function OnboardingGenre() {
  const router = useRouter();
  const artist = useQuery(api.artists.list);
  const updateArtist = useMutation(api.artists.update);

  const [genres, setGenres] = useState<string[]>([]);
  const [subGenres, setSubGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const artistData = artist?.[0];

  useEffect(() => {
    if (artistData) {
      setGenres(artistData.genre ? artistData.genre.split(',').filter(Boolean) : []);
      setSubGenres(artistData.subGenre ? artistData.subGenre.split(',').filter(Boolean) : []);
    }
  }, [artistData]);

  // Collect available subgenres from all selected genres
  const availableSubgenres = genres.flatMap((g) => SUBGENRE_OPTIONS[g] ?? []);
  const uniqueSubgenres = availableSubgenres.filter(
    (opt, idx, arr) => arr.findIndex((o) => o.value === opt.value) === idx
  );

  const handleNext = async () => {
    if (!artistData?._id) return;
    setLoading(true);
    try {
      await updateArtist({
        id: artistData._id,
        genre: genres.join(',') || undefined,
        subGenre: subGenres.join(',') || undefined,
      });
      router.push('/(app)/onboarding/social');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={2} totalSteps={5} title="Genre & Style" subtitle="Help venues and promoters find you more easily." onSkip={() => router.push('/(app)/onboarding/social')} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>

        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 8 }}>Main Genre</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>Select all that apply</Text>
        <DropdownSelect
          options={GENRE_OPTIONS}
          value={genres}
          onChange={(v) => { setGenres(v); setSubGenres([]); }}
          placeholder="Select genres..."
          multi
        />

        {uniqueSubgenres.length > 0 && (
          <>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 8, marginTop: 8 }}>Subgenre / Style</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>Select all that apply</Text>
            <DropdownSelect
              options={uniqueSubgenres}
              value={subGenres}
              onChange={setSubGenres}
              placeholder="Select subgenres..."
              multi
            />
          </>
        )}

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
