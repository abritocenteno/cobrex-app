import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', confirmColor = Colors.accentRed, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 24, lineHeight: 22 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: `${confirmColor}18`, borderWidth: 1, borderColor: `${confirmColor}40` }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: confirmColor }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
