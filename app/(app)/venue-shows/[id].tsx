import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { formatDate, formatTime } from '../../../src/utils/format';

export default function VenueShowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = useQuery(api.venue.showDetail, id ? { id: id as any } : 'skip');

  if (detail === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.textMuted }}>Show not found</Text>
      </View>
    );
  }

  const show = detail.show;
  const date = new Date(show.showDate + 'T12:00:00');

  const RIDER_CHIPS = [
    { label: 'Tech Rider', field: 'techRiderReceived' },
    { label: 'Stage Plot', field: 'stagePlotReceived' },
    { label: 'Input List', field: 'inputListReceived' },
    { label: 'Hospitality', field: 'hospitalityRiderReceived' },
    { label: 'Catering', field: 'cateringConfirmed' },
    { label: 'Accessibility', field: 'accessibilitiesConfirmed' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}
        >
          <FontAwesome name="chevron-left" size={14} color={Colors.accent} />
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>Requests</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>
          {show.name}
        </Text>
        {show.artistName && (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>
            {show.artistName}
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: detail.confirmedByVenue ? `${Colors.green}18` : `${Colors.orange}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: detail.confirmedByVenue ? Colors.green : Colors.orange }}>
              {detail.confirmedByVenue ? '✓ Confirmed' : 'Pending confirmation'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 700, width: '100%', alignSelf: 'center' }}>

        {/* Schedule */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>Schedule</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Date', value: formatDate(show.showDate, { weekday: true }) },
              { label: 'Load In', value: formatTime(show.loadInTime) },
              { label: 'Soundcheck', value: formatTime(show.soundcheckTime) },
              { label: 'Doors', value: formatTime(show.doorsTime) },
              { label: 'Show Time', value: formatTime(show.showTime) },
              { label: 'Set Length', value: show.setLengthMinutes ? `${show.setLengthMinutes} min` : '—' },
            ].map((item) => (
              <View key={item.label} style={{ minWidth: 130 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Documents */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>Documents</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {RIDER_CHIPS.map((item) => {
              const received = !!(detail as any)[item.field];
              return (
                <View
                  key={item.field}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: received ? `${Colors.green}18` : Colors.surface2,
                    borderWidth: 1,
                    borderColor: received ? `${Colors.green}40` : Colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {received && <FontAwesome name="check" size={10} color={Colors.green} />}
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: received ? Colors.green : Colors.textMuted }}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settlement */}
        {detail.settlementPaid && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>Settlement</Text>
            <View style={{ flexDirection: 'row', gap: 32 }}>
              <View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Amount</Text>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.green }}>
                  €{((detail.settlementAmount ?? 0) / 100).toLocaleString()}
                </Text>
              </View>
              {detail.ticketsSold != null && (
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Tickets Sold</Text>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.textPrimary }}>
                    {detail.ticketsSold.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {show.notes && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FontAwesome name="pencil-square-o" size={14} color={Colors.textPrimary} />
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary }}>Notes</Text>
            </View>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{show.notes}</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
