import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';

export default function OnboardingGenre() {
  const router = useRouter();
  const artist = useQuery(api.artists.list);
  const approvedGenres = useQuery(api.genres.listApproved);
  const updateArtist = useMutation(api.artists.update);
  const submitGenre = useMutation(api.genres.submit);

  const [selected, setSelected] = useState<string[]>([]);
  const [subGenre, setSubGenre] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const artistData = artist?.[0];

  useEffect(() => {
    if (artistData) {
      setSelected(artistData.genre ? artistData.genre.split(',').filter(Boolean) : []);
      setSubGenre(artistData.subGenre ?? '');
    }
  }, [artistData]);

  const toggleGenre = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  const handleSuggest = async () => {
    const name = suggestion.trim();
    if (!name || name.length < 2) return;
    setSubmitting(true);
    try {
      await submitGenre({ name });
      setSubmitted((prev) => [...prev, name]);
      setSuggestion('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!artistData?._id) return;
    setLoading(true);
    try {
      await updateArtist({
        id: artistData._id,
        genre: selected.join(',') || undefined,
        subGenre: subGenre.trim() || undefined,
      });
      router.push('/(app)/onboarding/social');
    } finally {
      setLoading(false);
    }
  };

  const genreList = approvedGenres ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={2} totalSteps={5} title="Genre & Style" subtitle="Help venues and promoters find you more easily." onSkip={() => router.push('/(app)/onboarding/social')} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>

        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>Main Genre</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 14 }}>Select all that apply</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {genreList.map((g) => {
            const active = selected.includes(g.name);
            return (
              <TouchableOpacity
                key={g.name}
                onPress={() => toggleGenre(g.name)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? Colors.accent : Colors.surface2,
                  borderWidth: 1, borderColor: active ? Colors.accent : Colors.border,
                }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: active ? '#000' : Colors.textMuted }}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {submitted.map((name) => (
            <View
              key={`pending-${name}`}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              <FontAwesome name="clock-o" size={11} color={Colors.textMuted} />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Suggest a genre */}
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary, marginBottom: 6 }}>
          Don't see your genre?
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <TextInput
            value={suggestion}
            onChangeText={setSuggestion}
            placeholder="Suggest a new genre..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
          />
          <TouchableOpacity
            onPress={handleSuggest}
            disabled={submitting || !suggestion.trim()}
            style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center', opacity: suggestion.trim() ? 1 : 0.4 }}
          >
            {submitting ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.accent }}>Submit</Text>}
          </TouchableOpacity>
        </View>
        {submitted.length > 0 && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 16 }}>
            <FontAwesome name="check-circle" size={12} color={Colors.textMuted} /> Suggestion submitted — it will appear once approved by our team.
          </Text>
        )}

        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 6 }}>Subgenre / Style</Text>
        <TextInput
          value={subGenre}
          onChangeText={setSubGenre}
          placeholder="e.g. House, Trap, Indie rock..."
          placeholderTextColor={Colors.textMuted}
          style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 20 }}
        />

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
