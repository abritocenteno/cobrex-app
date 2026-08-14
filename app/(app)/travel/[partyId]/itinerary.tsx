import { useQuery, useMutation, useAction } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  flight_departure: { icon: 'plane', color: Colors.accent, label: 'Flight Departure' },
  flight_arrival: { icon: 'plane', color: Colors.green, label: 'Flight Arrival' },
  hotel_checkin: { icon: 'building', color: Colors.accent, label: 'Hotel Check-in' },
  hotel_checkout: { icon: 'building', color: Colors.textMuted, label: 'Hotel Check-out' },
  transport: { icon: 'car', color: Colors.orange, label: 'Transfer' },
  soundcheck: { icon: 'music', color: Colors.accent, label: 'Soundcheck' },
  performance: { icon: 'microphone', color: Colors.green, label: 'Performance' },
  meal: { icon: 'cutlery', color: Colors.textMuted, label: 'Meal' },
  other: { icon: 'calendar', color: Colors.textMuted, label: 'Event' },
};

function fmtDay(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function groupByDay(items: any[]): Array<{ day: string; ts: number; items: any[] }> {
  const map = new Map<string, { ts: number; items: any[] }>();
  for (const item of items) {
    const day = fmtDay(item.scheduledAt);
    if (!map.has(day)) map.set(day, { ts: item.scheduledAt, items: [] });
    map.get(day)!.items.push(item);
  }
  return Array.from(map.entries())
    .map(([day, val]) => ({ day, ts: val.ts, items: val.items }))
    .sort((a, b) => a.ts - b.ts);
}

function ItineraryItem({ item }: { item: any }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.other;
  return (
    <View style={{
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    }}>
      {/* Timeline line + dot */}
      <View style={{ width: 48, alignItems: 'center' }}>
        <View style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: item.conflictDetected ? `${Colors.orange}20` : `${meta.color}18`,
          borderWidth: 1,
          borderColor: item.conflictDetected ? `${Colors.orange}50` : `${meta.color}30`,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <FontAwesome
            name={item.conflictDetected ? 'exclamation-triangle' as any : meta.icon as any}
            size={12}
            color={item.conflictDetected ? Colors.orange : meta.color}
          />
        </View>
      </View>

      <View style={{ flex: 1, paddingLeft: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: item.conflictDetected ? Colors.orange : Colors.textPrimary, lineHeight: 18 }}>
              {item.title}
            </Text>
            {item.conflictNote && (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.orange, marginTop: 3, lineHeight: 16 }}>
                {item.conflictNote}
              </Text>
            )}
            {item.notes && (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 3 }}>{item.notes}</Text>
            )}
          </View>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, minWidth: 60, textAlign: 'right' }}>
            {fmtTime(item.scheduledAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ItineraryScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const party = useQuery(api.travel.getTourParty, { id });
  const items = useQuery(api.travel.listItinerary, { tourPartyId: id });
  const buildItinerary = useMutation(api.travel.buildItinerary);
  const createShare = useMutation(api.travel.createItineraryShare);
  const optimizeItinerary = useAction(api.aiTravel.optimizeItinerary);
  const [building, setBuilding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ severity: string; category: string; title: string; detail: string }> | null>(null);

  const groups = groupByDay(items ?? []);
  const conflictCount = (items ?? []).filter((i) => i.conflictDetected).length;

  const handleBuild = async () => {
    setBuilding(true);
    try {
      const result = await buildItinerary({ tourPartyId: id });
      Alert.alert('Itinerary Built', `Generated ${result.itemCount} items from your flights, hotels, and transport jobs.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setBuilding(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setSuggestions(null);
    try {
      const result = await optimizeItinerary({ tourPartyId: id });
      setSuggestions(result.suggestions);
      if (result.suggestions.length === 0) {
        Alert.alert('All Clear', 'No significant issues found with this itinerary.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not analyse itinerary');
    } finally {
      setOptimizing(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const { token } = await createShare({ tourPartyId: id });
      await Share.share({
        title: `${party?.name ?? 'Itinerary'} — Travel Schedule`,
        message: `Itinerary token: ${token}\n\nOpen in Cobrex to view the full schedule.`,
      });
    } catch (err: any) {
      if ((err as any)?.message !== 'aborted') {
        Alert.alert('Error', err?.message ?? 'Could not create share link');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Itinerary</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{party?.name ?? ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            {sharing
              ? <ActivityIndicator size="small" color={Colors.textMuted} style={{ width: 13, height: 13 }} />
              : <FontAwesome name="share-square-o" size={13} color={Colors.textMuted} />}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted }}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOptimize}
            disabled={optimizing || (items ?? []).length === 0}
            style={{ backgroundColor: `${Colors.accent}15`, borderWidth: 1, borderColor: `${Colors.accent}40`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            {optimizing
              ? <ActivityIndicator size="small" color={Colors.accent} style={{ width: 13, height: 13 }} />
              : <FontAwesome name="magic" size={13} color={Colors.accent} />}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.accent }}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBuild}
            disabled={building}
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            {building
              ? <ActivityIndicator size="small" color={Colors.accent} style={{ width: 13, height: 13 }} />
              : <FontAwesome name="refresh" size={13} color={Colors.accent} />}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.accent }}>
              {(items ?? []).length === 0 ? 'Build' : 'Rebuild'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {/* AI suggestions panel */}
        {suggestions && suggestions.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: `${Colors.accent}30`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FontAwesome name="magic" size={14} color={Colors.accent} />
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>AI Suggestions</Text>
              <TouchableOpacity onPress={() => setSuggestions(null)}>
                <FontAwesome name="times" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {suggestions.map((s, i) => {
              const color = s.severity === 'critical' ? Colors.accentRed : s.severity === 'warning' ? Colors.orange : Colors.accent;
              const icon = s.severity === 'critical' ? 'exclamation-circle' : s.severity === 'warning' ? 'exclamation-triangle' : 'info-circle';
              return (
                <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: Colors.border }}>
                  <FontAwesome name={icon as any} size={13} color={color} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary, marginBottom: 3 }}>{s.title}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 17 }}>{s.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Conflict summary */}
        {conflictCount > 0 && (
          <View style={{ backgroundColor: `${Colors.orange}12`, borderWidth: 1, borderColor: `${Colors.orange}30`, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FontAwesome name="exclamation-triangle" size={16} color={Colors.orange} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.orange, flex: 1 }}>
              {conflictCount} scheduling conflict{conflictCount > 1 ? 's' : ''} detected — review highlighted items
            </Text>
          </View>
        )}

        {items === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : groups.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="calendar" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 8 }}>No itinerary yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 }}>
              Add flights, hotels, and transport first, then tap Build to generate the full timeline.
            </Text>
            <TouchableOpacity
              onPress={handleBuild}
              disabled={building}
              style={{ backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            >
              {building
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Build Itinerary</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          groups.map(({ day, items: dayItems }) => (
            <View key={day} style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>{day}</Text>
              <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14 }}>
                {dayItems.map((item, i) => (
                  <ItineraryItem key={item._id} item={item} />
                ))}
              </View>
            </View>
          ))
        )}

        {groups.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginTop: 4 }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, lineHeight: 18 }}>
              This itinerary is generated from your flight, hotel, and transport bookings. Tap Rebuild after adding new bookings to keep it up to date.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
