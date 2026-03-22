import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 8 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: actionLabel ? 24 : 0 }}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
