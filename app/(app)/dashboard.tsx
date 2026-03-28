import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, useWindowDimensions, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { formatTime, formatDate, formatMoney } from '../../src/utils/format';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SkeletonList, SkeletonStatCards } from '../../src/components/Skeleton';
import DraftRestorePrompt from '../../src/components/DraftRestorePrompt';
import { listDrafts, clearDraft } from '../../src/hooks/useDraftSave';

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, minWidth: 140 }}>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: color ?? Colors.textPrimary, marginBottom: 4 }}>{value}</Text>
      {sub ? <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{sub}</Text> : null}
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, flex: 1 }}>{title}</Text>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.accent }}>{action} →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Artist Dashboard ────────────────────────────────────────────────────────

function ArtistDashboard({ profile, isWide }: { profile: any; isWide: boolean }) {
  const router = useRouter();
  const artistId = profile?.artistId;
  const shows = useQuery(api.shows.list, artistId ? { artistId } : 'skip');
  const alertsList = useQuery(api.alerts.list, artistId ? { artistId, activeOnly: true } : 'skip');

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const upcomingShows = (shows ?? []).filter((s: any) => s.showDate >= today && s.status !== 'cancelled');
  const activeAlerts = alertsList ?? [];
  const confirmedShows = upcomingShows.filter((s: any) => s.status === 'confirmed');

  return (
    <>
      {/* Alerts banner */}
      {activeAlerts.length > 0 ? (
        <TouchableOpacity
          onPress={() => router.push('/(app)/alerts')}
          style={{ backgroundColor: `${Colors.accentRed}18`, borderWidth: 1, borderColor: `${Colors.accentRed}40`, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 18, marginRight: 12 }}>🚨</Text>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accentRed, flex: 1 }}>
            {activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''} — tap to review
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Stat cards */}
      {shows === undefined ? (
        <SkeletonStatCards />
      ) : (
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, marginBottom: 28 }}>
          <StatCard label="Upcoming Shows" value={String(upcomingShows.length)} sub="not cancelled" color={Colors.accentBlue} />
          <StatCard label="Confirmed" value={String(confirmedShows.length)} sub="locked in" color={Colors.green} />
          <StatCard label="Active Alerts" value={String(activeAlerts.length)} sub="need attention" color={activeAlerts.length > 0 ? Colors.accentRed : Colors.textMuted} />
          <StatCard label="Total Shows" value={String((shows ?? []).length)} sub="all time" />
        </View>
      )}

      {/* Upcoming shows */}
      <View style={{ marginBottom: 28 }}>
        <SectionHeader title="Upcoming Shows" action="View all" onAction={() => router.push('/(app)/shows')} />
        {shows === undefined ? (
          <SkeletonList count={3} />
        ) : upcomingShows.length === 0 ? (
          <TouchableOpacity
            onPress={() => router.push('/(app)/shows/add')}
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 32, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🎤</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>No upcoming shows</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.accent }}>Tap to add your first show →</Text>
          </TouchableOpacity>
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
                  {show.showTime ? `${formatTime(show.showTime)} · ` : ''}{formatDate(show.showDate, { short: true })}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: show.status === 'confirmed' ? `${Colors.green}18` : `${Colors.accentBlue}18` }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: show.status === 'confirmed' ? Colors.green : Colors.accentBlue, textTransform: 'capitalize' }}>{show.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );
}

// ─── Manager Dashboard ───────────────────────────────────────────────────────

