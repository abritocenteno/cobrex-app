import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

export default function InviteArtistScreen() {
  const router = useRouter();
  const managerProfile = useQuery(api.manager.myProfile);
  const sendInvite = useMutation(api.rosterInvites.send);

  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const results = useQuery(
    api.artists.search,
    search.trim().length >= 2 ? { name: search.trim() } : 'skip'
  );

  const handleInvite = async (artistId: string) => {
    if (!managerProfile?._id) return;
    setSending(artistId);
    setError('');
    try {
      await sendInvite({
        managerId: managerProfile._id,
        artistId: artistId as any,
        direction: 'manager_to_artist',
        message: message.trim() || undefined,
      });
      setSent((prev) => new Set([...prev, artistId]));
    } catch (e: any) {
      setError(e.message ?? 'Failed to send invite');
    } finally {
      setSending(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, flex: 1 }}>Invite Artist</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 20 }}>
          Search for an artist on Cobrex and send them a roster invite.
        </Text>

        {/* Search */}
        <View style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 16 }}>
          <FontAwesome name="search" size={14} color={Colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by artist name..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            style={{ flex: 1, paddingVertical: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesome name="times" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Optional message */}
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Message (optional)
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Introduce yourself or describe the opportunity..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, height: 90, textAlignVertical: 'top', marginBottom: 24 }}
        />

        {error ? (
          <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        {/* Results */}
        {search.trim().length < 2 ? (
          <View style={{ alignItems: 'center', paddingTop: 24 }}>
            <FontAwesome name="search" size={36} color={Colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Type at least 2 characters to search</Text>
          </View>
        ) : results === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 24 }} />
        ) : results.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 24 }}>
            <FontAwesome name="microphone" size={36} color={Colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 6 }}>No artists found</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Try a different name</Text>
          </View>
        ) : (
          results.map((artist: any) => {
            const isSent = sent.has(artist._id);
            const isSending = sending === artist._id;
            return (
              <View key={artist._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: Colors.accent }}>
                    {(artist.name ?? '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>{artist.name}</Text>
                  {artist.genre ? (
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{artist.genre}</Text>
                  ) : artist.location ? (
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{artist.location}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleInvite(artist._id)}
                  disabled={isSent || isSending}
                  style={{
                    backgroundColor: isSent ? `${Colors.green}18` : Colors.accent,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: isSent ? 1 : 0,
                    borderColor: isSent ? Colors.green : 'transparent',
                    opacity: isSending ? 0.7 : 1,
                  }}
                >
                  {isSending ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : isSent ? (
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.green }}>Sent</Text>
                  ) : (
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Invite</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
