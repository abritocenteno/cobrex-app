import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Colors } from '../../src/constants/colors';

const ASSET_TYPE_LABELS: Record<string, string> = {
  tech_rider: 'Tech Rider',
  stage_plot: 'Stage Plot',
  input_list: 'Input List',
  hospitality_rider: 'Hospitality Rider',
  press_photo: 'Press Photo',
  biography: 'Biography',
  contract: 'Contract',
  invoice: 'Invoice',
  other: 'Document',
};

const ASSET_ICONS: Record<string, string> = {
  tech_rider: '🎛️',
  stage_plot: '🗺️',
  input_list: '🎚️',
  hospitality_rider: '🛎️',
  press_photo: '📸',
  biography: '📄',
  contract: '📑',
  invoice: '🧾',
  other: '📁',
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SharedAsset() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const asset = useQuery(api.assets.getByToken, token ? { token } : 'skip');

  if (asset === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 32, color: Colors.accent, letterSpacing: 4, marginBottom: 32 }}>COBREX</Text>

      {!asset ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8 }}>Link unavailable</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>
            This link has expired or been revoked.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, alignItems: 'center' }}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>
            {ASSET_ICONS[asset.assetType] ?? '📁'}
          </Text>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 }}>
            {asset.name}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 4 }}>
            {ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType}
          </Text>
          {formatBytes(asset.fileSizeBytes) ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 20 }}>
              {formatBytes(asset.fileSizeBytes)}
            </Text>
          ) : <View style={{ marginBottom: 20 }} />}

          {asset.fileUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(asset.fileUrl!)}
              style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Open / Download</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>No file attached</Text>
            </View>
          )}

          {asset.shareExpiresAt ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 16 }}>
              Expires {new Date(asset.shareExpiresAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      )}

      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, letterSpacing: 2, marginTop: 32 }}>
        ARTIST MANAGEMENT OS
      </Text>
    </View>
  );
}
