import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

const SECTION_META = {
  shows: { icon: 'microphone', label: 'Shows', color: Colors.accent },
  contacts: { icon: 'users', label: 'Contacts', color: Colors.accent },
  songs: { icon: 'music', label: 'Songs', color: Colors.accent },
  assets: { icon: 'folder', label: 'Assets', color: Colors.accent },
  parties: { icon: 'plane', label: 'Travel Parties', color: Colors.accent },
} as const;

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ResultRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: `${Colors.accent}18`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <FontAwesome name={icon as any} size={13} color={Colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 1 }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <FontAwesome name="chevron-right" size={11} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: Colors.surface2,
      }}
    >
      <Text
        style={{
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 11,
          color: Colors.textMuted,
          letterSpacing: 1,
          textTransform: 'uppercase',
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>
        {count}
      </Text>
    </View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);

  const [input, setInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const artistId = profile?.artistId as Id<'artists'> | undefined;
  const skipSearch = !artistId || debouncedQ.length < 2;

  const results = useQuery(
    api.search.globalSearch,
    skipSearch ? 'skip' : { artistId, q: debouncedQ }
  );

  const isLoading = !skipSearch && results === undefined;

  const totalResults = skipSearch
    ? 0
    : (results?.shows.length ?? 0) +
      (results?.contacts.length ?? 0) +
      (results?.songs.length ?? 0) +
      (results?.assets.length ?? 0) +
      (results?.parties.length ?? 0);

  const hasResults = totalResults > 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 28,
          paddingBottom: 16,
          gap: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: input.length > 0 ? `${Colors.accent}60` : Colors.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
          }}
        >
          <FontAwesome name="search" size={14} color={Colors.textMuted} />
          <TextInput
            autoFocus
            value={input}
            onChangeText={setInput}
            placeholder="Search shows, contacts, songs…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            style={{
              flex: 1,
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
              color: Colors.textPrimary,
            }}
          />
          {input.length > 0 && (
            <TouchableOpacity onPress={() => setInput('')}>
              <FontAwesome name="times-circle" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body */}
      {profile === undefined ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : !artistId ? (
        <View style={{ padding: 28, alignItems: 'center' }}>
          <FontAwesome name="search" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: 14,
              color: Colors.textMuted,
              textAlign: 'center',
            }}
          >
            Search is available for artist accounts.
          </Text>
        </View>
      ) : debouncedQ.length < 2 ? (
        <View style={{ padding: 28, alignItems: 'center', marginTop: 24 }}>
          <FontAwesome name="search" size={40} color={`${Colors.textMuted}60`} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: 15,
              color: Colors.textMuted,
              textAlign: 'center',
            }}
          >
            Type at least 2 characters to search
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: `${Colors.textMuted}80`,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Searches shows, contacts, songs, assets, and travel parties
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : !hasResults ? (
        <View style={{ padding: 28, alignItems: 'center', marginTop: 16 }}>
          <FontAwesome name="inbox" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
          <Text
            style={{
              fontFamily: 'DMSans_600SemiBold',
              fontSize: 15,
              color: Colors.textPrimary,
              marginBottom: 6,
            }}
          >
            No results for "{debouncedQ}"
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 13,
              color: Colors.textMuted,
              textAlign: 'center',
            }}
          >
            Try different keywords or check your spelling.
          </Text>
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Shows */}
          {(results?.shows.length ?? 0) > 0 && (
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Shows" count={results!.shows.length} />
              <View style={{ backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border }}>
                {results!.shows.map((show) => (
                  <ResultRow
                    key={show._id}
                    icon="microphone"
                    title={show.name}
                    subtitle={[show.venueName, show.showDate].filter(Boolean).join(' · ')}
                    onPress={() => router.push(`/(app)/shows/${show._id}` as any)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Contacts */}
          {(results?.contacts.length ?? 0) > 0 && (
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Contacts" count={results!.contacts.length} />
              <View style={{ backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border }}>
                {results!.contacts.map((contact) => (
                  <ResultRow
                    key={contact._id}
                    icon="users"
                    title={contact.displayName}
                    subtitle={[contact.company, contact.contactType].filter(Boolean).join(' · ')}
                    onPress={() => router.push(`/(app)/contacts/${contact._id}` as any)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Songs */}
          {(results?.songs.length ?? 0) > 0 && (
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Songs" count={results!.songs.length} />
              <View style={{ backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border }}>
                {results!.songs.map((song) => (
                  <ResultRow
                    key={song._id}
                    icon="music"
                    title={song.title}
                    subtitle={[
                      song.keySignature,
                      song.bpm ? `${song.bpm} BPM` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    onPress={() => router.push('/(app)/setlist' as any)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Assets */}
          {(results?.assets.length ?? 0) > 0 && (
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Assets" count={results!.assets.length} />
              <View style={{ backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border }}>
                {results!.assets.map((asset) => (
                  <ResultRow
                    key={asset._id}
                    icon="folder"
                    title={asset.name}
                    subtitle={asset.assetType}
                    onPress={() => router.push('/(app)/assets' as any)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Travel Parties */}
          {(results?.parties.length ?? 0) > 0 && (
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Travel Parties" count={results!.parties.length} />
              <View style={{ backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border }}>
                {results!.parties.map((party) => (
                  <ResultRow
                    key={party._id}
                    icon="plane"
                    title={party.name}
                    subtitle={[
                      party.status,
                      party.departureDate ? `Departs ${fmtDate(party.departureDate)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    onPress={() => router.push(`/(app)/travel/${party._id}` as any)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
