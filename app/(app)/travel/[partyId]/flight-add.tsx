import { useMutation, useQuery } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

function parseLocalDatetime(str: string): number | null {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export default function FlightAddScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const tourPartyId = partyId as Id<'tourParties'>;

  const travelers = useQuery(api.travel.listTravelers, { tourPartyId });
  const addFlight = useMutation(api.travel.addFlight);

  const [travelerId, setTravelerId] = useState<Id<'travelers'> | null>(null);
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [arrivalAt, setArrivalAt] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [seat, setSeat] = useState('');
  const [terminal, setTerminal] = useState('');
  const [baggageAllowance, setBaggageAllowance] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costCurrency, setCostCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!travelerId) { Alert.alert('Validation', 'Select a passenger'); return; }
    if (!airline.trim()) { Alert.alert('Validation', 'Airline is required'); return; }
    if (!flightNumber.trim()) { Alert.alert('Validation', 'Flight number is required'); return; }
    if (!departureAirport.trim() || !arrivalAirport.trim()) { Alert.alert('Validation', 'Both airports are required'); return; }
    const depTs = parseLocalDatetime(departureAt);
    const arrTs = parseLocalDatetime(arrivalAt);
    if (!depTs) { Alert.alert('Validation', 'Enter a valid departure date/time (YYYY-MM-DD HH:MM)'); return; }
    if (!arrTs) { Alert.alert('Validation', 'Enter a valid arrival date/time (YYYY-MM-DD HH:MM)'); return; }
    if (arrTs <= depTs) { Alert.alert('Validation', 'Arrival must be after departure'); return; }

    setSaving(true);
    try {
      await addFlight({
        tourPartyId,
        travelerId,
        airline: airline.trim(),
        flightNumber: flightNumber.trim().toUpperCase(),
        departureAirport: departureAirport.trim().toUpperCase(),
        arrivalAirport: arrivalAirport.trim().toUpperCase(),
        departureAt: depTs,
        arrivalAt: arrTs,
        bookingRef: bookingRef.trim() || undefined,
        seat: seat.trim() || undefined,
        terminal: terminal.trim() || undefined,
        baggageAllowance: baggageAllowance.trim() || undefined,
        costAmount: costAmount.trim() ? parseFloat(costAmount) : undefined,
        costCurrency: costCurrency.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (travelers === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }}>Add Flight</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}>
          {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        <Field label="Passenger *">
          {travelers.length === 0 ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Add travelers to the party first.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {travelers.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  onPress={() => setTravelerId(t._id)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: travelerId === t._id ? Colors.accent : Colors.surface, borderWidth: 1, borderColor: travelerId === t._id ? Colors.accent : Colors.border }}
                >
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: travelerId === t._id ? '#000' : Colors.textMuted }}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Airline *">
              <TextInput value={airline} onChangeText={setAirline} placeholder="e.g. British Airways" placeholderTextColor={Colors.textMuted} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Flight # *">
              <TextInput value={flightNumber} onChangeText={setFlightNumber} placeholder="BA241" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" style={inputStyle} />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="From (IATA) *">
              <TextInput value={departureAirport} onChangeText={setDepartureAirport} placeholder="LHR" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" maxLength={4} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="To (IATA) *">
              <TextInput value={arrivalAirport} onChangeText={setArrivalAirport} placeholder="JFK" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" maxLength={4} style={inputStyle} />
            </Field>
          </View>
        </View>

        <Field label="Departure Date & Time * (YYYY-MM-DD HH:MM)">
          <TextInput value={departureAt} onChangeText={setDepartureAt} placeholder="2026-09-15 14:30" placeholderTextColor={Colors.textMuted} style={inputStyle} />
        </Field>

        <Field label="Arrival Date & Time * (YYYY-MM-DD HH:MM)">
          <TextInput value={arrivalAt} onChangeText={setArrivalAt} placeholder="2026-09-15 22:45" placeholderTextColor={Colors.textMuted} style={inputStyle} />
        </Field>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Booking Ref">
              <TextInput value={bookingRef} onChangeText={setBookingRef} placeholder="ABC123" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Seat">
              <TextInput value={seat} onChangeText={setSeat} placeholder="14A" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" style={inputStyle} />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Terminal">
              <TextInput value={terminal} onChangeText={setTerminal} placeholder="T5" placeholderTextColor={Colors.textMuted} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Baggage Allowance">
              <TextInput value={baggageAllowance} onChangeText={setBaggageAllowance} placeholder="23kg" placeholderTextColor={Colors.textMuted} style={inputStyle} />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}>
            <Field label="Ticket Cost">
              <TextInput value={costAmount} onChangeText={setCostAmount} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Currency">
              <TextInput value={costCurrency} onChangeText={setCostCurrency} placeholder="USD" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" maxLength={3} style={inputStyle} />
            </Field>
          </View>
        </View>
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
