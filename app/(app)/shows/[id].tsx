import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../../src/constants/colors';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.green,
  draft: Colors.textMuted,
  completed: Colors.accentBlue,
  cancelled: Colors.accentRed,
  postponed: Colors.orange,
};

const PAYMENT_COLORS: Record<string, string> = {
  paid_in_full: Colors.green,
  deposit_paid: Colors.orange,
  unpaid: Colors.accentRed,
  overpaid: Colors.accentPurple,
  refunded: Colors.textMuted,
};

const TIMELINE_STATUS_COLORS: Record<string, string> = {
  pending: Colors.textMuted,
  in_progress: Colors.orange,
  completed: Colors.green,
  skipped: Colors.accentRed,
};

export default function ShowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const show = useQuery(api.shows.get, id ? { id: id as any } : 'skip');
  const timeline = useQuery(api.timeline.list, id ? { showId: id as any } : 'skip');
  const updateStatus = useMutation(api.shows.update);
  const updateTimelineStatus = useMutation(api.timeline.updateStatus);

  if (show === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  if (!show) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: Colors.textMuted }}>Show not found</Text></View>;
  }

  const statusColor = STATUS_COLORS[show.status] ?? Colors.textMuted;
  const paymentColor = PAYMENT_COLORS[show.paymentStatus] ?? Colors.textMuted;

  const STATUS_ACTIONS = [
    { label: 'Draft', value: 'draft' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Shows</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/shows/edit/${show._id}` as any)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 6 }}>{show.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${statusColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: statusColor, textTransform: 'capitalize' }}>{show.status}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${paymentColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: paymentColor }}>{show.paymentStatus?.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 700, width: '100%', alignSelf: 'center' }}>

        {/* Date & Times */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>📅 Schedule</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Date', value: new Date(show.showDate).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Load In', value: show.loadInTime ?? '—' },
              { label: 'Soundcheck', value: show.soundcheckTime ?? '—' },
              { label: 'Doors', value: show.doorsTime ?? '—' },
              { label: 'Show Time', value: show.showTime ?? '—' },
              { label: 'Set Length', value: show.setLengthMinutes ? `${show.setLengthMinutes} min` : '—' },
            ].map((item) => (
              <View key={item.label} style={{ minWidth: 140 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Change Status */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>🔄 Update Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STATUS_ACTIONS.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => updateStatus({ id: show._id, status: s.value })}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: show.status === s.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: show.status === s.value ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: show.status === s.value ? '#000' : Colors.textMuted }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Checklist */}
        <TouchableOpacity
          onPress={() => router.push(`/(app)/shows/checklist/${show._id}` as any)}
          style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 20, marginRight: 12 }}>📋</Text>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, flex: 1 }}>Show Checklist</Text>
          <Text style={{ color: Colors.textMuted }}>→</Text>
        </TouchableOpacity>

        {/* Timeline */}
        {timeline !== undefined && timeline.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>⏱️ Timeline</Text>
            {timeline.map((event: any, index: number) => {
              const eventColor = TIMELINE_STATUS_COLORS[event.status] ?? Colors.textMuted;
              return (
                <View key={event._id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                  {/* Line */}
                  <View style={{ alignItems: 'center', marginRight: 14 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: eventColor, marginTop: 2 }} />
                    {index < timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 4 }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>{event.label}</Text>
                      {event.scheduledTime && <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{event.scheduledTime}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['pending', 'in_progress', 'completed', 'skipped'].map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => updateTimelineStatus({ id: event._id, status: s })}
                          style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: event.status === s ? `${TIMELINE_STATUS_COLORS[s]}30` : Colors.surface2, borderWidth: 1, borderColor: event.status === s ? TIMELINE_STATUS_COLORS[s] : Colors.border }}
                        >
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: event.status === s ? TIMELINE_STATUS_COLORS[s] : Colors.textMuted, textTransform: 'capitalize' }}>{s.replace('_', ' ')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Notes */}
        {show.notes && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 10 }}>📝 Notes</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{show.notes}</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
