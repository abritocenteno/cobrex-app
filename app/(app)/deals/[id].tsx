import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Linking } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { useState } from 'react';

const PAYMENT_COLORS: Record<string, string> = {
  paid_in_full: Colors.green,
  deposit_paid: Colors.orange,
  unpaid: Colors.accentRed,
  overpaid: Colors.accentPurple,
  refunded: Colors.textMuted,
};

const DEAL_TYPE_ICONS: Record<string, string> = {
  live: '🎤', session: '🎙️', sync: '🎬', sponsorship: '🤝', other: '��',
};

function formatMoney(cents: number, currency = 'EUR') {
  return `${currency} ${(cents / 100).toLocaleString()}`;
}

export default function DealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const deal = useQuery(api.deals.get, id ? { id: id as any } : 'skip');
  const markDepositReceived = useMutation(api.deals.markDepositReceived);
  const markFullyPaid = useMutation(api.deals.markFullyPaid);
  const [depositInput, setDepositInput] = useState('');
  const [fullInput, setFullInput] = useState('');

  if (deal === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  if (!deal) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: Colors.textMuted }}>Deal not found</Text></View>;
  }

  const paymentColor = PAYMENT_COLORS[deal.paymentStatus] ?? Colors.textMuted;
  const pct = deal.agreedTotal > 0 ? Math.min(100, Math.round((deal.actualReceived ?? 0) / deal.agreedTotal * 100)) : 0;

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, flex: 1 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Deals</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>{DEAL_TYPE_ICONS[deal.dealType] ?? '📄'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 2, textTransform: 'capitalize' }}>{deal.dealType} Deal</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{new Date(deal._creationTime).toLocaleDateString()}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${paymentColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: paymentColor }}>{deal.paymentStatus?.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 700, width: '100%', alignSelf: 'center' }}>

        {/* Financial summary */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>�� Financials</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Agreed</Text>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.textPrimary }}>{formatMoney(deal.agreedTotal, deal.currency)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 12, padding: 14 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Received</Text>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.green }}>{formatMoney(deal.actualReceived ?? 0, deal.currency)}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ height: 8, backgroundColor: Colors.surface2, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <View style={{ height: 8, width: `${pct}%`, backgroundColor: pct === 100 ? Colors.green : Colors.accent, borderRadius: 4 }} />
          </View>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{pct}% received</Text>

          {deal.depositAmount && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 8 }}>
              Deposit: {formatMoney(deal.depositAmount, deal.currency)}
              {deal.depositReceivedAt ? ` · Received ${new Date(deal.depositReceivedAt).toLocaleDateString()}` : ' · Not yet received'}
            </Text>
          )}
        </View>

        {/* Mark deposit received */}
        {deal.paymentStatus === 'unpaid' && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>💳 Mark Deposit Received</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={depositInput}
                onChangeText={setDepositInput}
                placeholder={`Amount in ${deal.currency}`}
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={inputStyle}
              />
              <TouchableOpacity
                onPress={() => {
                  if (depositInput) {
                    markDepositReceived({ id: deal._id, amount: Math.round(parseFloat(depositInput) * 100) });
                    setDepositInput('');
                  }
                }}
                style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Mark</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mark fully paid */}
        {deal.paymentStatus !== 'paid_in_full' && deal.paymentStatus !== 'refunded' && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>✅ Mark Fully Paid</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={fullInput}
                onChangeText={setFullInput}
                placeholder={`Total in ${deal.currency}`}
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                style={inputStyle}
              />
              <TouchableOpacity
                onPress={() => {
                  const amount = fullInput ? Math.round(parseFloat(fullInput) * 100) : deal.agreedTotal;
                  markFullyPaid({ id: deal._id, total: amount });
                  setFullInput('');
                }}
                style={{ backgroundColor: Colors.green, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>Mark</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => markFullyPaid({ id: deal._id, total: deal.agreedTotal })}
              style={{ marginTop: 10, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: `${Colors.green}40` }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.green }}>Mark full agreed amount ({formatMoney(deal.agreedTotal, deal.currency)})</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        {deal.notes && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 10 }}>📝 Notes</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{deal.notes}</Text>
          </View>
        )}

        {/* Contract */}
        {deal.contractUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(deal.contractUrl!)}
            style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>📄</Text>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accentBlue, flex: 1 }}>View Contract</Text>
            <Text style={{ color: Colors.textMuted }}>↗</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}
