import { useQuery, useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

const VISA_STATUSES = [
  { value: 'not_required', label: 'Not Required', color: Colors.textMuted },
  { value: 'review_required', label: 'Review Required', color: Colors.orange },
  { value: 'documents_requested', label: 'Docs Requested', color: Colors.orange },
  { value: 'application_prepared', label: 'App Prepared', color: Colors.accent },
  { value: 'appointment_booked', label: 'Appt Booked', color: Colors.accent },
  { value: 'submitted', label: 'Submitted', color: Colors.accent },
  { value: 'under_review', label: 'Under Review', color: Colors.accent },
  { value: 'approved', label: 'Approved', color: Colors.green },
  { value: 'refused', label: 'Refused', color: Colors.accentRed },
  { value: 'expired', label: 'Expired', color: Colors.accentRed },
];

const STATUS_MAP = Object.fromEntries(VISA_STATUSES.map((s) => [s.value, s]));

const PERMIT_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'applied', label: 'Applied' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

function VisaStatusBadge({ status }: { status: string }) {
  const meta = STATUS_MAP[status] ?? { label: status, color: Colors.textMuted };
  return (
    <View style={{ backgroundColor: `${meta.color}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${meta.color}40` }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: meta.color }}>{meta.label}</Text>
    </View>
  );
}

