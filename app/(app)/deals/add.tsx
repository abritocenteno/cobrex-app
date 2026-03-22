import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import ScreenContainer from '../../../src/components/ScreenContainer';
import Toast from '../../../src/components/Toast';
import { useToast } from '../../../src/hooks/useToast';

const DEAL_TYPES = [
  { value: 'live', label: '🎤 Live' },
  { value: 'session', label: '🎙️ Session' },
  { value: 'sync', label: '🎬 Sync' },
  { value: 'sponsorship', label: '🤝 Sponsorship' },
  { value: 'other', label: '📄 Other' },
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export default function AddDeal() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const createDeal = useMutation(api.deals.create);
  const shows = useQuery(api.shows.list, profile?.artistId ? { artistId: profile.artistId } : 'skip');
  const contacts = useQuery(api.contacts.list, profile?.artistId ? { artistId: profile.artistId } : 'skip');

  const [dealType, setDealType] = useState('live');
  const [agreedTotal, setAgreedTotal] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [selectedPromoterId, setSelectedPromoterId] = useState<string | null>(null);
  const [contractUrl, setContractUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [error, setError] = useState('');

  const promoters = (contacts ?? []).filter((c: any) => c.contactType === 'promoter' || c.contactType === 'booking_agent');

  const handleCreate = async () => {
    if (!profile?.artistId) return;
    if (!agreedTotal.trim()) { setError('Agreed total is required'); return; }
    setLoading(true);
    setError('');
    try {
      await createDeal({
        artistId: profile.artistId,
        dealType,
        agreedTotal: Math.round(parseFloat(agreedTotal) * 100),
        depositAmount: depositAmount ? Math.round(parseFloat(depositAmount) * 100) : undefined,
        currency,
        showId: selectedShowId as any ?? undefined,
        promoterId: selectedPromoterId as any ?? undefined,
        contractUrl: contractUrl || undefined,
        notes: notes || undefined,
      });
      showToast('Deal created!');
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create deal');
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
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, flex: 1 }}>New Deal</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading} style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
          {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        <Text style={labelStyle}>Deal Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {DEAL_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setDealType(t.value)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: dealType === t.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: dealType === t.value ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: dealType === t.value ? '#000' : Colors.textMuted }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={labelStyle}>Currency</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCurrency(c)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: currency === c ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: currency === c ? Colors.accent : Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: currency === c ? '#000' : Colors.textMuted }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Agreed Total *</Text>
            <TextInput value={agreedTotal} onChangeText={setAgreedTotal} placeholder="1500.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Deposit Amount</Text>
            <TextInput value={depositAmount} onChangeText={setDepositAmount} placeholder="500.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" style={inputStyle} />
          </View>
        </View>

        {/* Link to show */}
        {(shows ?? []).length > 0 && (
          <>
            <Text style={labelStyle}>Link to Show</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedShowId(null)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedShowId === null ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: selectedShowId === null ? Colors.accent : Colors.border }}
                >
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: selectedShowId === null ? '#000' : Colors.textMuted }}>None</Text>
                </TouchableOpacity>
                {(shows ?? []).slice(0, 10).map((s: any) => (
                  <TouchableOpacity
                    key={s._id}
                    onPress={() => setSelectedShowId(s._id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedShowId === s._id ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: selectedShowId === s._id ? Colors.accent : Colors.border }}
                  >
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: selectedShowId === s._id ? '#000' : Colors.textMuted }}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Link to promoter */}
        {promoters.length > 0 && (
          <>
            <Text style={labelStyle}>Promoter</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedPromoterId(null)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedPromoterId === null ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: selectedPromoterId === null ? Colors.accent : Colors.border }}
                >
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: selectedPromoterId === null ? '#000' : Colors.textMuted }}>None</Text>
                </TouchableOpacity>
                {promoters.map((p: any) => (
                  <TouchableOpacity
                    key={p._id}
                    onPress={() => setSelectedPromoterId(p._id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedPromoterId === p._id ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: selectedPromoterId === p._id ? Colors.accent : Colors.border }}
                  >
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: selectedPromoterId === p._id ? '#000' : Colors.textMuted }}>{p.displayName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <Text style={labelStyle}>Contract URL</Text>
        <TextInput value={contractUrl} onChangeText={setContractUrl} placeholder="https://..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" style={inputStyle} />

        <Text style={labelStyle}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Any notes..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }} />
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
