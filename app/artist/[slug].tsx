import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { formatDate } from '../../src/utils/format';

const SOCIAL_LINKS = [
  { key: 'instagramHandle', label: 'Instagram', icon: '📸', urlFn: (h: string) => `https://instagram.com/${h.replace('@', '')}` },
  { key: 'spotifyArtistId', label: 'Spotify', icon: '🎧', urlFn: (id: string) => `https://open.spotify.com/artist/${id}` },
  { key: 'tiktokHandle', label: 'TikTok', icon: '🎬', urlFn: (h: string) => `https://tiktok.com/@${h.replace('@', '')}` },
  { key: 'youtubeHandle', label: 'YouTube', icon: '▶️', urlFn: (h: string) => `https://youtube.com/@${h.replace('@', '')}` },
  { key: 'websiteUrl', label: 'Website', icon: '🌐', urlFn: (u: string) => u },
] as const;

export default function PublicArtistProfile() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const artist = useQuery(api.artists.getBySlug, slug ? { slug } : 'skip');
  const shows = useQuery(
    api.artists.upcomingPublic,
    artist?._id ? { artistId: artist._id } : 'skip'
  );

  if (artist === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 40, color: Colors.accent, letterSpacing: 4, marginBottom: 16 }}>COBREX</Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8 }}>Artist not found</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>
          This profile doesn't exist or has been deactivated.
        </Text>
      </View>
    );
  }

  const socialItems = SOCIAL_LINKS.filter((s) => !!(artist as any)[s.key]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 }}>

        {/* Hero */}
        <View style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 }}>
          {artist.avatarUrl ? (
            <Image
              source={{ uri: artist.avatarUrl }}
              style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 16, borderWidth: 3, borderColor: `${Colors.accent}40` }}
            />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: `${Colors.accent}18`, borderWidth: 2, borderColor: `${Colors.accent}40`, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 44, color: Colors.accent }}>
                {artist.name[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 28, color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 }}>
            {artist.name}
          </Text>
          {(artist.location || artist.country) ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 6 }}>
              📍 {[artist.location, artist.country].filter(Boolean).join(', ')}
            </Text>
          ) : null}
          {(artist.genre) ? (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: `${Colors.accent}18`, borderWidth: 1, borderColor: `${Colors.accent}30` }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent }}>{artist.genre}</Text>
              </View>
              {artist.subGenre ? (
                <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>{artist.subGenre}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Bio */}
        {artist.bio ? (
          <View style={{ marginHorizontal: 24, marginBottom: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: Colors.textMuted, lineHeight: 24 }}>{artist.bio}</Text>
          </View>
        ) : null}

        {/* Social links */}
        {socialItems.length > 0 ? (
          <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Links</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {socialItems.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => Linking.openURL(s.urlFn((artist as any)[s.key]))}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, gap: 8 }}
                >
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textPrimary }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Upcoming shows */}
        {shows !== undefined && shows.length > 0 ? (
          <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Upcoming Shows</Text>
            {shows.map((show: any) => (
              <View key={show._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>{show.name}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
                  {formatDate(show.showDate, { weekday: true })}
                  {show.showTime ? ` · ${show.showTime}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 4, color: `${Colors.accent}60` }}>COBREX</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 2, marginTop: 2 }}>ARTIST MANAGEMENT OS</Text>
        </View>

      </ScrollView>
    </View>
  );
}
