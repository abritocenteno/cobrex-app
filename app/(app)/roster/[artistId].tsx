import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

function formatMoney(cents: number, currency = 'EUR') {
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
  return `${symbol}${(cents / 100).toLocaleString()}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.green,
  completed: Colors.accentBlue,
  draft: Colors.textMuted,
  postponed: Colors.orange,
};

const PAYMENT_COLORS: Record<string, string> = {
  paid_in_full: Colors.green,
  deposit_paid: Colors.orange,
  unpaid: Colors.accentRed,
  overpaid: Colors.accentPurple,
  refunded: Colors.textMuted,
};

export default function ArtistDetailScreen() {
  const router = useRouter();
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const managerProfile = useQuery(api.manager.myProfile);
  const detail = useQuery(
    api.manager.artistDetail,
    managerProfile?._id && artistId
      ? { managerId: managerProfile._id, artistId: artistId as any }
      : 'skip'
  );
  const removeArtist = useMutation(api.manager.removeArtist);
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    Alert.alert(
      'Remove Artist',
      `Remove ${detail?.artist.name} from your roster? This cannot be undone from the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            try {
              await removeArtist({ artistId: artistId as any });
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to remove artist');
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  if (detail === undefined || managerProfile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (detail === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <FontAwesome name="exclamation-circle" size={40} color={Colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>Not found</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>This artist isn't on your roster.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.accent }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { artist, upcomingShows, recentDeals, ytd, outstanding } = detail;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>{artist.name}</Text>
          {artist.genre ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>{artist.genre}{artist.subGenre ? ` · ${artist.subGenre}` : ''}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 60 }}>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Upcoming</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.accentBlue }}>{upcomingShows.length}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted }}>shows</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>YTD</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.green }}>{formatMoney(ytd)}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted }}>earned</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Due</Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: outstanding > 0 ? Colors.orange : Colors.textMuted }}>{formatMoney(outstanding)}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted }}>outstanding</Text>
          </View>
        </View>

        {/* Artist info */}
        {(artist.location || artist.bio) ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 24 }}>
            {artist.location ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: artist.bio ? 10 : 0 }}>
                <FontAwesome name="map-marker" size={13} color={Colors.textMuted} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{artist.location}</Text>
              </View>
            ) : null}
            {artist.bio ? (
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textPrimary, lineHeight: 20 }} numberOfLines={4}>{artist.bio}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Upcoming Shows */}
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
          Upcoming Shows
        </Text>
        {upcomingShows.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>No upcoming shows</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 28 }}>
            {upcomingShows.map((show: any) => (
              <View key={show._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>{show.name}</Text>
                    {show.venueName ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{show.venueName}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>{formatDate(show.showDate)}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${STATUS_COLORS[show.status] ?? Colors.textMuted}18` }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: STATUS_COLORS[show.status] ?? Colors.textMuted, textTransform: 'capitalize' }}>
                        {show.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Deals */}
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
          Recent Deals
        </Text>
        {recentDeals.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>No deals recorded</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 28 }}>
            {recentDeals.map((deal: any) => (
              <View key={deal._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>
                      {formatMoney(deal.agreedTotal, deal.currency)}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' }}>
                      {deal.dealType.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${PAYMENT_COLORS[deal.paymentStatus] ?? Colors.textMuted}18` }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: PAYMENT_COLORS[deal.paymentStatus] ?? Colors.textMuted, textTransform: 'capitalize' }}>
                      {deal.paymentStatus.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Remove from roster */}
        <TouchableOpacity
          onPress={handleRemove}
          disabled={removing}
          style={{ borderWidth: 1, borderColor: `${Colors.accentRed}40`, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }}
        >
          {removing ? (
            <ActivityIndicator color={Colors.accentRed} size="small" />
          ) : (
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.accentRed }}>Remove from Roster</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
