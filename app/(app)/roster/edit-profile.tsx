import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

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

export default function EditManagerProfileScreen() {
  const router = useRouter();
  const managerProfile = useQuery(api.manager.myProfile);
  const updateManager = useMutation(api.manager.update);

  const [agencyName, setAgencyName] = useState('');
  const [territory, setTerritory] = useState('');
  const [bio, setBio] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (managerProfile) {
      setAgencyName(managerProfile.companyName ?? '');
      setTerritory(managerProfile.territory ?? '');
      setBio(managerProfile.bio ?? '');
      setCommissionRate(managerProfile.commissionRate != null ? String(managerProfile.commissionRate) : '');
      setPhone(managerProfile.phone ?? '');
      setEmail(managerProfile.email ?? '');
    }
  }, [managerProfile]);

  const handleSave = async () => {
    if (!managerProfile?._id) return;
    const rate = commissionRate.trim() ? parseFloat(commissionRate) : undefined;
    if (rate !== undefined && (isNaN(rate) || rate < 0 || rate > 100)) {
      setError('Commission rate must be a number between 0 and 100');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateManager({
        id: managerProfile._id,
        agencyName: agencyName.trim() || undefined,
        territory: territory.trim() || undefined,
        bio: bio.trim() || undefined,
        commissionRate: rate,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (managerProfile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Edit Profile</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>Update your agency details</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={labelStyle}>Agency / Company Name</Text>
        <TextInput
          value={agencyName}
          onChangeText={setAgencyName}
          placeholder="e.g. Riverside Artists"
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
        />

        <Text style={labelStyle}>Territory</Text>
        <TextInput
          value={territory}
          onChangeText={setTerritory}
          placeholder="e.g. Europe, North America"
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
        />

        <Text style={labelStyle}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell artists a bit about you and your agency..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }}
        />

        <Text style={labelStyle}>Commission Rate (%)</Text>
        <TextInput
          value={commissionRate}
          onChangeText={setCommissionRate}
          placeholder="e.g. 15"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          style={inputStyle}
        />

        <Text style={labelStyle}>Contact Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="booking@agency.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />

        <Text style={labelStyle}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 000 0000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          style={inputStyle}
        />

        {error ? (
          <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
