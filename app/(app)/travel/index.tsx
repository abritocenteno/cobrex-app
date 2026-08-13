import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, string> = {
  planning: Colors.textMuted,
  confirmed: Colors.accent,
  travelling: Colors.green,
  completed: Colors.textMuted,
  cancelled: Colors.accentRed,
};

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  travelling: 'Travelling',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function PartyCard({ party, onPress }: { party: any; onPress: () => void }) {
  const statusColor = STATUS_COLORS[party.status] ?? Colors.textMuted;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <FontAwesome name="plane" size={16} color={Colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>{party.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: statusColor }}>
              {STATUS_LABELS[party.status] ?? party.status}
            </Text>
            {party.departureDate && (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                · {new Date(party.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
        <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function ArtistTravelSection({ item }: { item: { artist: any; parties: any[] } }) {
  const router = useRouter();
  if (!item.artist || item.parties.length === 0) return null;
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
        {item.artist.name}
      </Text>
      {item.parties.map((p: any) => (
        <PartyCard key={p._id} party={p} onPress={() => router.push(`/(app)/travel/${p._id}` as any)} />
      ))}
    </View>
  );
}

export default function TravelScreen() {
  const profile = useQuery(api.users.myProfile);
  const router = useRouter();
  const role = profile?.role ?? 'artist';

  const myParties = useQuery(
    api.travel.listMyTourParties,
    role === 'artist' ? {} : 'skip'
  );

  const managerParties = useQuery(
    api.travel.listManagerTourParties,
    role === 'manager' ? {} : 'skip'
  );

  const loading = profile === undefined || myParties === undefined && role === 'artist' || managerParties === undefined && role === 'manager';

  const canAddParty = role === 'artist' && profile?.artistId;
  const managerCanAdd = role === 'manager';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>
          {role === 'manager' ? 'Travel Command Center' : 'My Travel'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1 }}>
            {role === 'manager' ? 'Manage tour parties across your roster' : 'Your upcoming trips & documents'}
          </Text>
          {(canAddParty || managerCanAdd) && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/travel/party-add' as any)}
              style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ New Party</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : role === 'manager' ? (
          (managerParties ?? []).length === 0 ? (
            <EmptyTravel onAdd={() => router.push('/(app)/travel/party-add' as any)} role="manager" />
          ) : (
            (managerParties ?? []).map((item: any, i: number) => (
              <ArtistTravelSection key={i} item={item} />
            ))
          )
        ) : (
          (myParties ?? []).length === 0 ? (
            <EmptyTravel onAdd={() => router.push('/(app)/travel/party-add' as any)} role="artist" />
          ) : (
            (myParties ?? []).map((p: any) => (
              <PartyCard key={p._id} party={p} onPress={() => router.push(`/(app)/travel/${p._id}` as any)} />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

function EmptyTravel({ onAdd, role }: { onAdd: () => void; role: string }) {
  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 16 }}>
      <FontAwesome name="plane" size={40} color={Colors.textMuted} style={{ marginBottom: 16 }} />
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No tour parties yet</Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 }}>
        {role === 'manager'
          ? 'Create a tour party to start managing travel logistics for your artists.'
          : 'Create a tour party to track your upcoming trip, documents, and travel details.'}
      </Text>
      <TouchableOpacity onPress={onAdd} style={{ backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Create Tour Party</Text>
      </TouchableOpacity>
    </View>
  );
}
