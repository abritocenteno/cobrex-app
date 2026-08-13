import { useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

function parseLocalDate(str: string): number | null {
  const d = new Date(str + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d.getTime();
}

export default function HotelAddScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const tourPartyId = partyId as Id<'tourParties'>;

  const addHotel = useMutation(api.travel.addHotelBooking);

  const [hotelName, setHotelName] = useState('');
  const [address, setAddress] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [reservationNumber, setReservationNumber] = useState('');
  const [hotelPhone, setHotelPhone] = useState('');
  const [paymentResponsibility, setPaymentResponsibility] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!hotelName.trim()) { Alert.alert('Validation', 'Hotel name is required'); return; }
    const checkIn = parseLocalDate(checkInDate);
    const checkOut = parseLocalDate(checkOutDate);
    if (!checkIn) { Alert.alert('Validation', 'Enter a valid check-in date (YYYY-MM-DD)'); return; }
    if (!checkOut) { Alert.alert('Validation', 'Enter a valid check-out date (YYYY-MM-DD)'); return; }
    if (checkOut <= checkIn) { Alert.alert('Validation', 'Check-out must be after check-in'); return; }

    setSaving(true);
    try {
      await addHotel({
        tourPartyId,
        hotelName: hotelName.trim(),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        address: address.trim() || undefined,
        reservationNumber: reservationNumber.trim() || undefined,
        hotelPhone: hotelPhone.trim() || undefined,
        paymentResponsibility: paymentResponsibility.trim() || undefined,
        notes: notes.trim() || undefined,
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
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }}>Add Hotel</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}>
          {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        <Field label="Hotel Name *">
          <TextInput value={hotelName} onChangeText={setHotelName} placeholder="The Langham, London" placeholderTextColor={Colors.textMuted} style={inputStyle} />
        </Field>

        <Field label="Address">
          <TextInput value={address} onChangeText={setAddress} placeholder="1c Portland Place, London W1B 1JA" placeholderTextColor={Colors.textMuted} style={inputStyle} />
        </Field>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Check-in * (YYYY-MM-DD)">
              <TextInput value={checkInDate} onChangeText={setCheckInDate} placeholder="2026-09-14" placeholderTextColor={Colors.textMuted} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Check-out * (YYYY-MM-DD)">
              <TextInput value={checkOutDate} onChangeText={setCheckOutDate} placeholder="2026-09-16" placeholderTextColor={Colors.textMuted} style={inputStyle} />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Reservation #">
              <TextInput value={reservationNumber} onChangeText={setReservationNumber} placeholder="123456789" placeholderTextColor={Colors.textMuted} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Hotel Phone">
              <TextInput value={hotelPhone} onChangeText={setHotelPhone} placeholder="+44 20 7636 1000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" style={inputStyle} />
            </Field>
          </View>
        </View>

        <Field label="Payment Responsibility">
          <TextInput value={paymentResponsibility} onChangeText={setPaymentResponsibility} placeholder="e.g. Promoter / Artist / Split" placeholderTextColor={Colors.textMuted} style={inputStyle} />
        </Field>

        <Field label="Notes">
          <TextInput value={notes} onChangeText={setNotes} placeholder="Any special requirements..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} style={[inputStyle, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]} />
        </Field>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>{label}</Text>
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
