import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';
import EmptyState from '../../src/components/EmptyState';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SetlistScreen() {
  const profile = useQuery(api.users.myProfile);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const removeSong = useMutation(api.setlist.removeSong);
  const songs = useQuery(
    api.setlist.songs,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  const totalDuration = (songs ?? []).reduce((sum: number, s: any) => sum + (s.durationSeconds ?? 0), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Setlist</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1 }}>
            {(songs ?? []).length} songs · {formatDuration(totalDuration)} total
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/setlist-add')}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add Song</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {songs === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : songs.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>��</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No songs yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Add songs to build your setlist</Text>
          </View>
        ) : (
          songs.map((song: any, index: number) => (
            <View key={song._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textMuted, width: 32, textAlign: 'center', marginRight: 12 }}>
                {index + 1}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 }}>
                  {song.title}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                  {song.key ? `Key: ${song.key}` : ''}
                  {song.key && song.bpm ? ' · ' : ''}
                  {song.bpm ? `${song.bpm} BPM` : ''}
                  {(song.key || song.bpm) && song.genre ? ' · ' : ''}
                  {song.genre ?? ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {song.durationSeconds && (
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}>
                    {formatDuration(song.durationSeconds)}
                  </Text>
                )}
                <TouchableOpacity onPress={() => removeSong({ id: song._id })}>
                  <Text style={{ fontSize: 16, color: Colors.textMuted }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
