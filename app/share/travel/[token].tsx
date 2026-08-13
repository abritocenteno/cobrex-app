import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  flight_departure: { icon: 'plane', color: Colors.accent, label: 'Departure' },
  flight_arrival: { icon: 'plane', color: Colors.green, label: 'Arrival' },
  hotel_checkin: { icon: 'building', color: Colors.accent, label: 'Check-in' },
  hotel_checkout: { icon: 'building', color: Colors.textMuted, label: 'Check-out' },
  transport: { icon: 'car', color: Colors.orange, label: 'Transfer' },
  soundcheck: { icon: 'music', color: Colors.accent, label: 'Soundcheck' },
  performance: { icon: 'microphone', color: Colors.green, label: 'Performance' },
  meal: { icon: 'cutlery', color: Colors.textMuted, label: 'Meal' },
  other: { icon: 'calendar', color: Colors.textMuted, label: 'Event' },
};

function fmtDay(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

export default function TravelShareScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const result = useQuery(api.travel.getItineraryByToken, { token: token ?? '' });

  if (result === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (result === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <FontAwesome name="link" size={36} color={Colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 8 }}>
          Link Unavailable
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>
          This itinerary link has expired or is no longer shared.
        </Text>
      </View>
    );
  }

  const { party, items } = result;
  const groups = groupByDay(items);
  const conflictCount = items.filter((i) => i.conflictDetected).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${Colors.accent}20`, justifyContent: 'center', alignItems: 'center' }}>
            <FontAwesome name="plane" size={14} color={Colors.accent} />
          </View>
          <View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Travel Itinerary
            </Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.textPrimary }}>
              {party.name}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {party.departureDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <FontAwesome name="calendar" size={11} color={Colors.textMuted} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                Departs {fmtDate(party.departureDate)}
              </Text>
            </View>
          )}
          {party.returnDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <FontAwesome name="calendar-check-o" size={11} color={Colors.textMuted} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                Returns {fmtDate(party.returnDate)}
              </Text>
            </View>
          )}
          {party.shareExpiresAt && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <FontAwesome name="clock-o" size={11} color={Colors.textMuted} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                Link expires {fmtDate(party.shareExpiresAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 20 }}>
        {/* Conflict strip */}
        {conflictCount > 0 && (
          <View style={{ backgroundColor: `${Colors.orange}12`, borderWidth: 1, borderColor: `${Colors.orange}30`, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FontAwesome name="exclamation-triangle" size={15} color={Colors.orange} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.orange, flex: 1 }}>
              {conflictCount} scheduling conflict{conflictCount > 1 ? 's' : ''} flagged
            </Text>
          </View>
        )}

        {groups.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <FontAwesome name="calendar-o" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.textMuted }}>
              No itinerary yet
            </Text>
          </View>
        ) : (
          groups.map(({ day, items: dayItems }) => (
            <View key={day} style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.textPrimary, marginBottom: 10 }}>
                {day}
              </Text>
              <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14 }}>
                {dayItems.map((item, i) => {
                  const meta = TYPE_META[item.type] ?? TYPE_META.other;
                  return (
                    <View
                      key={item._id ?? i}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 12,
                        borderBottomWidth: i < dayItems.length - 1 ? 1 : 0,
                        borderBottomColor: Colors.border,
                      }}
                    >
                      <View style={{ width: 44, alignItems: 'center' }}>
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: item.conflictDetected ? `${Colors.orange}20` : `${meta.color}18`,
                          borderWidth: 1,
                          borderColor: item.conflictDetected ? `${Colors.orange}50` : `${meta.color}30`,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <FontAwesome
                            name={item.conflictDetected ? 'exclamation-triangle' as any : meta.icon as any}
                            size={11}
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
                              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.orange, marginTop: 3 }}>
                                {item.conflictNote}
                              </Text>
                            )}
                            {item.notes && (
                              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 3 }}>
                                {item.notes}
                              </Text>
                            )}
                          </View>
                          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, minWidth: 58, textAlign: 'right' }}>
                            {fmtTime(item.scheduledAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>
            Powered by Cobrex · Music Industry Management
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
