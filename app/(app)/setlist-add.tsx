import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import ScreenContainer from '../../src/components/ScreenContainer';
import Toast from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import DropdownSelect from '../../src/components/DropdownSelect';

const KEY_OPTIONS = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D#' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G#' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A#' },
  { value: 'B', label: 'B' },
  { value: 'Cm', label: 'C minor' },
  { value: 'C#m', label: 'C# minor' },
  { value: 'Dm', label: 'D minor' },
  { value: 'D#m', label: 'D# minor' },
  { value: 'Em', label: 'E minor' },
  { value: 'Fm', label: 'F minor' },
  { value: 'F#m', label: 'F# minor' },
  { value: 'Gm', label: 'G minor' },
  { value: 'G#m', label: 'G# minor' },
  { value: 'Am', label: 'A minor' },
  { value: 'A#m', label: 'A# minor' },
  { value: 'Bm', label: 'B minor' },
];

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

type ScPreview = {
  title: string;
  author: string;
  thumbnail: string;
  description: string;
};

function parseBpm(text: string): string | null {
  const m =
    text.match(/\b(\d{2,3})\s*bpm\b/i) ||
    text.match(/\bbpm[:\s=]+(\d{2,3})\b/i) ||
    text.match(/\btempo[:\s=]+(\d{2,3})\b/i);
  return m ? m[1] : null;
}

function parseKey(text: string): string | null {
  // Match patterns like "Key: Am", "Key: C minor", "in Am", "in C#"
  const keyNames = ['C#m','D#m','F#m','G#m','A#m','Cm','Dm','Em','Fm','Gm','Am','Bm','C#','D#','F#','G#','A#','C','D','E','F','G','A','B'];
  const m = text.match(/\bkey[:\s=]+([A-G][b#]?(?:\s*(?:minor|min|maj|major))?)\b/i) ||
            text.match(/\bin\s+([A-G][b#]?(?:\s*(?:minor|min|maj|major))?)\b/i);
  if (!m) return null;
  const raw = m[1].replace(/\s*(minor|min)\b/i, 'm').replace(/\s*(major|maj)\b/i, '').replace(/b/, '#').trim();
  return keyNames.includes(raw) ? raw : null;
}

export default function AddSong() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const createSong = useMutation(api.setlist.createSong);
  const analyzeSong = useAction(api.analyzeSong.analyze);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [keySignature, setKeySignature] = useState('');
  const [bpm, setBpm] = useState('');
  const [duration, setDuration] = useState('');
  const [energyLevel, setEnergyLevel] = useState(0);
  const [hasBackingTrack, setHasBackingTrack] = useState(false);
  const [notes, setNotes] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [scPreview, setScPreview] = useState<ScPreview | null>(null);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [error, setError] = useState('');

  const handleFetchSoundcloud = async () => {
    const url = soundcloudUrl.trim();
    if (!url) return;
    if (!url.includes('soundcloud.com')) {
      setError('Please enter a valid SoundCloud URL');
      return;
    }
    setFetching(true);
    setError('');
    try {
      const res = await fetch(
        `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
      );
      if (!res.ok) throw new Error('Could not fetch track info');
      const data = await res.json();

      const scTitle: string = data.title ?? '';
      const scAuthor: string = data.author_name ?? '';
      const scThumbnail: string = data.thumbnail_url ?? '';
      const scDescription: string = data.description ?? '';

      const filled: string[] = [];
      if (scTitle) { setTitle(scTitle); filled.push('title'); }
      if (!notes && scDescription) { setNotes(scDescription); filled.push('notes'); }
      setScPreview({ title: scTitle, author: scAuthor, thumbnail: scThumbnail, description: scDescription });

      // Try AI analysis first, fall back to regex
      try {
        const ai = await analyzeSong({ title: scTitle, description: scDescription });
        if (!bpm && ai.bpm) { setBpm(String(ai.bpm)); filled.push('BPM'); }
        if (!keySignature && ai.keySignature) { setKeySignature(ai.keySignature); filled.push('key'); }
        if (!energyLevel && ai.energyLevel) { setEnergyLevel(ai.energyLevel); filled.push('energy'); }
      } catch {
        const detectedBpm = parseBpm(scDescription);
        const detectedKey = parseKey(scDescription);
        if (!bpm && detectedBpm) { setBpm(detectedBpm); filled.push('BPM'); }
        if (!keySignature && detectedKey) { setKeySignature(detectedKey); filled.push('key'); }
      }

      showToast(filled.length ? `Filled: ${filled.join(', ')}` : 'Track found — review and save');
    } catch {
      setError('Failed to fetch SoundCloud info — check the URL and try again');
    } finally {
      setFetching(false);
    }
  };

  const handleClearImport = () => {
    setScPreview(null);
    setSoundcloudUrl('');
  };

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

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        {/* SoundCloud import */}
        <View style={{ backgroundColor: `${Colors.accent}10`, borderWidth: 1, borderColor: `${Colors.accent}30`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary, marginBottom: 10 }}>
            Import from SoundCloud
          </Text>

          {!scPreview ? (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={soundcloudUrl}
                  onChangeText={setSoundcloudUrl}
                  placeholder="https://soundcloud.com/artist/track"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 13 }}
                />
                <TouchableOpacity
                  onPress={handleFetchSoundcloud}
                  disabled={fetching || !soundcloudUrl.trim()}
                  style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', opacity: soundcloudUrl.trim() ? 1 : 0.4 }}
                >
                  {fetching
                    ? <ActivityIndicator color="#000" size="small" />
                    : <FontAwesome name="cloud-download" size={16} color="#000" />}
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 8 }}>
                Autofills title, BPM, key, and notes from the track description.
              </Text>
            </>
          ) : (
            /* Preview card after successful import */
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {scPreview.thumbnail ? (
                <Image
                  source={{ uri: scPreview.thumbnail }}
                  style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.surface2 }}
                />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesome name="music" size={20} color={Colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary }} numberOfLines={1}>{scPreview.title}</Text>
                {scPreview.author ? (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                    by {scPreview.author}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {bpm ? <View style={{ backgroundColor: `${Colors.accent}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: Colors.accent }}>{bpm} BPM</Text></View> : null}
                  {keySignature ? <View style={{ backgroundColor: `${Colors.accent}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10, color: Colors.accent }}>Key: {keySignature}</Text></View> : null}
                </View>
              </View>
              <TouchableOpacity onPress={handleClearImport} style={{ padding: 4 }}>
                <FontAwesome name="times" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>

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
        <DropdownSelect
          options={KEY_OPTIONS}
          value={keySignature}
          onChange={(v) => setKeySignature(v)}
          placeholder="Select key..."
        />

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
            {hasBackingTrack && <FontAwesome name="check" size={11} color="#000" />}
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
