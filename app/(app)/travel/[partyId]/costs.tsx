import { useQuery } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';

function fmtCost(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function CategoryCard({
  icon,
  label,
  total,
  currency,
  items,
}: {
  icon: string;
  label: string;
  total: number;
  currency: string;
  items: Array<{ _id: string; label: string; cost: number; currency: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
          <FontAwesome name={icon as any} size={14} color={Colors.accent} />
        </View>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, flex: 1 }}>{label}</Text>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary }}>
          {fmtCost(total, currency)}
        </Text>
      </View>
      {items.map((item, i) => (
        <View
          key={item._id}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: Colors.border }}
        >
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textPrimary, flex: 1 }} numberOfLines={1}>
            {item.label}
          </Text>
          {item.cost > 0 ? (
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textPrimary }}>
              {fmtCost(item.cost, item.currency)}
            </Text>
          ) : (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>No cost entered</Text>
          )}
        </View>
      ))}
    </View>
  );
}

export default function CostsScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const id = partyId as Id<'tourParties'>;

  const party = useQuery(api.travel.getTourParty, { id });
  const summary = useQuery(api.travel.travelCostSummary, { tourPartyId: id });

  if (summary === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  const hasCosts = summary && summary.grandTotal > 0;
  const hasItems =
    summary &&
    (summary.flights.items.length > 0 || summary.hotels.items.length > 0 || summary.transport.items.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Travel Costs</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{party?.name ?? ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {/* Grand total card */}
        {hasCosts && summary && (
          <View style={{ backgroundColor: `${Colors.accent}12`, borderWidth: 1, borderColor: `${Colors.accent}30`, borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Total Cost
            </Text>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 32, color: Colors.textPrimary }}>
              {fmtCost(summary.grandTotal, summary.primaryCurrency)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 14 }}>
              {summary.flights.total > 0 && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Flights</Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary }}>{fmtCost(summary.flights.total, summary.primaryCurrency)}</Text>
                </View>
              )}
              {summary.hotels.total > 0 && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Hotels</Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary }}>{fmtCost(summary.hotels.total, summary.primaryCurrency)}</Text>
                </View>
              )}
              {summary.transport.total > 0 && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Transport</Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary }}>{fmtCost(summary.transport.total, summary.primaryCurrency)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!hasItems ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="dollar" size={36} color={Colors.textMuted} style={{ marginBottom: 14 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 8 }}>No bookings yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
              Add flights, hotels, and transport to this party. Cost fields appear in each booking form.
            </Text>
          </View>
        ) : (
          <>
            {summary && (
              <>
                <CategoryCard
                  icon="plane"
                  label="Flights"
                  total={summary.flights.total}
                  currency={summary.primaryCurrency}
                  items={summary.flights.items}
                />
                <CategoryCard
                  icon="building"
                  label="Hotels"
                  total={summary.hotels.total}
                  currency={summary.primaryCurrency}
                  items={summary.hotels.items}
                />
                <CategoryCard
                  icon="car"
                  label="Transport"
                  total={summary.transport.total}
                  currency={summary.primaryCurrency}
                  items={summary.transport.items}
                />
              </>
            )}

            {!hasCosts && (
              <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginTop: 4 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 18 }}>
                  Add cost amounts when creating or editing flights, hotels, and transport jobs to see the budget total here.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