function VisaCaseRow({ vc, updateVisa, onStatusCycle, onRemove }: { vc: any; updateVisa: any; onStatusCycle: (id: Id<'visaCases'>, status: string) => void; onRemove: (id: Id<'visaCases'>, country: string) => void }) {
  const [permitExpanded, setPermitExpanded] = useState(false);
  const [permitStatus, setPermitStatus] = useState(vc.workPermitStatus ?? '');
  const [permitSponsor, setPermitSponsor] = useState(vc.workPermitSponsor ?? '');
  const [permitDeadline, setPermitDeadline] = useState(
    vc.workPermitDeadline ? new Date(vc.workPermitDeadline).toISOString().split('T')[0] : ''
  );
  const [savingPermit, setSavingPermit] = useState(false);

  const handleToggleWorkPermit = async () => {
    try {
      await updateVisa({ id: vc._id, workPermitRequired: !vc.workPermitRequired });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not update');
    }
  };

  const handleSavePermit = async () => {
    setSavingPermit(true);
    try {
      const dl = permitDeadline.trim()
        ? new Date(permitDeadline.trim() + 'T12:00:00').getTime()
        : undefined;
      await updateVisa({
        id: vc._id,
        workPermitStatus: permitStatus || undefined,
        workPermitSponsor: permitSponsor.trim() || undefined,
        workPermitDeadline: isNaN(dl as number) ? undefined : dl,
      });
      setPermitExpanded(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save');
    } finally {
      setSavingPermit(false);
    }
  };

  const permitStatusMeta = PERMIT_STATUSES.find((s) => s.value === vc.workPermitStatus);

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
      {/* Main row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 }}>
        <FontAwesome name="globe" size={14} color={Colors.textMuted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary }}>
            {vc.destinationCountry}
          </Text>
          {vc.visaType && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>{vc.visaType}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onStatusCycle(vc._id, vc.status)}>
          <VisaStatusBadge status={vc.status} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRemove(vc._id, vc.destinationCountry)} style={{ padding: 4 }}>
          <FontAwesome name="trash-o" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Work permit toggle row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingLeft: 24, gap: 8 }}>
        <TouchableOpacity onPress={handleToggleWorkPermit} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{
            width: 18, height: 18, borderRadius: 4,
            backgroundColor: vc.workPermitRequired ? Colors.accent : 'transparent',
            borderWidth: 1, borderColor: vc.workPermitRequired ? Colors.accent : Colors.border,
            justifyContent: 'center', alignItems: 'center',
          }}>
            {vc.workPermitRequired && <FontAwesome name="check" size={10} color="#000" />}
          </View>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>Work Permit</Text>
          {vc.workPermitRequired && permitStatusMeta && (
            <View style={{ backgroundColor: `${Colors.accent}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: `${Colors.accent}30` }}>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: Colors.accent }}>{permitStatusMeta.label}</Text>
            </View>
          )}
        </TouchableOpacity>
        {vc.workPermitRequired && (
          <TouchableOpacity
            onPress={() => setPermitExpanded(!permitExpanded)}
            style={{ marginLeft: 'auto' }}
          >
            <FontAwesome name={permitExpanded ? 'chevron-up' : 'pencil'} size={11} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Work permit detail editor */}
      {vc.workPermitRequired && permitExpanded && (
        <View style={{ backgroundColor: Colors.surface2, borderRadius: 10, padding: 12, marginBottom: 10, marginLeft: 24, marginRight: 4 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Work Permit Details
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PERMIT_STATUSES.map((ps) => (
              <TouchableOpacity
                key={ps.value}
                onPress={() => setPermitStatus(ps.value)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: permitStatus === ps.value ? Colors.accent : Colors.surface, borderWidth: 1, borderColor: permitStatus === ps.value ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: permitStatus === ps.value ? '#000' : Colors.textMuted }}>{ps.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={permitSponsor}
            onChangeText={setPermitSponsor}
            placeholder="Sponsoring organization"
            placeholderTextColor={Colors.textMuted}
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'DMSans_400Regular' as const, fontSize: 13, color: Colors.textPrimary, marginBottom: 8 }}
          />
          <TextInput
            value={permitDeadline}
            onChangeText={setPermitDeadline}
            placeholder="Application deadline (YYYY-MM-DD)"
            placeholderTextColor={Colors.textMuted}
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'DMSans_400Regular' as const, fontSize: 13, color: Colors.textPrimary, marginBottom: 10 }}
          />
          <TouchableOpacity
            onPress={handleSavePermit}
            disabled={savingPermit}
            style={{ backgroundColor: Colors.accent, borderRadius: 8, paddingVertical: 9, alignItems: 'center' }}
          >
            {savingPermit
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Save Permit Details</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TravelerVisaSection({ traveler, partyId }: { traveler: any; partyId: string }) {
  const visaCases = useQuery(api.travel.listVisaCases, { travelerId: traveler._id });
  const addVisa = useMutation(api.travel.addVisaCase);
  const updateVisa = useMutation(api.travel.updateVisaCase).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listVisaCases, { travelerId: traveler._id });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listVisaCases,
        { travelerId: traveler._id },
        current.map((vc) => (vc._id === args.id ? { ...vc, ...args } : vc))
      );
    }
  );
  const removeVisa = useMutation(api.travel.removeVisaCase).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listVisaCases, { travelerId: traveler._id });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listVisaCases,
        { travelerId: traveler._id },
        current.filter((vc) => vc._id !== args.id)
      );
    }
  );
  const [expanded, setExpanded] = useState(false);
  const [addingCountry, setAddingCountry] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddVisa = async () => {
    if (!addingCountry.trim()) return;
    setSaving(true);
    try {
      await addVisa({
        travelerId: traveler._id,
        destinationCountry: addingCountry.trim(),
        status: 'review_required',
      });
      setAddingCountry('');
      setShowAdd(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusCycle = (visaId: Id<'visaCases'>, currentStatus: string) => {
    const idx = VISA_STATUSES.findIndex((s) => s.value === currentStatus);
    const nextIdx = (idx + 1) % VISA_STATUSES.length;
    const nextStatus = VISA_STATUSES[nextIdx].value;
    Alert.alert('Update Status', `Change to "${VISA_STATUSES[nextIdx].label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => updateVisa({ id: visaId, status: nextStatus }) },
    ]);
  };

  const handleRemove = (visaId: Id<'visaCases'>, country: string) => {
    Alert.alert('Remove', `Remove ${country} visa case?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeVisa({ id: visaId }) },
    ]);
  };

  const hasPendingIssue = (visaCases ?? []).some(
    (vc) => !['approved', 'not_required'].includes(vc.status)
  );

  return (
    <View style={{
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: hasPendingIssue ? `${Colors.orange}40` : Colors.border,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${Colors.accent}20`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.accent }}>
            {traveler.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{traveler.name}</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
            {(visaCases ?? []).length} visa case{(visaCases ?? []).length !== 1 ? 's' : ''}
            {hasPendingIssue && ' · Action needed'}
          </Text>
        </View>
        {hasPendingIssue && <FontAwesome name="exclamation-triangle" size={13} color={Colors.orange} style={{ marginRight: 8 }} />}
        <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, padding: 14 }}>
          {visaCases === undefined ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : visaCases.length === 0 ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 12 }}>
              No visa cases added yet.
            </Text>
          ) : (
            visaCases.map((vc) => (
              <VisaCaseRow
                key={vc._id}
                vc={vc}
                updateVisa={updateVisa}
                onStatusCycle={handleStatusCycle}
                onRemove={handleRemove}
              />
            ))
          )}

          {showAdd ? (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={addingCountry}
                  onChangeText={setAddingCountry}
                  placeholder="Country name..."
                  placeholderTextColor={Colors.textMuted}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.surface2,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 13,
                    color: Colors.textPrimary,
                  }}
                />
                <TouchableOpacity
                  onPress={handleAddVisa}
                  disabled={saving || !addingCountry.trim()}
                  style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' }}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#000" />
                    : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Add</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={{ justifyContent: 'center', paddingHorizontal: 8 }}>
                  <FontAwesome name="times" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {/* Country quick-pick */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {['USA', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Canada', 'Brazil'].map((country) => (
                  <TouchableOpacity
                    key={country}
                    onPress={() => setAddingCountry(country)}
                    style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>{country}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAdd(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}
            >
              <FontAwesome name="plus" size={12} color={Colors.accent} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.accent }}>Add Visa Case</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function VisaTrackerScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const party = useQuery(api.travel.getTourParty, { id });
  const travelers = useQuery(api.travel.listTravelers, { tourPartyId: id });
  const warnings = useQuery(
    api.travel.getVisaWarnings,
    party?.artistId ? { artistId: party.artistId } : 'skip'
  );

  if (party === undefined || travelers === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  const totalWarnings = (warnings?.passportWarnings.length ?? 0) + (warnings?.unresolvedVisas.length ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Visa Tracker</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>
            {party?.name ?? ''}
          </Text>
        </View>
        {totalWarnings > 0 && (
          <View style={{ backgroundColor: `${Colors.orange}20`, borderWidth: 1, borderColor: `${Colors.orange}40`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.orange }}>
              {totalWarnings} issue{totalWarnings > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {/* Passport warnings */}
        {(warnings?.passportWarnings.length ?? 0) > 0 && (
          <View style={{ backgroundColor: `${Colors.orange}12`, borderWidth: 1, borderColor: `${Colors.orange}30`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.orange, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Passport Issues
            </Text>
            {warnings!.passportWarnings.map((w, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <FontAwesome name="id-card-o" size={12} color={Colors.orange} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textPrimary, flex: 1 }}>{w.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Traveler sections */}
        {travelers.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 28, alignItems: 'center' }}>
            <FontAwesome name="users" size={28} color={Colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textMuted }}>No travelers in this party yet</Text>
          </View>
        ) : (
          travelers.map((traveler) => (
            <TravelerVisaSection key={traveler._id} traveler={traveler} partyId={partyId} />
          ))
        )}

        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginTop: 4 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, lineHeight: 18 }}>
            Tap a status badge on any visa case to cycle it to the next stage. Tap a traveler row to expand their visa cases.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
