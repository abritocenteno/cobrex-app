import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function VenueRequestsScreen() {
  const profile = useQuery(api.users.myProfile);
  const venueProfile = useQuery(api.venue.myProfile);
  const upcomingShows = useQuery(
    api.venue.upcomingShows,
    venueProfile?._id ? { venueProfileId: venueProfile._id } : 'skip'
  );
  const confirmShow = useMutation(api.venue.confirmShow);

  if (profile === undefined || venueProfile === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>
          {venueProfile?.name ?? 'Venue'}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {(upcomingShows ?? []).length} upcoming shows
          {venueProfile?.capacity ? ` · Capacity: ${venueProfile.capacity}` : ''}
          {venueProfile?.city ? ` · ${venueProfile.city}` : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }}>
        {upcomingShows === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : upcomingShows.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🏛️</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No upcoming shows</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Upcoming shows linked to your venue will appear here</Text>
          </View>
        ) : (
          upcomingShows.map((vs: any) => {
            const show = vs.show;
            const date = new Date(show.showDate);
            return (
              <View key={vs._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 12 }}>
                {/* Show header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.accent }}>{date.getDate()}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>{date.toLocaleString('default', { month: 'short' })}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 2 }}>{show.name}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {show.showTime ? `Show: ${show.showTime}` : ''}
                      {show.doorsTime ? ` · Doors: ${show.doorsTime}` : ''}
                    </Text>
                  </View>
                  {!vs.confirmedByVenue ? (
                    <TouchableOpacity
                      onPress={() => confirmShow({ id: vs._id })}
                      style={{ backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                    >
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#000' }}>Confirm</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.green}18` }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.green }}>✓ Confirmed</Text>
                    </View>
                  )}
                </View>

                {/* Rider checklist */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Tech Rider', received: vs.techRiderReceived },
                    { label: 'Stage Plot', received: vs.stagePlotReceived },
                    { label: 'Input List', received: vs.inputListReceived },
                    { label: 'Hospitality', received: vs.hospitalityRiderReceived },
                    { label: 'Settlement', received: vs.settlementPaid },
                  ].map((item) => (
                    <View key={item.label} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: item.received ? `${Colors.green}18` : Colors.surface2, borderWidth: 1, borderColor: item.received ? `${Colors.green}40` : Colors.border }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: item.received ? Colors.green : Colors.textMuted }}>
                        {item.received ? '✓ ' : ''}{item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Settlement info */}
                {vs.settlementAmount && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      Settlement: <Text style={{ color: Colors.textPrimary, fontFamily: 'DMSans_600SemiBold' }}>€{(vs.settlementAmount / 100).toLocaleString()}</Text>
                      {vs.ticketsSold ? ` · ${vs.ticketsSold} tickets sold` : ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
