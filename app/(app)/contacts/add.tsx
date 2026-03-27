import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import ScreenContainer from '../../../src/components/ScreenContainer';
import Toast from '../../../src/components/Toast';
import { useToast } from '../../../src/hooks/useToast';

const CONTACT_TYPES = [
  { value: 'promoter', label: 'Promoter' },
  { value: 'booking_agent', label: 'Booking Agent' },
  { value: 'foh_engineer', label: 'FOH Engineer' },
  { value: 'monitor_engineer', label: 'Monitor Engineer' },
  { value: 'tour_manager', label: 'Tour Manager' },
  { value: 'lighting_designer', label: 'Lighting Designer' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'other', label: 'Other' },
];

export default function AddContact() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const createContact = useMutation(api.contacts.create);

  const [displayName, setDisplayName] = useState('');
  const [contactType, setContactType] = useState('promoter');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!profile?.artistId) return;
    if (!displayName.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await createContact({
        artistId: profile.artistId,
        displayName: displayName.trim(),
        contactType,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        city: city || undefined,
        country: country || undefined,
        notes: notes || undefined,
        rating: rating || undefined,
      });
      showToast('Contact added!');
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create contact');
      showToast(e.message ?? 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 4 };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, flex: 1 }}>New Contact</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading} style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
          {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        <Text style={labelStyle}>Name *</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Full name" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <Text style={labelStyle}>Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CONTACT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setContactType(t.value)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: contactType === t.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: contactType === t.value ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: contactType === t.value ? '#000' : Colors.textMuted }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={labelStyle}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={inputStyle} />

        <Text style={labelStyle}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+31 6 12345678" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" style={inputStyle} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Company</Text>
            <TextInput value={company} onChangeText={setCompany} placeholder="Company name" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>City</Text>
            <TextInput value={city} onChangeText={setCity} placeholder="Amsterdam" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
        </View>

        <Text style={labelStyle}>Country</Text>
        <TextInput value={country} onChangeText={setCountry} placeholder="Netherlands" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <Text style={labelStyle}>Rating</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star === rating ? 0 : star)}>
              <Text style={{ fontSize: 28, color: star <= rating ? Colors.orange : Colors.surface2 }}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={labelStyle}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Any notes..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }} />
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
