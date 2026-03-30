import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';

export default function OnboardingVenue() {
  const router = useRouter();
  const venueProfile = useQuery(api.venue.myProfile);
  const updateVenue = useMutation(api.venue.update);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const dismissOnboarding = useMutation(api.users.dismissOnboarding);

  const [venueName, setVenueName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venueProfile) {
      setVenueName(venueProfile.name ?? '');
      setCapacity(venueProfile.capacity != null ? String(venueProfile.capacity) : '');
      setLocation(venueProfile.location ?? '');
    }
  }, [venueProfile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (venueProfile?._id) {
        await updateVenue({
          id: venueProfile._id,
          name: venueName.trim() || undefined,
          capacity: capacity ? parseInt(capacity, 10) : undefined,
          location: location.trim() || undefined,
        });
      }
      await completeOnboarding();
      router.replace('/(app)/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await dismissOnboarding();
    router.replace('/(app)/dashboard');
  };

  const inputStyle = {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginBottom: 16,
  } as const;

  const labelStyle = {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  };

  const optional = <Text style={{ color: Colors.textMuted, fontFamily: 'DMSans_400Regular', textTransform: 'none', letterSpacing: 0 }}>(optional)</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ padding: 32, maxWidth: 560, width: '100%', alignSelf: 'center', paddingTop: 64 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 40, color: Colors.accent, letterSpacing: 4, marginBottom: 8 }}>COBREX</Text>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 8 }}>Set up your venue</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 36 }}>
          A couple of details to get you started. You can fill in the rest later.
        </Text>

        <Text style={labelStyle}>Venue Name</Text>
        <TextInput
          value={venueName}
          onChangeText={setVenueName}
          placeholder="e.g. The Paradiso"
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Capacity {optional}</Text>
            <TextInput
              value={capacity}
              onChangeText={(v) => setCapacity(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 1200"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={inputStyle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>City {optional}</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Amsterdam"
              placeholderTextColor={Colors.textMuted}
              style={inputStyle}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Save & Continue →</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
