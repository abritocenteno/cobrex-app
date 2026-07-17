import { useQuery, useMutation, useAction } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Share, Alert } from 'react-native';
import { Colors } from '../../src/constants/colors';
import EmptyState from '../../src/components/EmptyState';
import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

const ASSET_TYPE_ICONS: Record<string, string> = {
  tech_rider: 'sliders',
  stage_plot: 'map',
  press_photo: 'camera',
  press_kit: 'newspaper-o',
  contract: 'file-text-o',
  invoice: 'file-text-o',
  setlist: 'music',
  hospitality_rider: 'cutlery',
  other: 'folder',
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

// Field label overrides for cleaner display
const FIELD_LABELS: Record<string, string> = {
  setTime: 'Set Time',
  setEndTime: 'Set End',
  setLengthMinutes: 'Set Length',
  stage: 'Stage',
  loadInTime: 'Load-in',
  soundcheckTime: 'Soundcheck',
  doorsTime: 'Doors',
  stageManager: 'Stage Manager',
  fohEngineer: 'FOH Engineer',
  productionContact: 'Production',
  cateringInfo: 'Catering',
  dressingRoom: 'Dressing Room',
  totalFee: 'Total Fee',
  depositAmount: 'Deposit',
  currency: 'Currency',
  dealType: 'Deal Type',
  depositDueDate: 'Deposit Due',
  balanceDueDate: 'Balance Due',
  settlementTiming: 'Settlement',
  promoterName: 'Promoter',
  venueName: 'Venue',
  showDate: 'Show Date',
  cancellationPolicy: 'Cancellation',
  paymentTerms: 'Payment Terms',
  loadIn: 'Load-in',
  loadOut: 'Load-out',
  curfew: 'Curfew',
  stageSpecs: 'Stage Specs',
  paSystem: 'PA System',
  crewRequirements: 'Crew',
  cateringNotes: 'Catering',
  notes: 'Notes',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function ExtractedDataCard({ data, role }: { data: any; role: string }) {
  const entries = Object.entries(data as Record<string, unknown>).filter(([, v]) => {
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <FontAwesome name="magic" size={11} color={Colors.accent} />
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: Colors.accent, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          AI Extracted
        </Text>
      </View>
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <View key={key} style={{ marginBottom: 8 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, marginBottom: 4 }}>
                {toLabel(key)}
              </Text>
              {(value as any[]).map((item, i) => (
                <View key={i} style={{ paddingLeft: 10, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: `${Colors.accent}40` }}>
                  {typeof item === 'object' && item !== null
                    ? Object.entries(item as Record<string, unknown>)
                        .filter(([, v]) => v !== null && v !== undefined && v !== '')
                        .map(([k, v]) => (
                          <Text key={k} style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textPrimary }}>
                            <Text style={{ color: Colors.textMuted }}>{toLabel(k)}: </Text>
                            {String(v)}
                          </Text>
                        ))
                    : <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textPrimary }}>{String(item)}</Text>
                  }
                </View>
              ))}
            </View>
          );
        }
        return (
          <View key={key} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, minWidth: 90 }}>
              {toLabel(key)}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textPrimary, flex: 1 }}>
              {key === 'setLengthMinutes' ? `${value} min` : String(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
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

  const userRole = (profile?.role ?? 'artist') as 'artist' | 'manager' | 'venue';

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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {types.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: typeFilter === t ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: typeFilter === t ? Colors.accent : Colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              {t !== 'all' && <FontAwesome name={(ASSET_TYPE_ICONS[t] ?? 'folder') as any} size={11} color={typeFilter === t ? '#000' : Colors.textMuted} />}
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: typeFilter === t ? '#000' : Colors.textMuted }}>
                {t === 'all' ? 'All' : ASSET_TYPE_LABELS[t] ?? t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {assets === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <FontAwesome name="folder" size={40} color={Colors.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No assets found</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Upload your first file to get started</Text>
          </View>
        ) : typeFilter === 'all' ? (
          // Grouped view
          Object.entries(grouped).map(([type, items]) => (
            <View key={type} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <FontAwesome name={(ASSET_TYPE_ICONS[type] ?? 'folder') as any} size={12} color={Colors.textMuted} />
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {ASSET_TYPE_LABELS[type] ?? type} ({items.length})
                </Text>
              </View>
              {items.map((asset: any) => <AssetCard key={asset._id} asset={asset} userRole={userRole} />)}
            </View>
          ))
        ) : (
          filtered.map((asset: any) => <AssetCard key={asset._id} asset={asset} userRole={userRole} />)
        )}
      </ScrollView>
    </View>
  );
}

