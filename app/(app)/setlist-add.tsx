import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/colors';
import ScreenContainer from '../../src/components/ScreenContainer';
import Toast from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
const ENERGY_LEVELS = [1, 2, 3, 4, 5];

export default function AddSong() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const createSong = useMutation(api.setlist.createSong);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [keySignature, setKeySignature] = useState('');
  const [bpm, setBpm] = useState('');
  const [duration, setDuration] = useState('');
  const [energyLevel, setEnergyLevel] = useState(0);
  const [hasBackingTrack, setHasBackingTrack] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!profile?.artistId) return;
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      await createSong({
        artistId: profile.artistId,
        title: title.trim(),
        subtitle: subtitle || undefined,
        keySignature: keySignature || undefined,
        bpm: bpm ? parseInt(bpm) : undefined,
        durationSeconds: duration ? parseInt(duration) * 60 : undefined,
        energyLevel: energyLevel || undefined,
        hasBackingTrack,
        notes: notes || undefined,
      });
      showToast('Song added!');
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e.message ?? 'Failed to add song');
      showToast(e.message ?? 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 4 };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, flex: 1 }}>Add Song</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading} style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
          {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        <Text style={labelStyle}>Title *</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Song title" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <Text style={labelStyle}>Subtitle / Version</Text>
        <TextInput value={subtitle} onChangeText={setSubtitle} placeholder="e.g. Acoustic version" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>BPM</Text>
            <TextInput value={bpm} onChangeText={setBpm} placeholder="120" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Duration (min)</Text>
            <TextInput value={duration} onChangeText={setDuration} placeholder="3" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" style={inputStyle} />
          </View>
        </View>

        <Text style={labelStyle}>Key</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setKeySignature('')}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: keySignature === '' ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: keySignature === '' ? Colors.accent : Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: keySignature === '' ? '#000' : Colors.textMuted }}>None</Text>
            </TouchableOpacity>
            {KEYS.map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setKeySignature(k)}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: keySignature === k ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: keySignature === k ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: keySignature === k ? '#000' : Colors.textMuted }}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={labelStyle}>Energy Level</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {ENERGY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setEnergyLevel(level === energyLevel ? 0 : level)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: energyLevel >= level ? `${Colors.accent}30` : Colors.surface2, borderWidth: 1, borderColor: energyLevel >= level ? Colors.accent : Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: energyLevel >= level ? Colors.accent : Colors.textMuted }}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={labelStyle}>Backing Track</Text>
        <TouchableOpacity
          onPress={() => setHasBackingTrack(!hasBackingTrack)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: hasBackingTrack ? Colors.accent : Colors.border, borderRadius: 12, padding: 14, marginBottom: 16 }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: hasBackingTrack ? Colors.accent : Colors.textMuted, backgroundColor: hasBackingTrack ? Colors.accent : 'transparent', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
            {hasBackingTrack && <Text style={{ color: '#000', fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textPrimary }}>Has backing track</Text>
        </TouchableOpacity>

        <Text style={labelStyle}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Any notes..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }} />
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
