import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

function formatMoney(cents: number) {
  return `€${(cents / 100).toLocaleString()}`;
}

export default function RosterScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const managerProfile = useQuery(api.manager.myProfile);
  const roster = useQuery(
    api.manager.roster,
    managerProfile?._id ? { managerId: managerProfile._id } : 'skip'
  );
  const invites = useQuery(
    api.rosterInvites.forManager,
    managerProfile?._id ? { managerId: managerProfile._id } : 'skip'
  );
  const respond = useMutation(api.rosterInvites.respond);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const pendingIncoming = (invites ?? []).filter(
    (inv: any) => inv.direction === 'artist_to_manager' && inv.status === 'pending'
  );
  const pendingOutgoing = (invites ?? []).filter(
    (inv: any) => inv.direction === 'manager_to_artist' && inv.status === 'pending'
  );

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingId(inviteId);
    try {
      await respond({ inviteId: inviteId as any, accept });
    } finally {
      setRespondingId(null);
    }
  };

  if (profile === undefined || managerProfile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 0, flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Roster</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
            {(roster ?? []).length} artist{(roster ?? []).length !== 1 ? 's' : ''} signed
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/roster/invite' as any)}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <FontAwesome name="plus" size={12} color="#000" />
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Invite Artist</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }}>

        {/* Manager info */}
        {managerProfile?.companyName && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="bullseye" size={24} color={Colors.accent} style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>{managerProfile.companyName}</Text>
              {managerProfile.commissionRate ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>Commission: {managerProfile.commissionRate}%</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Incoming requests from artists */}
        {pendingIncoming.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
              Artist Requests
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.accent }}> · {pendingIncoming.length}</Text>
            </Text>
            {pendingIncoming.map((inv: any) => (
              <View key={inv._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: `${Colors.accent}40`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <FontAwesome name="microphone" size={18} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{inv.artist?.name ?? 'Unknown Artist'}</Text>
                    {inv.message ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }} numberOfLines={2}>{inv.message}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleRespond(inv._id, true)}
                    disabled={respondingId === inv._id}
                    style={{ flex: 1, backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    {respondingId === inv._id
                      ? <ActivityIndicator color="#000" size="small" />
                      : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Accept</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRespond(inv._id, false)}
                    disabled={respondingId === inv._id}
                    style={{ flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending outgoing invites */}
        {pendingOutgoing.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
              Pending Invites
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}> · {pendingOutgoing.length}</Text>
            </Text>
            {pendingOutgoing.map((inv: any) => (
              <View key={inv._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <FontAwesome name="microphone" size={16} color={Colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>{inv.artist?.name ?? 'Unknown'}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>Awaiting response</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.orange}18` }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.orange }}>Pending</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Signed roster */}
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>Signed Artists</Text>
        {roster === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 20 }} />
        ) : roster.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="users" size={40} color={Colors.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No artists yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 }}>
              Invite artists to your roster to get started.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/roster/invite' as any)}
              style={{ backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Invite Artist</Text>
            </TouchableOpacity>
          </View>
        ) : (
          roster.map((artist: any) => (
            <View key={artist._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <FontAwesome name="microphone" size={22} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 2 }}>{artist.name}</Text>
                  {artist.genre ? (
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{artist.genre}</Text>
                  ) : null}
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.green}18` }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.green }}>Signed</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Upcoming</Text>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.accentBlue }}>{artist.upcomingShowCount ?? 0}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted }}>shows</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>YTD</Text>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.green }}>{formatMoney(artist.ytd ?? 0)}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted }}>earned</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Outstanding</Text>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: artist.outstanding > 0 ? Colors.orange : Colors.textMuted }}>{formatMoney(artist.outstanding ?? 0)}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted }}>unpaid</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