function AssetCard({ asset, userRole }: { asset: any; userRole: 'artist' | 'manager' | 'venue' }) {
  const createShareLink = useMutation(api.assets.createShareLink);
  const extractInfo = useAction(api.extractAsset.extractFromAsset);
  const [sharing, setSharing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isPdf = asset.mimeType === 'application/pdf';
  const isImage = asset.mimeType === 'image/png' || asset.mimeType === 'image/jpeg';
  const canExtract = !!asset.storageId && (isPdf || isImage);
  const hasExtraction = asset.extractionStatus === 'done' && asset.extractedData;
  const isPending = asset.extractionStatus === 'pending' || extracting;
  const hasError = asset.extractionStatus === 'error';

  const handleShare = async () => {
    setSharing(true);
    try {
      let token = asset.shareToken;
      if (!token || (asset.shareExpiresAt && asset.shareExpiresAt < Date.now())) {
        token = await createShareLink({ id: asset._id, expiryDays: 30 });
      }
      const url = `https://cobrex-app.vercel.app/share/${token}`;
      await Share.share({ message: url, url });
    } finally {
      setSharing(false);
    }
  };

  const handleExtract = async () => {
    setExtracting(true);
    try {
      await extractInfo({ assetId: asset._id, userRole });
    } catch (err: any) {
      Alert.alert('Extraction failed', err?.message ?? 'Something went wrong');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: hasExtraction ? `${Colors.accent}30` : Colors.border, borderRadius: 12, padding: 16, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => asset.fileUrl && Linking.openURL(asset.fileUrl)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
            <FontAwesome name={(ASSET_TYPE_ICONS[asset.assetType] ?? 'folder') as any} size={22} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>{asset.name}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted }}>
              v{asset.versionNumber} · {asset.fileSizeBytes ? formatBytes(asset.fileSizeBytes) : 'Link'}
              {asset.isPublic ? ' · Shared' : ''}
              {hasExtraction ? ' · AI Extracted' : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {canExtract && (
            <TouchableOpacity
              onPress={isPending ? undefined : handleExtract}
              disabled={isPending}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: hasExtraction ? `${Colors.accent}18` : Colors.surface2,
                borderWidth: 1,
                borderColor: hasExtraction ? `${Colors.accent}40` : Colors.border,
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.accent} style={{ width: 14, height: 14 }} />
              ) : (
                <FontAwesome name="magic" size={14} color={hasExtraction ? Colors.accent : Colors.textMuted} />
              )}
            </TouchableOpacity>
          )}

          {hasExtraction && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border }}
            >
              <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: asset.isPublic ? `${Colors.accent}18` : Colors.surface2, borderWidth: 1, borderColor: asset.isPublic ? `${Colors.accent}40` : Colors.border }}
          >
            <FontAwesome name="link" size={14} color={asset.isPublic ? Colors.accent : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {hasError && !expanded && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#ef4444', marginTop: 8 }}>
          Extraction error: {asset.extractionError}
        </Text>
      )}

      {hasExtraction && expanded && (
        <ExtractedDataCard data={asset.extractedData} role={userRole} />
      )}
    </View>
  );
}
