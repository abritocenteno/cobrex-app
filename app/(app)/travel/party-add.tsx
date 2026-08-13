import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

export default function PartyAddScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const createParty = useMutation(api.travel.createTourParty);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const artistId = profile?.artistId;
    if (!artistId) {
      Alert.alert('Error', 'Artist profile not found');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Validation', 'Party name is required');
      return;
    }
    setSaving(true);
    try {
      const id = await createParty({
        artistId,
        name: name.trim(),
        notes: notes.trim() || undefined,
      });
      router.replace(`/(app)/travel/${id}` as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }}>New Tour Party</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}
        >
          {saving
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Create</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        <Field label="Party Name *">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. North America Tour 2026"
            placeholderTextColor={Colors.textMuted}
            style={inputStyle}
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            style={[inputStyle, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
          />
        </Field>

        <View style={{ backgroundColor: `${Colors.accent}12`, borderWidth: 1, borderColor: `${Colors.accent}30`, borderRadius: 12, padding: 14, marginTop: 8 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent }}>
            After creating the party, you'll be able to add travelers, upload documents, and track visas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  padding: 14,
  fontFamily: 'DMSans_400Regular' as const,
  fontSize: 14,
  color: Colors.textPrimary,
};
