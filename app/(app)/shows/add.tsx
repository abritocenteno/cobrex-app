import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import DatePickerField from '../../../src/components/DatePickerField';
import { Colors } from '../../../src/constants/colors';
import ScreenContainer from '../../../src/components/ScreenContainer';
import Toast from '../../../src/components/Toast';
import { useToast } from '../../../src/hooks/useToast';
import { useDraftSave, getDraft } from '../../../src/hooks/useDraftSave';

const DRAFT_KEY = 'shows_add';

type VenueResult = { _id: string; name: string | null; city: string | null; capacity: number | null };

export default function AddShow() {
  const router = useRouter();
  const { restore } = useLocalSearchParams<{ restore?: string }>();
  const profile = useQuery(api.users.myProfile);
  const createShow = useMutation(api.shows.create);

  const [name, setName] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [loadInTime, setLoadInTime] = useState('');
  const [soundcheckTime, setSoundcheckTime] = useState('');
  const [doorsTime, setDoorsTime] = useState('');
  const [setLength, setSetLength] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast, showToast, hideToast } = useToast();

  // Venue picker state
  const [venueSearch, setVenueSearch] = useState('');
  const [venueSearchDebounced, setVenueSearchDebounced] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<VenueResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVenueSearchDebounced(venueSearch), 300);
    return () => clearTimeout(t);
  }, [venueSearch]);

  const venueResults = useQuery(
    api.venue.search,
    venueSearchDebounced.length >= 2 && !selectedVenue ? { query: venueSearchDebounced } : 'skip'
  );

  const handleVenueTextChange = (text: string) => {
    setVenueSearch(text);
    if (selectedVenue) setSelectedVenue(null);
    setShowDropdown(true);
  };

  const handleSelectVenue = (venue: VenueResult) => {
    setSelectedVenue(venue);
    setVenueSearch(venue.name ?? '');
    setShowDropdown(false);
  };

  const clearVenue = () => {
    setSelectedVenue(null);
    setVenueSearch('');
    setShowDropdown(false);
  };

  // Restore draft if navigated here with ?restore=1
  useEffect(() => {
    if (restore !== '1') return;
    const draft = getDraft(DRAFT_KEY);
    if (!draft) return;
    const v = draft.values as Record<string, string>;
    if (v.name) setName(v.name);
    if (v.showDate) setShowDate(v.showDate);
    if (v.showTime) setShowTime(v.showTime);
    if (v.loadInTime) setLoadInTime(v.loadInTime);
    if (v.soundcheckTime) setSoundcheckTime(v.soundcheckTime);
    if (v.doorsTime) setDoorsTime(v.doorsTime);
    if (v.setLength) setSetLength(v.setLength);
    if (v.notes) setNotes(v.notes);
    showToast('Draft restored');
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft while editing
  const { clearDraft } = useDraftSave(DRAFT_KEY, { name, showDate, showTime, loadInTime, soundcheckTime, doorsTime, setLength, notes });

  const handleCreate = async () => {
    if (!profile?.artistId) return;
    if (!name.trim()) { setError('Show name is required'); return; }
    if (!showDate.trim()) { setError('Date is required (YYYY-MM-DD)'); return; }
    setLoading(true);
    setError('');
    try {
      await createShow({
        artistId: profile.artistId,
        name: name.trim(),
        showDate,
        showTime: showTime || undefined,
        loadInTime: loadInTime || undefined,
        soundcheckTime: soundcheckTime || undefined,
        doorsTime: doorsTime || undefined,
        setLengthMinutes: setLength ? parseInt(setLength) : undefined,
        notes: notes || undefined,
        venueName: selectedVenue?.name ?? (venueSearch.trim() || undefined),
        venueProfileId: selectedVenue ? (selectedVenue._id as any) : undefined,
      });
      clearDraft();
      showToast('Show created successfully!');
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create show');
      showToast(e.message ?? 'Failed to create show', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 4 };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16, padding: 4 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, flex: 1 }}>New Show</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading} style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
          {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {error ? <Text style={{ color: Colors.accentRed, fontFamily: 'DMSans_400Regular', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        <Text style={labelStyle}>Show Name *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Summer Festival Set" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <DatePickerField label="Date *" value={showDate} onChange={setShowDate} />

        {/* Venue picker */}
        <Text style={labelStyle}>Venue</Text>
        <View style={{
          backgroundColor: Colors.surface2,
          borderWidth: 1,
          borderColor: selectedVenue ? Colors.accent : Colors.border,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        }}>
          <TextInput
            value={venueSearch}
            onChangeText={handleVenueTextChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search venues on Cobrex..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
          />
          {selectedVenue ? (
            <TouchableOpacity onPress={clearVenue} style={{ paddingHorizontal: 14 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 20, lineHeight: 20 }}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dropdown results */}
        {showDropdown && venueResults && venueResults.length > 0 && (
          <View style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
            {venueResults.map((venue, i) => (
              <TouchableOpacity
                key={venue._id}
                onPress={() => handleSelectVenue(venue as VenueResult)}
                style={{ padding: 14, borderBottomWidth: i < venueResults.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>{venue.name}</Text>
                {venue.city ? (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    {venue.city}{venue.capacity ? ` · ${venue.capacity} cap` : ''}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Status line below the field */}
        {selectedVenue ? (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.green, marginBottom: 12 }}>
            ✓ Linked to {selectedVenue.name}
          </Text>
        ) : venueSearch.length >= 2 && venueResults !== undefined && venueResults.length === 0 && showDropdown ? (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>
            No venues found — show will be saved without a venue link
          </Text>
        ) : (
          <View style={{ marginBottom: 12 }} />
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Show Time</Text>
            <TextInput value={showTime} onChangeText={setShowTime} placeholder="21:00" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Doors Time</Text>
            <TextInput value={doorsTime} onChangeText={setDoorsTime} placeholder="20:00" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Load In</Text>
            <TextInput value={loadInTime} onChangeText={setLoadInTime} placeholder="16:00" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Soundcheck</Text>
            <TextInput value={soundcheckTime} onChangeText={setSoundcheckTime} placeholder="18:00" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
        </View>

        <Text style={labelStyle}>Set Length (minutes)</Text>
        <TextInput value={setLength} onChangeText={setSetLength} placeholder="60" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={inputStyle} />

        <Text style={labelStyle}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Any additional notes..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }} />
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
