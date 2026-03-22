import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../src/constants/colors';
import EmptyState from '../../src/components/EmptyState';
import { useState } from 'react';

const ASSET_TYPE_ICONS: Record<string, string> = {
  tech_rider: '🎚️',
  stage_plot: '��️',
  press_photo: '📷',
  press_kit: '📰',
  contract: '📄',
  invoice: '🧾',
  setlist: '🎵',
  hospitality_rider: '🍽️',
  other: '📁',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  tech_rider: 'Tech Rider',
  stage_plot: 'Stage Plot',
  press_photo: 'Press Photo',
  press_kit: 'Press Kit',
  contract: 'Contract',
  invoice: 'Invoice',
  setlist: 'Setlist',
  hospitality_rider: 'Hospitality Rider',
  other: 'Other',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetsScreen() {
  const profile = useQuery(api.users.myProfile);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState('all');

  const assets = useQuery(
    api.assets.list,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  const types = ['all', ...Array.from(new Set((assets ?? []).map((a: any) => a.assetType)))];

  const filtered = (assets ?? []).filter((a: any) =>
    typeFilter === 'all' ? true : a.assetType === typeFilter
  );

  const grouped = filtered.reduce((acc: Record<string, any[]>, asset: any) => {
    const type = asset.assetType ?? 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {});

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Assets</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1 }}>
            {(assets ?? []).length} files
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/assets-add')}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add Asset</Text>
          </TouchableOpacity>
        </View>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {types.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTypeFilter(t)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: typeFilter === t ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: typeFilter === t ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: typeFilter === t ? '#000' : Colors.textMuted }}>
                  {t === 'all' ? 'All' : `${ASSET_TYPE_ICONS[t] ?? '📁'} ${ASSET_TYPE_LABELS[t] ?? t}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {assets === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>��</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No assets found</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Upload your first file to get started</Text>
          </View>
        ) : typeFilter === 'all' ? (
          // Grouped view
          Object.entries(grouped).map(([type, items]) => (
            <View key={type} style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>
                {ASSET_TYPE_ICONS[type] ?? '📁'} {ASSET_TYPE_LABELS[type] ?? type} ({items.length})
              </Text>
              {items.map((asset: any) => <AssetCard key={asset._id} asset={asset} />)}
            </View>
          ))
        ) : (
          filtered.map((asset: any) => <AssetCard key={asset._id} asset={asset} />)
        )}
      </ScrollView>
    </View>
  );
}

function AssetCard({ asset }: { asset: any }) {
  return (
    <TouchableOpacity
      onPress={() => asset.fileUrl && Linking.openURL(asset.fileUrl)}
      style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
        <Text style={{ fontSize: 22 }}>{ASSET_TYPE_ICONS[asset.assetType] ?? '📁'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>{asset.name}</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>
          v{asset.versionNumber} · {asset.fileSizeBytes ? formatBytes(asset.fileSizeBytes) : 'Unknown size'}
          {asset.isPublic ? ' · Public' : ''}
        </Text>
      </View>
      {asset.fileUrl && (
        <Text style={{ fontSize: 16, color: Colors.textMuted }}>↗</Text>
      )}
    </TouchableOpacity>
  );
}
