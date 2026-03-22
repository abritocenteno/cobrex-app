import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../../src/constants/colors';

const PLATFORM_ICONS: Record<string, string> = {
  spotify: '🎧',
  apple_music: '🎵',
  youtube: '▶️',
  instagram: '📸',
  tiktok: '🎬',
  soundcloud: '☁️',
  other: '📊',
};

const METRIC_LABELS: Record<string, string> = {
  monthly_listeners: 'Monthly Listeners',
  followers: 'Followers',
  streams: 'Streams',
  views: 'Views',
  saves: 'Saves',
  playlist_adds: 'Playlist Adds',
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function MetricsScreen() {
  const profile = useQuery(api.users.myProfile);
  const [refreshing, setRefreshing] = useState(false);
  const metrics = useQuery(
    api.metrics.list,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  if (profile !== undefined && !profile?.artistId) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>Artist feature only</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>This section is only available for artist accounts.</Text>
      </View>
    );
  }

  // Group by platform
  const grouped = (metrics ?? []).reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.platform]) acc[m.platform] = [];
    acc[m.platform].push(m);
    return acc;
  }, {});

  // Get latest per platform+metricType
  const latest: Record<string, any> = {};
  (metrics ?? []).forEach((m: any) => {
    const key = `${m.platform}:${m.metricType}`;
    if (!latest[key] || m.recordedAt > latest[key].recordedAt) {
      latest[key] = m;
    }
  });

  const latestByPlatform = Object.values(latest).reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.platform]) acc[m.platform] = [];
    acc[m.platform].push(m);
    return acc;
  }, {});

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Metrics</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {Object.keys(latestByPlatform).length} platforms tracked
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {metrics === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : metrics.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No metrics yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Add your first metric snapshot to start tracking</Text>
          </View>
        ) : (
          Object.entries(latestByPlatform).map(([platform, items]) => (
            <View key={platform} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              {/* Platform header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{PLATFORM_ICONS[platform] ?? '📊'}</Text>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, textTransform: 'capitalize' }}>
                  {platform.replace(/_/g, ' ')}
                </Text>
              </View>

              {/* Metrics grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {(items as any[]).map((m: any) => (
                  <View key={m._id} style={{ flex: 1, minWidth: 120, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                      {METRIC_LABELS[m.metricType] ?? m.metricType}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.accentBlue }}>
                      {formatNumber(m.value)}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, marginTop: 4 }}>
                      {new Date(m.recordedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
