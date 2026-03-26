import { useQuery, useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';
import EmptyState from '../../src/components/EmptyState';
import ConfirmDialog from '../../src/components/ConfirmDialog';

const SEVERITY_COLORS: Record<string, string> = {
  critical: Colors.accentRed,
  high: Colors.orange,
  medium: Colors.accentBlue,
  low: Colors.textMuted,
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🚨',
  high: '⚠️',
  medium: 'ℹ️',
  low: '💬',
};

const FILTERS = ['all', 'active', 'acknowledged', 'resolved'];

export default function AlertsScreen() {
  const profile = useQuery(api.users.myProfile);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dismissTarget, setDismissTarget] = useState<Id<"alerts"> | null>(null);
  const acknowledge = useMutation(api.alerts.acknowledge);
  const resolve = useMutation(api.alerts.resolve);
  const dismiss = useMutation(api.alerts.dismiss);

  const alerts = useQuery(
    api.alerts.list,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  const filtered = (alerts ?? []).filter((a: any) =>
    filter === 'all' ? true : a.status === filter
  );

  const activeCount = (alerts ?? []).filter((a: any) => a.status === 'active').length;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Alerts</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {activeCount > 0
            ? `${activeCount} active alert${activeCount > 1 ? 's' : ''} need attention`
            : 'All clear — no active alerts'}
        </Text>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: filter === f ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: filter === f ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: filter === f ? '#000' : Colors.textMuted, textTransform: 'capitalize' }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {alerts === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="✅" title="No alerts" message={filter === 'all' ? 'Everything looks good — no active alerts' : `No ${filter} alerts`} />
        ) : (
          filtered.map((alert: any) => {
            const severityColor = SEVERITY_COLORS[alert.severity] ?? Colors.textMuted;
            const isActive = alert.status === 'active';
            return (
              <View key={alert._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: isActive ? `${severityColor}40` : Colors.border, borderRadius: 14, padding: 18, marginBottom: 10 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Text style={{ fontSize: 20, marginRight: 10, marginTop: 2 }}>
                    {SEVERITY_ICONS[alert.severity] ?? 'ℹ️'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>
                      {alert.title}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 20 }}>
                      {alert.message}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${severityColor}18`, marginLeft: 8 }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: severityColor, textTransform: 'capitalize' }}>
                      {alert.severity}
                    </Text>
                  </View>
                </View>

                {/* Timestamp */}
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: isActive ? 14 : 0 }}>
                  {new Date(alert._creationTime).toLocaleString()} · {alert.status}
                </Text>

                {/* Actions */}
                {isActive && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => acknowledge({ id: alert._id })}
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: `${Colors.accentBlue}18`, alignItems: 'center', borderWidth: 1, borderColor: `${Colors.accentBlue}30` }}
                    >
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accentBlue }}>Acknowledge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => resolve({ id: alert._id })}
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: `${Colors.green}18`, alignItems: 'center', borderWidth: 1, borderColor: `${Colors.green}30` }}
                    >
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.green }}>Resolve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDismissTarget(alert._id)}
                      style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.surface2, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                    >
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      <ConfirmDialog
        visible={dismissTarget !== null}
        title="Dismiss Alert"
        message="Are you sure you want to dismiss this alert?"
        confirmLabel="Dismiss"
        confirmColor={Colors.textMuted}
        onConfirm={() => { if (dismissTarget) dismiss({ id: dismissTarget }); setDismissTarget(null); }}
        onCancel={() => setDismissTarget(null)}
      />
    </View>
  );
}
