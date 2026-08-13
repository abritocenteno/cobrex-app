import { useQuery, useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  artist: 'Artist',
  band_member: 'Band Member',
  crew: 'Crew',
  manager: 'Manager',
  tour_manager: 'Tour Manager',
  other: 'Other',
};

const STATUS_DOT: Record<string, string> = {
  planning: Colors.textMuted,
  confirmed: Colors.accent,
  travelling: Colors.green,
  completed: Colors.textMuted,
  cancelled: Colors.accentRed,
};

export default function PartyManifestScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const profile = useQuery(api.users.myProfile);
  const party = useQuery(api.travel.getTourParty, { id });
  const travelers = useQuery(api.travel.listTravelers, { tourPartyId: id });
  const warnings = useQuery(
    api.travel.getVisaWarnings,
    party?.artistId ? { artistId: party.artistId } : 'skip'
  );

  const removeTraveler = useMutation(api.travel.removeTraveler);
  const triggerAlerts = useMutation(api.travelAlerts.triggerTravelAlerts);
  const [alerting, setAlerting] = useState(false);

  const role = profile?.role ?? 'artist';

  const handleSendAlerts = async () => {
    setAlerting(true);
    try {
      await triggerAlerts({});
      Alert.alert('Alerts Queued', 'Travel expiry alerts are being sent to relevant team members.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setAlerting(false);
    }
  };

  const handleRemoveTraveler = (travelerId: Id<'travelers'>, name: string) => {
    Alert.alert('Remove Traveler', `Remove ${name} from this party?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTraveler({ id: travelerId });
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Something went wrong');
          }
        },
      },
    ]);
  };

  if (party === undefined || travelers === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (party === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.textMuted }}>Tour party not found.</Text>
      </View>
    );
  }

  const passportWarningIds = new Set((warnings?.passportWarnings ?? []).map((w) => String(w.travelerId)));
  const visaWarningIds = new Set((warnings?.unresolvedVisas ?? []).map((w) => String(w.travelerId)));

  const statusColor = STATUS_DOT[party.status] ?? Colors.textMuted;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 28, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
            <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }} numberOfLines={1}>
            {party.name}
          </Text>
          {role === 'manager' && (
            <TouchableOpacity
              onPress={handleSendAlerts}
              disabled={alerting}
              style={{ padding: 8, marginLeft: 4 }}
            >
              {alerting
                ? <ActivityIndicator size="small" color={Colors.orange} />
                : <FontAwesome name="bell" size={17} color={Colors.orange} />}
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 32 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusColor }} />
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: statusColor }}>
            {party.status.charAt(0).toUpperCase() + party.status.slice(1)}
          </Text>
          {party.departureDate && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
              · Departs {new Date(party.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {/* Warning strip */}
        {((warnings?.passportWarnings.length ?? 0) > 0 || (warnings?.unresolvedVisas.length ?? 0) > 0) && (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/travel/${partyId}/visa-tracker` as any)}
            style={{
              backgroundColor: `${Colors.orange}15`,
              borderWidth: 1,
              borderColor: `${Colors.orange}40`,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <FontAwesome name="exclamation-triangle" size={16} color={Colors.orange} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.orange }}>Action Required</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                {(warnings?.passportWarnings.length ?? 0) > 0 && `${warnings!.passportWarnings.length} passport issue${warnings!.passportWarnings.length > 1 ? 's' : ''}`}
                {(warnings?.passportWarnings.length ?? 0) > 0 && (warnings?.unresolvedVisas.length ?? 0) > 0 && ' · '}
                {(warnings?.unresolvedVisas.length ?? 0) > 0 && `${warnings!.unresolvedVisas.length} unresolved visa${warnings!.unresolvedVisas.length > 1 ? 's' : ''}`}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color={Colors.orange} />
          </TouchableOpacity>
        )}

        {/* Traveler manifest */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 }}>
            Travelers ({travelers.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/travel/${partyId}/traveler-add` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 }}
          >
            <FontAwesome name="plus" size={11} color={Colors.accent} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.accent }}>Add</Text>
          </TouchableOpacity>
        </View>

        {travelers.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 28, alignItems: 'center' }}>
            <FontAwesome name="user-plus" size={28} color={Colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textMuted }}>No travelers yet</Text>
          </View>
        ) : (
          travelers.map((traveler) => {
            const hasPassportIssue = passportWarningIds.has(String(traveler._id));
            const hasVisaIssue = visaWarningIds.has(String(traveler._id));
            return (
              <View
                key={traveler._id}
                style={{
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: (hasPassportIssue || hasVisaIssue) ? `${Colors.orange}40` : Colors.border,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${Colors.accent}20`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.accent }}>
                    {traveler.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{traveler.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {ROLE_LABELS[traveler.role] ?? traveler.role}
                    </Text>
                    {hasPassportIssue && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <FontAwesome name="id-card-o" size={10} color={Colors.orange} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.orange }}>Passport</Text>
                      </View>
                    )}
                    {hasVisaIssue && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <FontAwesome name="globe" size={10} color={Colors.orange} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.orange }}>Visa</Text>
                      </View>
                    )}
                  </View>
                </View>
                {role === 'manager' && (
                  <TouchableOpacity
                    onPress={() => handleRemoveTraveler(traveler._id, traveler.name)}
                    style={{ padding: 8 }}
                  >
                    <FontAwesome name="trash-o" size={15} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Section links */}
        <View style={{ marginTop: 12, gap: 8 }}>
          {[
            { icon: 'globe', label: 'Visa Tracker', sub: 'Immigration & visa cases', route: 'visa-tracker' },
            { icon: 'plane', label: 'Flights', sub: 'Flight bookings & check-in', route: 'flights' },
            { icon: 'building', label: 'Hotels', sub: 'Accommodation & rooming list', route: 'hotels' },
            { icon: 'car', label: 'Transport', sub: 'Transfers & ground logistics', route: 'transport' },
            { icon: 'calendar', label: 'Itinerary', sub: 'Full trip timeline', route: 'itinerary' },
            { icon: 'file-text-o', label: 'Documents', sub: 'Passports & travel docs', route: 'doc-add' },
          ].map(({ icon, label, sub, route }) => (
            <TouchableOpacity
              key={route}
              onPress={() => router.push(`/(app)/travel/${partyId}/${route}` as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome name={icon as any} size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{label}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{sub}</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        {party.notes ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginTop: 12 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Notes
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textPrimary, lineHeight: 20 }}>
              {party.notes}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
