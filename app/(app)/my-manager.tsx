import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import ScreenContainer from '../../src/components/ScreenContainer';

export default function MyManagerScreen() {
  const profile = useQuery(api.users.myProfile);
  const artistData = useQuery(api.artists.list);
  const artist = artistData?.[0];

  const invites = useQuery(
    api.rosterInvites.forArtist,
    artist?._id ? { artistId: artist._id } : 'skip'
  );
  const managers = useQuery(api.manager.list);
  const sendRequest = useMutation(api.rosterInvites.send);
  const respond = useMutation(api.rosterInvites.respond);
  const retract = useMutation(api.rosterInvites.retract);

  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [retractingId, setRetractingId] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const incomingInvites = (invites ?? []).filter(
    (inv: any) => inv.direction === 'manager_to_artist' && inv.status === 'pending'
  );
  const pendingRequests = (invites ?? []).filter(
    (inv: any) => inv.direction === 'artist_to_manager' && inv.status === 'pending'
  );

  const currentManagerId = profile?.managerProfileId;
  const currentManager = (managers ?? []).find(
    (m: any) => m._id === currentManagerId
  );

  const filteredManagers = (managers ?? []).filter((m: any) => {
    if (m._id === currentManagerId) return false;
    if (!search.trim()) return true;
    return (m.companyName ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const handleRequest = async (managerId: string) => {
    if (!artist?._id) return;
    setSending(managerId);
    setError('');
    try {
      await sendRequest({
        managerId: managerId as any,
        artistId: artist._id,
        direction: 'artist_to_manager',
        message: message.trim() || undefined,
      });
      setSent((prev) => new Set([...prev, managerId]));
    } catch (e: any) {
      setError(e.message ?? 'Failed to send request');
    } finally {
      setSending(null);
    }
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingId(inviteId);
    try {
      await respond({ inviteId: inviteId as any, accept });
    } finally {
      setRespondingId(null);
    }
  };

  const handleRetract = async (inviteId: string) => {
    setRetractingId(inviteId);
    try {
      await retract({ inviteId: inviteId as any });
    } finally {
      setRetractingId(null);
    }
  };

  if (profile === undefined || artistData === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>My Manager</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
          {currentManager ? 'Your current management' : 'Find and connect with a manager'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0, maxWidth: 640, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">

        {/* Current manager */}
        {currentManager ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: `${Colors.green}40`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <FontAwesome name="bullseye" size={22} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary }}>{currentManager.companyName ?? 'Your Manager'}</Text>
                {currentManager.territory ? (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>Territory: {currentManager.territory}</Text>
                ) : null}
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${Colors.green}18` }}>
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: Colors.green }}>Signed</Text>
              </View>
            </View>
            <View style={{ marginTop: 14, flexDirection: 'row', gap: 16 }}>
              {currentManager.email ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                  <FontAwesome name="envelope-o" size={12} color={Colors.textMuted} /> {currentManager.email}
                </Text>
              ) : null}
              {currentManager.phone ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                  <FontAwesome name="phone" size={12} color={Colors.textMuted} /> {currentManager.phone}
                </Text>
              ) : null}
              {currentManager.commissionRate ? (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                  Commission: {currentManager.commissionRate}%
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Incoming invites from managers */}
        {incomingInvites.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
              Manager Invites
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.accent }}> · {incomingInvites.length}</Text>
            </Text>
            {incomingInvites.map((inv: any) => (
              <View key={inv._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: `${Colors.accent}40`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <FontAwesome name="bullseye" size={18} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary }}>
                      {inv.managerProfile?.companyName ?? 'A manager'}
                    </Text>
                    {inv.managerProfile?.territory ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                        {inv.managerProfile.territory}
                      </Text>
                    ) : null}
                    {inv.message ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                        "{inv.message}"
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleRespond(inv._id, true)}
                    disabled={respondingId === inv._id}
                    style={{ flex: 1, backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    {respondingId === inv._id
                      ? <ActivityIndicator color="#000" size="small" />
                      : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Accept</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRespond(inv._id, false)}
                    disabled={respondingId === inv._id}
                    style={{ flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending outgoing requests */}
        {pendingRequests.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
              Sent Requests
            </Text>
            {pendingRequests.map((inv: any) => (
              <View key={inv._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <FontAwesome name="bullseye" size={16} color={Colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>
                    {inv.managerProfile?.companyName ?? 'Manager'}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>Awaiting response</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRetract(inv._id)}
                  disabled={retractingId === inv._id}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border }}
                >
                  {retractingId === inv._id
                    ? <ActivityIndicator color={Colors.textMuted} size="small" />
                    : <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>Cancel</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Browse managers */}
        <View>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>
            {currentManager ? 'Other Managers' : 'Find a Manager'}
          </Text>

          {/* Optional message */}
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Request Message (optional)
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Introduce yourself briefly..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={2}
            style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, height: 72, textAlignVertical: 'top', marginBottom: 14 }}
          />

          {/* Search */}
          <View style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 16 }}>
            <FontAwesome name="search" size={14} color={Colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Filter by agency name..."
              placeholderTextColor={Colors.textMuted}
              style={{ flex: 1, paddingVertical: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }}
            />
          </View>

          {error ? (
            <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</Text>
          ) : null}

          {managers === undefined ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 20 }} />
          ) : filteredManagers.length === 0 ? (
            <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 32, alignItems: 'center' }}>
              <FontAwesome name="bullseye" size={32} color={Colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>No managers found</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
                {search ? 'Try a different search' : 'No managers have signed up yet'}
              </Text>
            </View>
          ) : (
            filteredManagers.map((mgr: any) => {
              const isSent = sent.has(mgr._id);
              const isSending = sending === mgr._id;
              const alreadyPending = pendingRequests.some((r: any) => r.managerId === mgr._id);
              return (
                <View key={mgr._id} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <FontAwesome name="bullseye" size={20} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary }}>{mgr.companyName ?? 'Agency'}</Text>
                    {mgr.territory ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{mgr.territory}</Text>
                    ) : null}
                    {mgr.commissionRate ? (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>{mgr.commissionRate}% commission</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRequest(mgr._id)}
                    disabled={isSent || isSending || alreadyPending}
                    style={{
                      backgroundColor: (isSent || alreadyPending) ? `${Colors.green}18` : Colors.accent,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: (isSent || alreadyPending) ? 1 : 0,
                      borderColor: (isSent || alreadyPending) ? Colors.green : 'transparent',
                      opacity: isSending ? 0.7 : 1,
                    }}
                  >
                    {isSending ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (isSent || alreadyPending) ? (
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.green }}>Requested</Text>
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Request</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
