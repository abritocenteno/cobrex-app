import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type RiderField =
  | 'techRiderReceived'
  | 'stagePlotReceived'
  | 'inputListReceived'
  | 'hospitalityRiderReceived'
  | 'cateringConfirmed'
  | 'accessibilitiesConfirmed';

const RIDER_CHIPS: { label: string; field: RiderField }[] = [
  { label: 'Tech Rider', field: 'techRiderReceived' },
  { label: 'Stage Plot', field: 'stagePlotReceived' },
  { label: 'Input List', field: 'inputListReceived' },
  { label: 'Hospitality', field: 'hospitalityRiderReceived' },
  { label: 'Catering', field: 'cateringConfirmed' },
  { label: 'Accessibility', field: 'accessibilitiesConfirmed' },
];

export default function VenueRequestsScreen() {
  const router = useRouter();
  const venueProfile = useQuery(api.venue.myProfile);
  const upcomingShows = useQuery(
    api.venue.upcomingShows,
    venueProfile?._id ? { venueProfileId: venueProfile._id } : 'skip'
  );
  const pastShowsData = useQuery(
    api.venue.pastShows,
    venueProfile?._id ? { venueProfileId: venueProfile._id } : 'skip'
  );
  const [pastExpanded, setPastExpanded] = useState(false);
  const confirmShow = useMutation(api.venue.confirmShow);
  const unconfirmShow = useMutation(api.venue.unconfirmShow);
  const updateRiderStatus = useMutation(api.venue.updateRiderStatus);
  const recordSettlement = useMutation(api.venue.recordSettlement);

  const [confirming, setConfirming] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null); // `${vsId}:${field}`
  const [settlementFormId, setSettlementFormId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [ticketsInput, setTicketsInput] = useState('');
  const [savingSettlement, setSavingSettlement] = useState(false);

  const handleConfirm = async (vsId: string, currentlyConfirmed: boolean) => {
    setConfirming(vsId);
    try {
      if (currentlyConfirmed) {
        await unconfirmShow({ id: vsId as any });
      } else {
        await confirmShow({ id: vsId as any });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setConfirming(null);
    }
  };

  const handleToggleRider = async (vsId: string, field: RiderField, current: boolean) => {
    const key = `${vsId}:${field}`;
    setToggling(key);
    try {
      await updateRiderStatus({ id: vsId as any, field, value: !current });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setToggling(null);
    }
  };

  const openSettlementForm = (vsId: string, vs: any) => {
    setSettlementFormId(vsId);
    setAmountInput(vs.settlementAmount != null ? String(vs.settlementAmount / 100) : '');
    setTicketsInput(vs.ticketsSold != null ? String(vs.ticketsSold) : '');
  };

  const handleSaveSettlement = async () => {
    if (!settlementFormId) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid amount', 'Please enter a valid number');
      return;
    }
    const tickets = ticketsInput.trim() ? parseInt(ticketsInput) : undefined;
    setSavingSettlement(true);
    try {
      await recordSettlement({
        id: settlementFormId as any,
        amount: Math.round(amount * 100),
        ticketsSold: tickets,
      });
      setSettlementFormId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong');
    } finally {
      setSavingSettlement(false);
    }
  };

  if (venueProfile === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>
          {venueProfile?.name ?? 'Venue'}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {(upcomingShows ?? []).length} upcoming shows
          {venueProfile?.capacity ? ` · Cap: ${venueProfile.capacity}` : ''}
          {venueProfile?.city ? ` · ${venueProfile.city}` : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {upcomingShows === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : upcomingShows.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="building" size={40} color={Colors.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No upcoming shows</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
              Upcoming shows linked to your venue will appear here
            </Text>
          </View>
        ) : (
          upcomingShows.map((vs: any) => {
            const show = vs.show;
            const date = new Date(show.showDate + 'T12:00:00');
            const isConfirming = confirming === vs._id;

            return (
              <View key={vs._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>

                {/* Show header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.accent }}>{date.getDate()}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>
                      {date.toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 2 }}>{show.name}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {show.artistName ? show.artistName : ''}
                      {show.showTime ? `${show.artistName ? ' · ' : ''}Show: ${show.showTime}` : ''}
                      {show.doorsTime ? ` · Doors: ${show.doorsTime}` : ''}
                    </Text>
                    <TouchableOpacity onPress={() => router.push(`/(app)/venue-shows/${vs._id}` as any)} style={{ marginTop: 4 }}>
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent }}>Details →</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Confirm / Unconfirm button */}
                  <TouchableOpacity
                    onPress={() => handleConfirm(vs._id, vs.confirmedByVenue)}
                    disabled={isConfirming}
                    style={vs.confirmedByVenue
                      ? { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: `${Colors.green}18`, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: `${Colors.green}30` }
                      : { backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    {isConfirming ? (
                      <ActivityIndicator size="small" color={vs.confirmedByVenue ? Colors.green : '#000'} />
                    ) : vs.confirmedByVenue ? (
                      <>
                        <FontAwesome name="check" size={10} color={Colors.green} />
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.green }}>Confirmed</Text>
                      </>
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#000' }}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Rider checklist chips */}
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Documents</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {RIDER_CHIPS.map((item) => {
                    const received = !!vs[item.field];
                    const key = `${vs._id}:${item.field}`;
                    const isToggling = toggling === key;
                    return (
                      <TouchableOpacity
                        key={item.field}
                        onPress={() => handleToggleRider(vs._id, item.field, received)}
                        disabled={isToggling}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 20,
                          backgroundColor: received ? `${Colors.green}18` : Colors.surface2,
                          borderWidth: 1,
                          borderColor: received ? `${Colors.green}40` : Colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          minWidth: 44,
                          justifyContent: 'center',
                        }}
                      >
                        {isToggling ? (
                          <ActivityIndicator size="small" color={received ? Colors.green : Colors.textMuted} style={{ width: 18, height: 18 }} />
                        ) : (
                          <>
                            {received && <FontAwesome name="check" size={9} color={Colors.green} />}
                            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: received ? Colors.green : Colors.textMuted }}>
                              {item.label}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Settlement section */}
                <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }}>
                  {vs.settlementPaid ? (
                    <TouchableOpacity
                      onPress={() => openSettlementForm(vs._id, vs)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <View>
                        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.green }}>
                          <FontAwesome name="check" size={11} color={Colors.green} /> Settlement recorded
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                          €{(vs.settlementAmount / 100).toLocaleString()}
                          {vs.ticketsSold ? ` · ${vs.ticketsSold} tickets` : ''}
                          {'  ·  '}
                          <Text style={{ color: Colors.accent }}>Edit</Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => openSettlementForm(vs._id, vs)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <FontAwesome name="money" size={13} color={Colors.textMuted} />
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.accent }}>Record Settlement</Text>
                    </TouchableOpacity>
                  )}

                  {/* Inline settlement form */}
                  {settlementFormId === vs._id && (
                    <View style={{ marginTop: 12, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14, gap: 10 }}>
                      <TextInput
                        value={amountInput}
                        onChangeText={setAmountInput}
                        placeholder="Amount (€)"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="decimal-pad"
                        style={{ backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
                      />
                      <TextInput
                        value={ticketsInput}
                        onChangeText={setTicketsInput}
                        placeholder="Tickets sold (optional)"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="number-pad"
                        style={{ backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => setSettlementFormId(null)}
                          style={{ flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
                        >
                          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveSettlement}
                          disabled={savingSettlement}
                          style={{ flex: 2, paddingVertical: 11, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center' }}
                        >
                          {savingSettlement
                            ? <ActivityIndicator color="#000" size="small" />
                            : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#000' }}>Save Settlement</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

              </View>
            );
          })
        )}
        {/* Past Shows */}
        {(pastShowsData ?? []).length > 0 && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setPastExpanded((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 4 }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textMuted, flex: 1 }}>
                Past Shows ({pastShowsData!.length})
              </Text>
              <FontAwesome name={pastExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
            </TouchableOpacity>

            {pastExpanded && (pastShowsData ?? []).map((vs: any) => {
              const show = vs.show;
              const date = new Date(show.showDate + 'T12:00:00');
              return (
                <TouchableOpacity
                  key={vs._id}
                  onPress={() => router.push(`/(app)/venue-shows/${vs._id}` as any)}
                  style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
                >
                  <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textMuted }}>{date.getDate()}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase' }}>
                      {date.toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{show.name}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                      {show.artistName ?? ''}
                      {vs.settlementPaid ? ` · €${((vs.settlementAmount ?? 0) / 100).toLocaleString()}` : ''}
                    </Text>
                  </View>
                  {vs.confirmedByVenue && (
                    <FontAwesome name="check-circle" size={14} color={Colors.green} style={{ marginRight: 8 }} />
                  )}
                  <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
