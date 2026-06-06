import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

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

export default function VenueSettingsScreen() {
  const router = useRouter();
  const venueProfile = useQuery(api.venue.myProfile);
  const updateVenue = useMutation(api.venue.update);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venueProfile) {
      setName(venueProfile.name ?? '');
      setCapacity(venueProfile.capacity != null ? String(venueProfile.capacity) : '');
      setCity(venueProfile.city ?? venueProfile.location ?? '');
      setCountry(venueProfile.country ?? '');
      setAddress(venueProfile.address ?? '');
      setPhone(venueProfile.phone ?? '');
      setEmail(venueProfile.email ?? '');
      setDescription(venueProfile.description ?? '');
    }
  }, [venueProfile]);

  const handleSave = async () => {
    if (!venueProfile?._id) return;
    const cap = capacity.trim() ? parseInt(capacity, 10) : undefined;
    if (cap !== undefined && (isNaN(cap) || cap < 1)) {
      Alert.alert('Invalid capacity', 'Capacity must be a positive number');
      return;
    }
    setLoading(true);
    try {
      await updateVenue({
        id: venueProfile._id,
        name: name.trim() || undefined,
        capacity: cap,
        city: city.trim() || undefined,
        location: city.trim() || undefined,
        country: country.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        description: description.trim() || undefined,
      });
      Alert.alert('Saved', 'Venue profile updated');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (venueProfile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 16 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>
          Venue Settings
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
          Update your venue details
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={labelStyle}>Venue Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. The Paradiso"
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Capacity</Text>
            <TextInput
              value={capacity}
              onChangeText={(v) => setCapacity(v.replace(/[^0-9]/g, ''))}
              placeholder="1200"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={inputStyle}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Amsterdam"
              placeholderTextColor={Colors.textMuted}
              style={inputStyle}
            />
          </View>
        </View>

        <Text style={labelStyle}>Country</Text>
        <TextInput
          value={country}
          onChangeText={setCountry}
          placeholder="Netherlands"
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
        />

        <Text style={labelStyle}>Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Weteringschans 6-8, 1017 SG"
          placeholderTextColor={Colors.textMuted}
          style={inputStyle}
        />

        <Text style={labelStyle}>Contact Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="booking@venue.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />

        <Text style={labelStyle}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+31 20 000 0000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          style={inputStyle}
        />

        <Text style={labelStyle}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Tell artists about your venue..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }}
        />

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