function ManagerDashboard({ profile, isWide }: { profile: any; isWide: boolean }) {
  const router = useRouter();
  const managerProfile = useQuery(api.manager.myProfile);
  const roster = useQuery(
    api.manager.roster,
    managerProfile?._id ? { managerId: managerProfile._id } : 'skip'
  );
  const financials = useQuery(
    api.manager.financialSummary,
    managerProfile?._id ? { managerId: managerProfile._id } : 'skip'
  );
  const allShows = useQuery(
    api.manager.allShows,
    managerProfile?._id ? { managerId: managerProfile._id } : 'skip'
  );

  const today = new Date().toISOString().split('T')[0];
  const upcomingShows = (allShows ?? []).filter((s: any) => s.showDate >= today && s.status !== 'cancelled');
  const totalArtists = (roster ?? []).length;

  return (
    <>
      {/* Stat cards */}
      {roster === undefined || financials === undefined ? (
        <SkeletonStatCards />
      ) : (
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, marginBottom: 28 }}>
          <StatCard label="Roster" value={String(totalArtists)} sub="active artists" color={Colors.accentBlue} />
          <StatCard label="Upcoming Shows" value={String(upcomingShows.length)} sub="across all artists" color={Colors.accent} />
          <StatCard label="YTD Earnings" value={formatMoney(financials.ytd)} sub="paid in full" color={Colors.green} />
          <StatCard label="Outstanding" value={formatMoney(financials.outstanding)} sub="awaiting payment" color={financials.outstanding > 0 ? Colors.orange : Colors.textMuted} />
        </View>
      )}

      {/* Roster overview */}
      <View style={{ marginBottom: 28 }}>
        <SectionHeader title="Your Roster" action="Full roster" onAction={() => router.push('/(app)/roster')} />
        {roster === undefined ? (
          <SkeletonList count={3} />
        ) : roster.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>👥</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>No artists yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Roster invitations will appear here</Text>
          </View>
        ) : (
          roster.slice(0, 4).map((artist: any) => (
            <View key={artist._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: Colors.accent }}>{(artist.name ?? '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>{artist.name}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                  {artist.upcomingShowCount} upcoming · {formatMoney(artist.outstanding ?? 0)} outstanding
                </Text>
              </View>
              {artist.nextShowDate ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>{formatDate(artist.nextShowDate, { short: true })}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Upcoming shows across roster */}
      {upcomingShows.length > 0 ? (
        <View style={{ marginBottom: 28 }}>
          <SectionHeader title="Upcoming Shows" action="All shows" onAction={() => router.push('/(app)/shows')} />
          {upcomingShows.slice(0, 5).map((show: any) => (
            <TouchableOpacity
              key={show._id}
              onPress={() => router.push(`/(app)/shows/${show._id}` as any)}
              style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>{show.name}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{formatDate(show.showDate, { short: true })}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: show.status === 'confirmed' ? `${Colors.green}18` : `${Colors.textMuted}18` }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: show.status === 'confirmed' ? Colors.green : Colors.textMuted, textTransform: 'capitalize' }}>{show.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Quick links */}
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, marginBottom: 28 }}>
        {[
          { icon: '👥', label: 'Roster', route: '/(app)/roster' },
          { icon: '🤝', label: 'Deals', route: '/(app)/deals' },
          { icon: '🎤', label: 'Shows', route: '/(app)/shows' },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>{item.label}</Text>
            <Text style={{ color: Colors.textMuted }}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// ─── Venue Dashboard ─────────────────────────────────────────────────────────

function VenueDashboard({ profile, isWide }: { profile: any; isWide: boolean }) {
  const router = useRouter();
  const venueProfile = useQuery(api.venue.myProfile);
  const upcomingShows = useQuery(
    api.venue.upcomingShows,
    venueProfile?._id ? { venueProfileId: venueProfile._id } : 'skip'
  );

  const confirmed = (upcomingShows ?? []).filter((vs: any) => vs.confirmedByVenue).length;
  const pending = (upcomingShows ?? []).filter((vs: any) => !vs.confirmedByVenue).length;
  const ridersNeeded = (upcomingShows ?? []).filter((vs: any) =>
    !vs.techRiderReceived || !vs.stagePlotReceived
  ).length;

  return (
    <>
      {/* Stat cards */}
      {upcomingShows === undefined ? (
        <SkeletonStatCards />
      ) : (
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, marginBottom: 28 }}>
          <StatCard label="Upcoming Shows" value={String((upcomingShows ?? []).length)} sub="at your venue" color={Colors.accentBlue} />
          <StatCard label="Confirmed" value={String(confirmed)} sub="by venue" color={Colors.green} />
          <StatCard label="Awaiting Confirm" value={String(pending)} sub="need your sign-off" color={pending > 0 ? Colors.orange : Colors.textMuted} />
          <StatCard label="Riders Pending" value={String(ridersNeeded)} sub="tech rider / stage plot" color={ridersNeeded > 0 ? Colors.accentRed : Colors.textMuted} />
        </View>
      )}

      {/* Venue info banner */}
      {venueProfile ? (
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 18, marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, marginRight: 14 }}>🏛️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 2 }}>{venueProfile.name}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
              {[venueProfile.city, venueProfile.country].filter(Boolean).join(', ')}
              {venueProfile.capacity ? ` · Cap. ${venueProfile.capacity}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Upcoming shows */}
      <View style={{ marginBottom: 28 }}>
        <SectionHeader title="Upcoming Shows" action="All requests" onAction={() => router.push('/(app)/requests')} />
        {upcomingShows === undefined ? (
          <SkeletonList count={3} />
        ) : upcomingShows.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🏛️</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>No upcoming shows</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Shows linked to your venue will appear here</Text>
          </View>
        ) : (
          upcomingShows.slice(0, 5).map((vs: any) => {
            const show = vs.show;
            const riderOk = vs.techRiderReceived && vs.stagePlotReceived;
            return (
              <View key={vs._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 }}>{show.name}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {formatDate(show.showDate, { weekday: true })}
                      {show.showTime ? ` · ${formatTime(show.showTime)}` : ''}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: vs.confirmedByVenue ? `${Colors.green}18` : `${Colors.orange}18` }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: vs.confirmedByVenue ? Colors.green : Colors.orange }}>
                      {vs.confirmedByVenue ? '✓ Confirmed' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: 'Tech Rider', ok: vs.techRiderReceived },
                    { label: 'Stage Plot', ok: vs.stagePlotReceived },
                    { label: 'Settlement', ok: vs.settlementPaid },
                  ].map((r) => (
                    <View key={r.label} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: r.ok ? `${Colors.green}18` : Colors.surface2, borderWidth: 1, borderColor: r.ok ? `${Colors.green}30` : Colors.border }}>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: r.ok ? Colors.green : Colors.textMuted }}>
                        {r.ok ? '✓ ' : ''}{r.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Quick link to requests */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/requests')}
        style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}
      >
        <Text style={{ fontSize: 22 }}>📬</Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>Manage All Requests</Text>
        <Text style={{ color: Colors.textMuted }}>→</Text>
      </TouchableOpacity>
    </>
  );
}

// ─── Root Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const profile = useQuery(api.users.myProfile);
  const role = profile?.role ?? 'artist';

  // Draft restore: detect any locally saved draft on mount
  type DraftEntry = { key: string; route: string; ts: number; label: string };
  const [pendingDraft, setPendingDraft] = useState<DraftEntry | null>(null);
  useEffect(() => {
    const drafts = listDrafts();
    if (drafts.length > 0) setPendingDraft(drafts[0]);
  }, []);

  const DRAFT_ROUTES: Record<string, string> = {
    shows_add: '/(app)/shows/add',
    contacts_add: '/(app)/contacts/add',
    deals_add: '/(app)/deals/add',
    assets_add: '/(app)/assets-add',
  };

  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    const route = DRAFT_ROUTES[pendingDraft.key];
    setPendingDraft(null);
    if (route) router.push(`${route}?restore=1` as any);
  };

  const handleDiscardDraft = () => {
    if (!pendingDraft) return;
    clearDraft(pendingDraft.key);
    setPendingDraft(null);
  };

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

      {pendingDraft && (
        <DraftRestorePrompt
          draftKey={pendingDraft.key}
          ts={pendingDraft.ts}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {role === 'artist' ? (
        <ArtistDashboard profile={profile} isWide={isWide} />
      ) : role === 'manager' ? (
        <ManagerDashboard profile={profile} isWide={isWide} />
      ) : (
        <VenueDashboard profile={profile} isWide={isWide} />
      )}
    </ScrollView>
  );
}
