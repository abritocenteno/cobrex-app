import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { formatTime, formatDate } from '../../../src/utils/format';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.green,
  draft: Colors.textMuted,
  completed: Colors.accentBlue,
  cancelled: Colors.accentRed,
  postponed: Colors.orange,
};

const PAYMENT_COLORS: Record<string, string> = {
  paid_in_full: Colors.green,
  deposit_paid: Colors.orange,
  unpaid: Colors.accentRed,
  overpaid: Colors.accentPurple,
  refunded: Colors.textMuted,
};

const TIMELINE_STATUS_COLORS: Record<string, string> = {
  pending: Colors.textMuted,
  in_progress: Colors.orange,
  completed: Colors.green,
  skipped: Colors.accentRed,
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ShowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showSongPicker, setShowSongPicker] = useState(false);
  const show = useQuery(api.shows.get, id ? { id: id as any } : 'skip');
  const timeline = useQuery(api.timeline.list, id ? { showId: id as any } : 'skip');
  const profile = useQuery(api.users.myProfile);
  const setlistVersion = useQuery(api.setlist.getVersionForShow, id ? { showId: id as any } : 'skip');
  const setlistItems = useQuery(api.setlist.items, setlistVersion?._id ? { setlistVersionId: setlistVersion._id } : 'skip');
  const allSongs = useQuery(api.setlist.songs, profile?.artistId ? { artistId: profile.artistId } : 'skip');
  const updateStatus = useMutation(api.shows.update);
  const updateTimelineStatus = useMutation(api.timeline.updateStatus);
  const createSetlist = useMutation(api.setlist.createVersionForShow);
  const addItem = useMutation(api.setlist.addItem);
  const removeItem = useMutation(api.setlist.removeItem);

  const handleCreateSetlist = async () => {
    if (!show || !profile?.artistId) return;
    await createSetlist({ showId: show._id, artistId: profile.artistId, name: show.name });
  };

  const handleAddSong = async (songId: string) => {
    if (!setlistVersion) return;
    const nextPosition = (setlistItems?.length ?? 0) + 1;
    await addItem({ setlistVersionId: setlistVersion._id, songId: songId as any, position: nextPosition });
  };

  if (show === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  if (!show) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: Colors.textMuted }}>Show not found</Text></View>;
  }

  const statusColor = STATUS_COLORS[show.status] ?? Colors.textMuted;
  const paymentColor = PAYMENT_COLORS[show.paymentStatus] ?? Colors.textMuted;

  const STATUS_ACTIONS = [
    { label: 'Draft', value: 'draft' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Shows</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/shows/edit/${show._id}` as any)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 6 }}>{show.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${statusColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: statusColor, textTransform: 'capitalize' }}>{show.status}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${paymentColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: paymentColor }}>{show.paymentStatus?.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 700, width: '100%', alignSelf: 'center' }}>

        {/* Date & Times */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>📅 Schedule</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {[
              { label: 'Date', value: formatDate(show.showDate, { weekday: true }) },
              { label: 'Load In', value: formatTime(show.loadInTime) },
              { label: 'Soundcheck', value: formatTime(show.soundcheckTime) },
              { label: 'Doors', value: formatTime(show.doorsTime) },
              { label: 'Show Time', value: formatTime(show.showTime) },
              { label: 'Set Length', value: show.setLengthMinutes ? `${show.setLengthMinutes} min` : '—' },
            ].map((item) => (
              <View key={item.label} style={{ minWidth: 140 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Change Status */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>🔄 Update Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STATUS_ACTIONS.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => updateStatus({ id: show._id, status: s.value })}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: show.status === s.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: show.status === s.value ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: show.status === s.value ? '#000' : Colors.textMuted }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Checklist */}
        <TouchableOpacity
          onPress={() => router.push(`/(app)/shows/checklist/${show._id}` as any)}
          style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 20, marginRight: 12 }}>📋</Text>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, flex: 1 }}>Show Checklist</Text>
          <Text style={{ color: Colors.textMuted }}>→</Text>
        </TouchableOpacity>

        {/* Timeline */}
        {timeline !== undefined && timeline.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>⏱️ Timeline</Text>
            {timeline.map((event: any, index: number) => {
              const eventColor = TIMELINE_STATUS_COLORS[event.status] ?? Colors.textMuted;
              return (
                <View key={event._id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                  {/* Line */}
                  <View style={{ alignItems: 'center', marginRight: 14 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: eventColor, marginTop: 2 }} />
                    {index < timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 4 }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>{event.label}</Text>
                      {event.scheduledTime && <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{event.scheduledTime}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['pending', 'in_progress', 'completed', 'skipped'].map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => updateTimelineStatus({ id: event._id, status: s })}
                          style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: event.status === s ? `${TIMELINE_STATUS_COLORS[s]}30` : Colors.surface2, borderWidth: 1, borderColor: event.status === s ? TIMELINE_STATUS_COLORS[s] : Colors.border }}
                        >
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: event.status === s ? TIMELINE_STATUS_COLORS[s] : Colors.textMuted, textTransform: 'capitalize' }}>{s.replace('_', ' ')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Notes */}
        {show.notes ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 10 }}>📝 Notes</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{show.notes}</Text>
          </View>
        ) : null}

        {/* Setlist */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>🎵 Setlist</Text>
            {setlistVersion ? (
              <TouchableOpacity
                onPress={() => setShowSongPicker(true)}
                style={{ backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#000' }}>+ Add Song</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {setlistVersion === undefined ? (
            <ActivityIndicator color={Colors.accent} />
          ) : setlistVersion === null ? (
            <TouchableOpacity
              onPress={handleCreateSetlist}
              style={{ borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 28, marginBottom: 8 }}>🎶</Text>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>No setlist yet</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.accent }}>Tap to create one</Text>
            </TouchableOpacity>
          ) : setlistItems === undefined ? (
            <ActivityIndicator color={Colors.accent} />
          ) : setlistItems.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>No songs added yet</Text>
              <TouchableOpacity onPress={() => setShowSongPicker(true)}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.accent }}>Add from your library →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {setlistItems.map((item: any, index: number) => (
                <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: index < setlistItems.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}>
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.textMuted, width: 28, textAlign: 'center', marginRight: 10 }}>{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{item.song?.title ?? '—'}</Text>
                    {(item.song?.keySignature || item.song?.bpm) ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
                        {[item.song.keySignature, item.song.bpm ? `${item.song.bpm} BPM` : null].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                  {item.song?.durationSeconds ? (
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginRight: 10 }}>
                      {formatDuration(item.song.durationSeconds)}
                    </Text>
                  ) : null}
                  <TouchableOpacity onPress={() => removeItem({ id: item._id })}>
                    <Text style={{ fontSize: 14, color: Colors.textMuted }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                  {setlistItems.length} songs · {formatDuration(setlistItems.reduce((sum: number, i: any) => sum + (i.song?.durationSeconds ?? 0), 0))} total
                </Text>
              </View>
            </>
          )}
        </View>

      </ScrollView>

      {/* Song Picker Modal */}
      <Modal visible={showSongPicker} transparent animationType="slide" onRequestClose={() => setShowSongPicker(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, flex: 1 }}>Add Song</Text>
              <TouchableOpacity onPress={() => setShowSongPicker(false)}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 22, color: Colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {(allSongs ?? []).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 12 }}>No songs in your library yet</Text>
                  <TouchableOpacity
                    onPress={() => { setShowSongPicker(false); router.push('/(app)/setlist-add'); }}
                    style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Add songs to library</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                (allSongs ?? []).map((song: any) => {
                  const alreadyAdded = (setlistItems ?? []).some((i: any) => i.songId === song._id);
                  return (
                    <TouchableOpacity
                      key={song._id}
                      onPress={() => { if (!alreadyAdded) { handleAddSong(song._id); setShowSongPicker(false); } }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.border, opacity: alreadyAdded ? 0.4 : 1 }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>{song.title}</Text>
                        {(song.keySignature || song.bpm) ? (
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
                            {[song.keySignature, song.bpm ? `${song.bpm} BPM` : null].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                      {song.durationSeconds ? (
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginRight: 8 }}>{formatDuration(song.durationSeconds)}</Text>
                      ) : null}
                      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: alreadyAdded ? Colors.textMuted : Colors.accent }}>
                        {alreadyAdded ? 'Added' : '+ Add'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
