import { useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

const ROLES = [
  { value: 'artist', label: 'Artist' },
  { value: 'band_member', label: 'Band Member' },
  { value: 'crew', label: 'Crew' },
  { value: 'manager', label: 'Manager' },
  { value: 'tour_manager', label: 'Tour Manager' },
  { value: 'other', label: 'Other' },
];

export default function TravelerAddScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const tourPartyId = partyId as Id<'tourParties'>;

  const addTraveler = useMutation(api.travel.addTraveler);

  const [name, setName] = useState('');
  const [role, setRole] = useState('band_member');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      await addTraveler({
        tourPartyId,
        role,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }}>Add Traveler</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}
        >
          {saving
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Add</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        <Field label="Full Name *">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={Colors.textMuted}
            style={inputStyle}
          />
        </Field>

        <Field label="Role">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRole(r.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: role === r.value ? Colors.accent : Colors.surface,
                  borderWidth: 1,
                  borderColor: role === r.value ? Colors.accent : Colors.border,
                }}
              >
                <Text style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 13,
                  color: role === r.value ? '#000' : Colors.textMuted,
                }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Email">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={inputStyle}
          />
        </Field>

        <Field label="Phone">
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            style={inputStyle}
          />
        </Field>

        <Field label="Emergency Contact">
          <TextInput
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Name & phone number"
            placeholderTextColor={Colors.textMuted}
            style={inputStyle}
          />
        </Field>
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
