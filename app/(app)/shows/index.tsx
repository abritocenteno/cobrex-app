import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import EmptyState from '../../../src/components/EmptyState';
import { SkeletonList } from '../../../src/components/Skeleton';
import { useState } from 'react';

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

const FILTERS = ['all', 'confirmed', 'draft', 'completed', 'cancelled'];

export default function ShowsScreen() {
  const profile = useQuery(api.users.myProfile);
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const shows = useQuery(
    api.shows.list,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  if (profile !== undefined && !profile?.artistId) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🎤</Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>Artist feature only</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>This section is only available for artist accounts.</Text>
      </View>
    );
  }

  const filtered = (shows ?? []).filter((s: any) => {
    const matchesFilter = filter === 'all' ? true : s.status === filter;
    const matchesSearch = search === '' || s.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcoming = filtered.filter((s: any) => new Date(s.showDate) >= new Date());
  const past = filtered.filter((s: any) => new Date(s.showDate) < new Date());

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Shows</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1 }}>
            {(shows ?? []).length} total · {upcoming.length} upcoming
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/shows/add')}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add Show</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search shows..."
          placeholderTextColor={Colors.textMuted}
          style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 14 }}
        />

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: filter === f ? Colors.accent : Colors.surface2,
                  borderWidth: 1,
                  borderColor: filter === f ? Colors.accent : Colors.border,
                }}
              >
                <Text style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 12,
                  color: filter === f ? '#000' : Colors.textMuted,
                  textTransform: 'capitalize',
                }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {shows === undefined ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🎤" title="No shows found" message={filter === 'all' ? 'Add your first show to get started' : `No ${filter} shows`} actionLabel={filter === 'all' ? '+ Add Show' : undefined} onAction={filter === 'all' ? () => router.push('/(app)/shows/add') : undefined} />
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 12, marginTop: 20, textTransform: 'uppercase' }}>
                  Upcoming
                </Text>
                {upcoming.map((show: any) => <ShowCard key={show._id} show={show} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 12, marginTop: 24, textTransform: 'uppercase' }}>
                  Past
                </Text>
                {past.map((show: any) => <ShowCard key={show._id} show={show} />)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ShowCard({ show }: { show: any }) {
  const router = useRouter();
  const statusColor = STATUS_COLORS[show.status] ?? Colors.textMuted;
  const paymentColor = PAYMENT_COLORS[show.paymentStatus] ?? Colors.textMuted;
  const date = new Date(show.showDate);
  const isUpcoming = date >= new Date();

  return (
    <TouchableOpacity onPress={() => router.push(`/(app)/shows/${show._id}` as any)} style={{
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 14,
      padding: 18,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      {/* Date block */}
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: isUpcoming ? `${Colors.accent}18` : Colors.surface2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
      }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: isUpcoming ? Colors.accent : Colors.textMuted }}>
          {date.getDate()}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>
          {date.toLocaleString('default', { month: 'short' })}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 3 }}>
          {show.name}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 8 }}>
          {show.showTime ? `${show.showTime} · ` : ''}{date.toLocaleDateString('default', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${statusColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: statusColor, textTransform: 'capitalize' }}>
              {show.status}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${paymentColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: paymentColor, textTransform: 'capitalize' }}>
              {show.paymentStatus?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Fee */}
      {show.fee && (
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary }}>
          €{show.fee}
        </Text>
      )}
    </TouchableOpacity>
  );
}
