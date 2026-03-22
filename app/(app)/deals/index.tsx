import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import EmptyState from '../../../src/components/EmptyState';
import { SkeletonList } from '../../../src/components/Skeleton';
import { useState } from 'react';

const DEAL_TYPE_ICONS: Record<string, string> = {
  live: '🎤', session: '🎙️', sync: '🎬', sponsorship: '🤝', other: '📄',
};

const PAYMENT_COLORS: Record<string, string> = {
  paid_in_full: Colors.green,
  deposit_paid: Colors.orange,
  unpaid: Colors.accentRed,
  overpaid: Colors.accentPurple,
  refunded: Colors.textMuted,
};

const FILTERS = ['all', 'live', 'session', 'sync', 'sponsorship', 'other'];

export default function DealsScreen() {
  const profile = useQuery(api.users.myProfile);
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const deals = useQuery(
    api.deals.list,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  if (profile !== undefined && !profile?.artistId) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🤝</Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>Artist feature only</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>This section is only available for artist accounts.</Text>
      </View>
    );
  }

  const filtered = (deals ?? []).filter((d: any) =>
    filter === 'all' ? true : d.dealType === filter
  );

  const totalValue = filtered.reduce((sum: number, d: any) => sum + (d.agreedTotal ?? 0), 0);
  const totalReceived = filtered.reduce((sum: number, d: any) => sum + (d.actualReceived ?? 0), 0);
  const unpaidCount = filtered.filter((d: any) => d.paymentStatus === 'unpaid').length;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Deals</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1 }}>
            {filtered.length} deals · {unpaidCount} unpaid
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/deals/add')}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add Deal</Text>
          </TouchableOpacity>
        </View>

        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>Agreed</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>
              €{(totalValue / 100).toLocaleString()}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>Received</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.green }}>
              €{(totalReceived / 100).toLocaleString()}
            </Text>
          </View>
        </View>

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
                  {f === 'all' ? 'All' : `${DEAL_TYPE_ICONS[f]} ${f}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {deals === undefined ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="��" title="No deals found" message={filter === 'all' ? 'Add your first deal to track payments' : `No ${filter} deals`} actionLabel={filter === 'all' ? '+ Add Deal' : undefined} onAction={filter === 'all' ? () => router.push('/(app)/deals/add') : undefined} />
        ) : (
          filtered.map((deal: any) => {
            const paymentColor = PAYMENT_COLORS[deal.paymentStatus] ?? Colors.textMuted;
            const pct = deal.agreedTotal > 0 ? Math.min(100, Math.round((deal.actualReceived ?? 0) / deal.agreedTotal * 100)) : 0;
            return (
              <TouchableOpacity key={deal._id} onPress={() => router.push(`/(app)/deals/${deal._id}` as any)} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 18, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{DEAL_TYPE_ICONS[deal.dealType] ?? '📄'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2, textTransform: 'capitalize' }}>
                      {deal.dealType} Deal
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {deal.currency} · {new Date(deal._creationTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary }}>
                      €{(deal.agreedTotal / 100).toLocaleString()}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${paymentColor}18`, marginTop: 4 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: paymentColor }}>
                        {deal.paymentStatus?.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ height: 4, backgroundColor: Colors.surface2, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: 4, width: `${pct}%`, backgroundColor: pct === 100 ? Colors.green : Colors.accent, borderRadius: 2 }} />
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 6 }}>
                  €{((deal.actualReceived ?? 0) / 100).toLocaleString()} received · {pct}%
                </Text>

                {deal.notes && (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 10, fontStyle: 'italic' }}>
                    {deal.notes}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
