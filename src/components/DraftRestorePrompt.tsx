import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { DRAFT_LABELS } from '../hooks/useDraftSave';
import { FontAwesome } from '@expo/vector-icons';

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
      <FontAwesome name="pencil-square-o" size={22} color={Colors.textPrimary} style={{ marginRight: 12 }} />
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
