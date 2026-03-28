import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { DRAFT_LABELS } from '../hooks/useDraftSave';

interface Props {
  draftKey: string;
  ts: number;
  onRestore: () => void;
  onDiscard: () => void;
}

export default function DraftRestorePrompt({ draftKey, ts, onRestore, onDiscard }: Props) {
  const label = DRAFT_LABELS[draftKey] ?? 'unsaved work';
  const minutesAgo = Math.round((Date.now() - ts) / 60_000);
  const timeLabel = minutesAgo < 60
    ? `${minutesAgo}m ago`
    : `${Math.round(minutesAgo / 60)}h ago`;

  return (
    <View style={{
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: `${Colors.accent}50`,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 22, marginRight: 12 }}>📝</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 }}>
          Your session expired
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
          Restore your {label} draft ({timeLabel})?
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDiscard}
        style={{ padding: 8, marginRight: 4 }}
      >
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Discard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onRestore}
        style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
      >
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.bg }}>Restore</Text>
      </TouchableOpacity>
    </View>
  );
}
