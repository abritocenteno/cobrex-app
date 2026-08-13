import { useQuery, useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function nightCount(checkIn: number, checkOut: number) {
  return Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
}

const ROOM_TYPE_OPTIONS = ['Single', 'Double', 'Twin', 'Suite', 'King'];

function RoomingList({ hotelId, travelers, artistId }: { hotelId: Id<'hotelBookings'>; travelers: any[]; artistId: Id<'artists'> }) {
  const rooms = useQuery(api.travel.listRoomAssignments, { hotelBookingId: hotelId });
  const assignRoom = useMutation(api.travel.assignRoom).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listRoomAssignments, { hotelBookingId: hotelId });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listRoomAssignments,
        { hotelBookingId: hotelId },
        [
          ...current,
          {
            _id: `temp_${Date.now()}` as any,
            _creationTime: Date.now(),
            hotelBookingId: args.hotelBookingId,
            travelerId: args.travelerId,
            artistId,
          },
        ]
      );
    }
  );
  const removeRoom = useMutation(api.travel.removeRoomAssignment).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listRoomAssignments, { hotelBookingId: hotelId });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listRoomAssignments,
        { hotelBookingId: hotelId },
        current.filter((r) => r._id !== args.id)
      );
    }
  );
  const [assigning, setAssigning] = useState<Id<'travelers'> | null>(null);

  const assignedIds = new Set((rooms ?? []).map((r) => String(r.travelerId)));

  const handleAssign = async (travelerId: Id<'travelers'>) => {
    setAssigning(travelerId);
    try {
      await assignRoom({ hotelBookingId: hotelId, travelerId });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = (roomId: Id<'roomAssignments'>, name: string) => {
    Alert.alert('Remove Assignment', `Remove ${name}'s room?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeRoom({ id: roomId }) },
    ]);
  };

  if (rooms === undefined) return <ActivityIndicator size="small" color={Colors.accent} style={{ margin: 12 }} />;

  const assignedRooms = rooms.map((r) => ({
    ...r,
    traveler: travelers.find((t) => String(t._id) === String(r.travelerId)),
  }));

  const unassigned = travelers.filter((t) => !assignedIds.has(String(t._id)));

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
        Rooming List ({assignedRooms.length}/{travelers.length})
      </Text>

      {assignedRooms.map((r) => (
        <View key={r._id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${Colors.green}20`, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.green }}>
              {r.traveler?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary }}>{r.traveler?.name ?? 'Unknown'}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>
              {r.roomType ?? 'Room type TBD'}
              {r.roomNumber ? ` · #${r.roomNumber}` : ''}
              {r.breakfastIncluded ? ' · Breakfast incl.' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleRemove(r._id, r.traveler?.name ?? 'traveler')} style={{ padding: 6 }}>
            <FontAwesome name="times" size={13} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}

      {unassigned.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.textMuted, marginBottom: 6 }}>Unassigned:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {unassigned.map((t) => (
              <TouchableOpacity
                key={t._id}
                onPress={() => handleAssign(t._id)}
                disabled={assigning === t._id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              >
                {assigning === t._id
                  ? <ActivityIndicator size="small" color={Colors.accent} style={{ width: 12, height: 12 }} />
                  : <FontAwesome name="plus" size={10} color={Colors.accent} />}
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textPrimary }}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function HotelCard({ hotel, travelers, onRemove }: { hotel: any; travelers: any[]; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const nights = nightCount(hotel.checkInDate, hotel.checkOutDate);

  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <FontAwesome name="building" size={16} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>{hotel.hotelName}</Text>
            {hotel.address && <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{hotel.address}</Text>}
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
              {fmtDate(hotel.checkInDate)} → {fmtDate(hotel.checkOutDate)} · {nights} night{nights !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity onPress={onRemove} style={{ padding: 6 }}>
              <FontAwesome name="trash-o" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
            <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
          </View>
        </View>

        {hotel.reservationNumber && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 6, paddingLeft: 48 }}>
            Reservation: {hotel.reservationNumber}
            {hotel.hotelPhone ? ` · ${hotel.hotelPhone}` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <RoomingList hotelId={hotel._id} travelers={travelers} artistId={hotel.artistId} />
        </View>
      )}
    </View>
  );
}

export default function HotelsScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const party = useQuery(api.travel.getTourParty, { id });
  const hotels = useQuery(api.travel.listHotelBookings, { tourPartyId: id });
  const travelers = useQuery(api.travel.listTravelers, { tourPartyId: id });
  const removeHotel = useMutation(api.travel.removeHotelBooking);

  const handleRemove = (hotelId: Id<'hotelBookings'>, name: string) => {
    Alert.alert('Remove Hotel', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeHotel({ id: hotelId }) },
    ]);
  };

  const sorted = [...(hotels ?? [])].sort((a, b) => a.checkInDate - b.checkInDate);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Hotels</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{party?.name ?? ''}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/travel/${partyId}/hotel-add` as any)}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {hotels === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : sorted.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="building" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 6 }}>No hotels yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Add hotel bookings to manage the rooming list.</Text>
          </View>
        ) : (
          sorted.map((h) => (
            <HotelCard
              key={h._id}
              hotel={h}
              travelers={travelers ?? []}
              onRemove={() => handleRemove(h._id, h.hotelName)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
