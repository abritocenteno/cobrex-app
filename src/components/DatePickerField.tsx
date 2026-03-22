import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';

interface Props {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

function formatDisplay(dateStr: string) {
  if (!dateStr) return 'Select date';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('default', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

function toDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  return new Date(dateStr + 'T00:00:00');
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DatePickerField({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(toDate(value));

  const labelStyle = {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
    marginTop: 4,
  };

  if (Platform.OS === 'web') {
    // Web: use native HTML date input
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={labelStyle}>{label}</Text>
        <View style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14 }}>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: Colors.textPrimary,
              fontFamily: 'DMSans_400Regular',
              fontSize: 14,
              width: '100%',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </View>
      </View>
    );
  }

  // iOS/Android
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={labelStyle}>{label}</Text>
      <TouchableOpacity
        onPress={() => { setTempDate(toDate(value)); setShow(true); }}
        style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: value ? Colors.textPrimary : Colors.textMuted }}>
          {value ? formatDisplay(value) : 'Select date'}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.textMuted }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary }}>{label}</Text>
                <TouchableOpacity onPress={() => { onChange(toDateString(tempDate)); setShow(false); }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.accent }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => date && setTempDate(date)}
                style={{ backgroundColor: Colors.surface }}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShow(false);
              if (date) onChange(toDateString(date));
            }}
          />
        )
      )}
    </View>
  );
}
