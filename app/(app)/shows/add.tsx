import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import DatePickerField from '../../../src/components/DatePickerField';
import { Colors } from '../../../src/constants/colors';
import ScreenContainer from '../../../src/components/ScreenContainer';
import Toast from '../../../src/components/Toast';
import { useToast } from '../../../src/hooks/useToast';

export default function AddShow() {
  const router = useRouter();
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
      });
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
      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        {error ? <Text style={{ color: Colors.accentRed, fontFamily: 'DMSans_400Regular', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        <Text style={labelStyle}>Show Name *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Paradiso Amsterdam" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <DatePickerField label="Date *" value={showDate} onChange={setShowDate} />

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
