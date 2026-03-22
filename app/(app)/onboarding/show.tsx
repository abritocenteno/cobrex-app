import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';
import DatePickerField from '../../../src/components/DatePickerField';

export default function OnboardingShow() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const createShow = useMutation(api.shows.create);

  const [name, setName] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!profile?.artistId || !name.trim() || !showDate) return;
    setLoading(true);
    try {
      await createShow({
        artistId: profile.artistId,
        name: name.trim(),
        showDate,
        showTime: showTime || undefined,
      });
      router.push('/(app)/onboarding/asset');
    } catch (e: any) {
      setError(e.message ?? 'Failed to create show');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 16 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={4} totalSteps={5} title="First Show" subtitle="Got a show coming up? Add it now to get started." onSkip={() => router.push('/(app)/onboarding/asset')} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>

        <Text style={labelStyle}>Show Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Paradiso Amsterdam" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <DatePickerField label="Date" value={showDate} onChange={setShowDate} />

        <Text style={labelStyle}>Show Time</Text>
        <TextInput value={showTime} onChangeText={setShowTime} placeholder="21:00" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleAdd}
          disabled={loading || !name.trim() || !showDate}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12, opacity: (!name.trim() || !showDate) ? 0.5 : 1 }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Add Show & Continue →</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(app)/onboarding/asset')} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Skip this step</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
