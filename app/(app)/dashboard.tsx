import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, useWindowDimensions, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SkeletonList, SkeletonStatCards } from '../../src/components/Skeleton';

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, minWidth: 140 }}>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: color ?? Colors.textPrimary, marginBottom: 4 }}>{value}</Text>
      {sub && <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{sub}</Text>}
    </View>
  );
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const profile = useQuery(api.users.myProfile);
  const role = profile?.role ?? 'artist';
  const isArtist = role === 'artist';
  const artistId = profile?.artistId;

  const shows = useQuery(api.shows.list, artistId ? { artistId } : 'skip');
  const alertsList = useQuery(api.alerts.list, artistId ? { artistId, activeOnly: true } : 'skip');

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (profile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  const now = new Date();
  const upcomingShows = (shows ?? []).filter((s: any) => new Date(s.showDate) >= now);
  const activeAlerts = alertsList ?? [];
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      {/* Header */}
      <View style={{ marginBottom: 28 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>{greeting}</Text>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: Colors.textPrimary, marginBottom: 8 }}>{profile?.displayName ?? 'User'}</Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: `${Colors.accent}18`, alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1 }}>
            {role} portal
          </Text>
        </View>
      </View>

      {/* Non-artist banner */}
      {!isArtist && (
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>{role === 'manager' ? '🎯' : '🏛️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>
              {role === 'manager' ? 'Manager Dashboard' : 'Venue Dashboard'}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
              {role === 'manager'
                ? 'View your roster and artist activity in the Roster section.'
                : 'View your upcoming shows in the Requests section.'}
            </Text>
          </View>
        </View>
      )}

      {/* Artist content */}
      {isArtist && (
        <>
          {/* Alerts banner */}
          {activeAlerts.length > 0 && (
            <View style={{ backgroundColor: `${Colors.accentRed}18`, borderWidth: 1, borderColor: `${Colors.accentRed}40`, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🚨</Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accentRed, flex: 1 }}>
                {activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''} require your attention
              </Text>
            </View>
          )}

          {/* Stat cards */}
          {shows === undefined ? (
            <SkeletonStatCards />
          ) : (
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, marginBottom: 28 }}>
              <StatCard label="Upcoming Shows" value={String(upcomingShows.length)} sub="next 90 days" color={Colors.accentBlue} />
              <StatCard label="Total Shows" value={String((shows ?? []).length)} sub="all time" color={Colors.green} />
              <StatCard label="Active Alerts" value={String(activeAlerts.length)} sub="need attention" color={activeAlerts.length > 0 ? Colors.accentRed : Colors.textMuted} />
              <StatCard label="Role" value={profile?.role?.toUpperCase() ?? '—'} sub={profile?.profileComplete ? 'Complete' : 'Incomplete'} />
            </View>
          )}

          {/* Upcoming shows */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 16 }}>Upcoming Shows</Text>
            {shows === undefined ? (
              <SkeletonList count={3} />
            ) : upcomingShows.length === 0 ? (
              <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>🎤</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>No upcoming shows</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Add your first show to get started</Text>
              </View>
            ) : (
              upcomingShows.slice(0, 5).map((show: any) => (
                <TouchableOpacity
                  key={show._id}
                  onPress={() => router.push(`/(app)/shows/${show._id}` as any)}
                  style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontSize: 22 }}>🎤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 }}>{show.name}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {show.showTime ? `${show.showTime} · ` : ''}{new Date(show.showDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.accentBlue}18` }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.accentBlue }}>{show.status ?? 'confirmed'}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
