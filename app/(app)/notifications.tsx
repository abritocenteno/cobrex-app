import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';
import EmptyState from '../../src/components/EmptyState';

const TYPE_ICONS: Record<string, string> = {
  show_reminder: '🎤',
  payment_received: '💰',
  payment_due: '��',
  contract_signed: '📄',
  booking_request: '��',
  alert: '🚨',
  info: 'ℹ️',
  success: '✅',
};

export default function NotificationsScreen() {
  const notifications = useQuery(api.notifications.list, { limit: 50 });
  const markAllRead = useMutation(api.notifications.markAllRead);
  const dismiss = useMutation(api.notifications.dismiss);

  const unread = (notifications ?? []).filter((n: any) => !n.isRead).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, flex: 1 }}>Notifications</Text>
          {unread > 0 && (
            <TouchableOpacity
              onPress={() => markAllRead()}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {unread > 0 ? `${unread} unread` : 'All caught up'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }}>
        {notifications === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" message="You're all caught up! Check back later." />
        ) : (
          notifications.map((n: any) => (
            <View
              key={n._id}
              style={{
                backgroundColor: n.isRead ? Colors.surface : Colors.surface2,
                borderWidth: 1,
                borderColor: n.isRead ? Colors.border : `${Colors.accent}30`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>
                {TYPE_ICONS[n.type] ?? 'ℹ️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: n.isRead ? 'DMSans_400Regular' : 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>
                  {n.title}
                </Text>
                {n.body && (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 6, lineHeight: 20 }}>
                    {n.body}
                  </Text>
                )}
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>
                  {new Date(n._creationTime).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => dismiss({ id: n._id })}
                style={{ padding: 4, marginLeft: 8 }}
              >
                <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
