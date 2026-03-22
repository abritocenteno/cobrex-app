import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/colors';

function formatMoney(cents: number) {
  return `€${(cents / 100).toLocaleString()}`;
}

export default function RosterScreen() {
  const profile = useQuery(api.users.myProfile);
  const managerProfile = useQuery(
    api.manager.myProfile
  );
  const roster = useQuery(
    api.manager.roster,
    managerProfile?._id ? { managerId: managerProfile._id } : 'skip'
  );

  if (profile === undefined || managerProfile === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Roster</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {(roster ?? []).length} artist{(roster ?? []).length !== 1 ? 's' : ''} on your roster
        </Text>

        {/* Manager info */}
        {managerProfile?.companyName && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🎯</Text>
            <View>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>{managerProfile.companyName}</Text>
              {managerProfile.commissionRate && (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>Commission: {managerProfile.commissionRate}%</Text>
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }}>
        {roster === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : roster.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>👥</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No artists yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Your roster is empty. Invite artists to get started.</Text>
          </View>
        ) : (
          roster.map((artist: any) => (
            <View key={artist._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 12 }}>
              {/* Artist header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <Text style={{ fontSize: 22 }}>🎤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 2 }}>{artist.name}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' }}>{artist.role ?? 'Artist'}</Text>
                </View>
                {artist.isActive && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.green}18` }}>
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.green }}>Active</Text>
                  </View>
                )}
              </View>

              {/* Stats row */}
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

              {/* Next show */}
              {artist.nextShowDate && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                    Next show: <Text style={{ color: Colors.textPrimary, fontFamily: 'DMSans_500Medium' }}>{new Date(artist.nextShowDate).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
