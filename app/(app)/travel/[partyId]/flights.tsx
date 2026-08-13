import { useQuery, useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

const FLIGHT_STATUS_META: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: Colors.textMuted },
  reserved: { label: 'Reserved', color: Colors.orange },
  booked: { label: 'Booked', color: Colors.accent },
  checked_in: { label: 'Checked In', color: Colors.green },
  boarded: { label: 'Boarded', color: Colors.green },
  delayed: { label: 'Delayed', color: Colors.orange },
  cancelled: { label: 'Cancelled', color: Colors.accentRed },
  arrived: { label: 'Arrived', color: Colors.green },
  rebooked: { label: 'Rebooked', color: Colors.orange },
};

const FLIGHT_STATUSES = Object.keys(FLIGHT_STATUS_META);

function fmt(ts: number) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function FlightCard({ flight, traveler, onRemove, onStatusCycle }: { flight: any; traveler: any; onRemove: () => void; onStatusCycle: () => void }) {
  const meta = FLIGHT_STATUS_META[flight.status] ?? { label: flight.status, color: Colors.textMuted };
  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary }}>
            {flight.departureAirport} → {flight.arrivalAirport}
          </Text>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted, marginTop: 1 }}>
            {flight.airline} {flight.flightNumber}
            {flight.bookingRef ? ` · ${flight.bookingRef}` : ''}
          </Text>
          {traveler && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              Passenger: {traveler.name}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
          <TouchableOpacity onPress={onStatusCycle}>
            <View style={{ backgroundColor: `${meta.color}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${meta.color}40` }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: meta.color }}>{meta.label}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
            <FontAwesome name="trash-o" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>DEPARTS</Text>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textPrimary }}>{fmt(flight.departureAt)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>ARRIVES</Text>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textPrimary }}>{fmt(flight.arrivalAt)}</Text>
        </View>
      </View>

      {flight.seat && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 8 }}>
          Seat {flight.seat}{flight.terminal ? ` · Terminal ${flight.terminal}` : ''}
        </Text>
      )}
    </View>
  );
}

export default function FlightsScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const party = useQuery(api.travel.getTourParty, { id });
  const flights = useQuery(api.travel.listFlights, { tourPartyId: id });
  const travelers = useQuery(api.travel.listTravelers, { tourPartyId: id });
  const updateFlight = useMutation(api.travel.updateFlight).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listFlights, { tourPartyId: id });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listFlights,
        { tourPartyId: id },
        current.map((f) => (f._id === args.id ? { ...f, ...args } : f))
      );
    }
  );
  const removeFlight = useMutation(api.travel.removeFlight).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listFlights, { tourPartyId: id });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listFlights,
        { tourPartyId: id },
        current.filter((f) => f._id !== args.id)
      );
    }
  );

  const travelerMap = Object.fromEntries((travelers ?? []).map((t) => [t._id, t]));

  const handleStatusCycle = (flightId: Id<'flightBookings'>, current: string) => {
    const idx = FLIGHT_STATUSES.indexOf(current);
    const next = FLIGHT_STATUSES[(idx + 1) % FLIGHT_STATUSES.length];
    const nextMeta = FLIGHT_STATUS_META[next];
    Alert.alert('Update Status', `Mark as "${nextMeta.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => updateFlight({ id: flightId, status: next }) },
    ]);
  };

  const handleRemove = (flightId: Id<'flightBookings'>, label: string) => {
    Alert.alert('Remove Flight', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFlight({ id: flightId }) },
    ]);
  };

  const sorted = [...(flights ?? [])].sort((a, b) => a.departureAt - b.departureAt);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Flights</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{party?.name ?? ''}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/travel/${partyId}/flight-add` as any)}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {flights === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : sorted.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="plane" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 6 }}>No flights yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Add flight bookings for each traveler in this party.</Text>
          </View>
        ) : (
          sorted.map((f) => (
            <FlightCard
              key={f._id}
              flight={f}
              traveler={travelerMap[f.travelerId]}
              onRemove={() => handleRemove(f._id, `${f.airline} ${f.flightNumber}`)}
              onStatusCycle={() => handleStatusCycle(f._id, f.status)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
