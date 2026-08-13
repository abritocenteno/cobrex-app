import { useQuery, useMutation } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

const TRANSPORT_TYPES = [
  { value: 'airport_transfer', label: 'Airport Transfer', icon: 'plane' },
  { value: 'hotel_to_venue', label: 'Hotel → Venue', icon: 'building' },
  { value: 'venue_to_hotel', label: 'Venue → Hotel', icon: 'home' },
  { value: 'other', label: 'Other', icon: 'car' },
];

const TRANSPORT_STATUS_META: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: Colors.accent },
  driver_assigned: { label: 'Driver Assigned', color: Colors.accent },
  driver_en_route: { label: 'En Route', color: Colors.green },
  driver_arrived: { label: 'Driver Arrived', color: Colors.green },
  in_transit: { label: 'In Transit', color: Colors.green },
  delayed: { label: 'Delayed', color: Colors.orange },
  arrived: { label: 'Arrived', color: Colors.green },
  completed: { label: 'Completed', color: Colors.textMuted },
  cancelled: { label: 'Cancelled', color: Colors.accentRed },
};

const TRANSPORT_STATUSES = Object.keys(TRANSPORT_STATUS_META);

function fmt(ts: number) {
  return new Date(ts).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function parseLocalDatetime(str: string): number | null {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function AddTransportForm({ tourPartyId, onDone }: { tourPartyId: Id<'tourParties'>; onDone: () => void }) {
  const addJob = useMutation(api.travel.addTransportJob);
  const [type, setType] = useState('airport_transfer');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [scheduledPickupAt, setScheduledPickupAt] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  const [passengerCount, setPassengerCount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) { Alert.alert('Validation', 'Pickup and dropoff locations are required'); return; }
    const ts = parseLocalDatetime(scheduledPickupAt);
    if (!ts) { Alert.alert('Validation', 'Enter a valid pickup date/time (YYYY-MM-DD HH:MM)'); return; }

    setSaving(true);
    try {
      await addJob({
        tourPartyId,
        type,
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim(),
        scheduledPickupAt: ts,
        driverName: driverName.trim() || undefined,
        driverPhone: driverPhone.trim() || undefined,
        vehicleDescription: vehicleDescription.trim() || undefined,
        passengerCount: passengerCount ? parseInt(passengerCount, 10) : undefined,
      });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: `${Colors.accent}40`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>New Transport Job</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {TRANSPORT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            onPress={() => setType(t.value)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: type === t.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: type === t.value ? Colors.accent : Colors.border }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: type === t.value ? '#000' : Colors.textMuted }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <LabeledInput label="Pickup Location *" value={pickupLocation} onChangeText={setPickupLocation} placeholder="Heathrow Terminal 5" />
      <LabeledInput label="Dropoff Location *" value={dropoffLocation} onChangeText={setDropoffLocation} placeholder="The Langham Hotel" />
      <LabeledInput label="Pickup Date & Time * (YYYY-MM-DD HH:MM)" value={scheduledPickupAt} onChangeText={setScheduledPickupAt} placeholder="2026-09-15 09:00" />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><LabeledInput label="Driver Name" value={driverName} onChangeText={setDriverName} placeholder="John Smith" /></View>
        <View style={{ flex: 1 }}><LabeledInput label="Driver Phone" value={driverPhone} onChangeText={setDriverPhone} placeholder="+44..." /></View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 2 }}><LabeledInput label="Vehicle" value={vehicleDescription} onChangeText={setVehicleDescription} placeholder="Black Mercedes V-Class" /></View>
        <View style={{ flex: 1 }}><LabeledInput label="Passengers" value={passengerCount} onChangeText={setPassengerCount} placeholder="4" keyboardType="numeric" /></View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity onPress={onDone} style={{ flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textMuted }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flex: 2, paddingVertical: 11, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center' }}>
          {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Add Job</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: Colors.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.textMuted} keyboardType={keyboardType ?? 'default'} style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textPrimary }} />
    </View>
  );
}

function TransportCard({ job, onRemove, onStatusCycle }: { job: any; onRemove: () => void; onStatusCycle: () => void }) {
  const typeLabel = TRANSPORT_TYPES.find((t) => t.value === job.type)?.label ?? job.type;
  const icon = TRANSPORT_TYPES.find((t) => t.value === job.type)?.icon ?? 'car';
  const statusMeta = TRANSPORT_STATUS_META[job.status] ?? { label: job.status, color: Colors.textMuted };

  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <FontAwesome name={icon as any} size={16} color={Colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{typeLabel}</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
            {job.pickupLocation} → {job.dropoffLocation}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity onPress={onStatusCycle}>
            <View style={{ backgroundColor: `${statusMeta.color}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${statusMeta.color}40` }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: statusMeta.color }}>{statusMeta.label}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
            <FontAwesome name="trash-o" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textPrimary, marginBottom: 4 }}>
        {fmt(job.scheduledPickupAt)}
      </Text>
      {job.driverName && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
          Driver: {job.driverName}{job.driverPhone ? ` · ${job.driverPhone}` : ''}
        </Text>
      )}
      {job.vehicleDescription && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
          {job.vehicleDescription}
          {job.passengerCount ? ` · ${job.passengerCount} passengers` : ''}
        </Text>
      )}
    </View>
  );
}

export default function TransportScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const party = useQuery(api.travel.getTourParty, { id });
  const jobs = useQuery(api.travel.listTransportJobs, { tourPartyId: id });
  const updateJob = useMutation(api.travel.updateTransportJob).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listTransportJobs, { tourPartyId: id });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listTransportJobs,
        { tourPartyId: id },
        current.map((j) => (j._id === args.id ? { ...j, ...args } : j))
      );
    }
  );
  const removeJob = useMutation(api.travel.removeTransportJob).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.travel.listTransportJobs, { tourPartyId: id });
      if (current === undefined) return;
      localStore.setQuery(
        api.travel.listTransportJobs,
        { tourPartyId: id },
        current.filter((j) => j._id !== args.id)
      );
    }
  );
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...(jobs ?? [])].sort((a, b) => a.scheduledPickupAt - b.scheduledPickupAt);

  const handleStatusCycle = (jobId: Id<'transportJobs'>, current: string) => {
    const idx = TRANSPORT_STATUSES.indexOf(current);
    const next = TRANSPORT_STATUSES[(idx + 1) % TRANSPORT_STATUSES.length];
    const nextMeta = TRANSPORT_STATUS_META[next];
    Alert.alert('Update Status', `Mark as "${nextMeta.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: () => updateJob({ id: jobId, status: next }) },
    ]);
  };

  const handleRemove = (jobId: Id<'transportJobs'>, label: string) => {
    Alert.alert('Remove Job', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeJob({ id: jobId }) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Transport</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{party?.name ?? ''}</Text>
        </View>
        {!showAdd && (
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {showAdd && (
          <AddTransportForm tourPartyId={id} onDone={() => setShowAdd(false)} />
        )}

        {jobs === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : sorted.length === 0 && !showAdd ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="car" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 6 }}>No transport jobs</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Schedule transfers, airport pickups, and other ground transport here.</Text>
          </View>
        ) : (
          sorted.map((job) => {
            const typeLabel = TRANSPORT_TYPES.find((t) => t.value === job.type)?.label ?? job.type;
            return (
              <TransportCard
                key={job._id}
                job={job}
                onRemove={() => handleRemove(job._id, `${typeLabel}: ${job.pickupLocation} → ${job.dropoffLocation}`)}
                onStatusCycle={() => handleStatusCycle(job._id, job.status)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
