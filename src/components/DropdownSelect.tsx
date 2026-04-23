import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export interface DropdownOption {
  value: string;
  label: string;
}

interface Props {
  options: DropdownOption[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  multi?: boolean;
  style?: object;
}

export default function DropdownSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multi = false,
  style,
}: Props) {
  const [open, setOpen] = useState(false);

  const isSelected = (v: string) =>
    multi ? (value as string[]).includes(v) : value === v;

  const handleSelect = (v: string) => {
    if (multi) {
      const current = value as string[];
      const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
      onChange(next);
    } else {
      onChange(v);
      setOpen(false);
    }
  };

  const getLabel = () => {
    if (multi) {
      const selected = (value as string[]).map(
        (v) => options.find((o) => o.value === v)?.label ?? v
      );
      return selected.length ? selected.join(', ') : placeholder;
    }
    return options.find((o) => o.value === value)?.label ?? placeholder;
  };

  const hasValue = multi ? (value as string[]).length > 0 : !!value;

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          backgroundColor: Colors.surface2,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 12,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: 'DMSans_400Regular',
            fontSize: 14,
            color: hasValue ? Colors.textPrimary : Colors.textMuted,
            marginRight: 8,
          }}
        >
          {getLabel()}
        </Text>
        <FontAwesome name="chevron-down" size={11} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 20,
              width: '100%',
              maxWidth: 440,
              maxHeight: 500,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'DMSans_700Bold',
                  fontSize: 15,
                  color: Colors.textPrimary,
                }}
              >
                {multi ? 'Select options' : 'Select'}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{
                  backgroundColor: multi ? Colors.accent : Colors.surface2,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans_600SemiBold',
                    fontSize: 13,
                    color: multi ? '#000' : Colors.textMuted,
                  }}
                >
                  {multi ? 'Done' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView bounces={false}>
              {options.map((opt, i) => {
                const selected = isSelected(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleSelect(opt.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: Colors.border,
                      backgroundColor: selected ? `${Colors.accent}10` : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: 'DMSans_400Regular',
                        fontSize: 14,
                        color: selected ? Colors.accent : Colors.textPrimary,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {multi ? (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          borderWidth: 2,
                          borderColor: selected ? Colors.accent : Colors.textMuted,
                          backgroundColor: selected ? Colors.accent : 'transparent',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {selected && <FontAwesome name="check" size={11} color="#000" />}
                      </View>
                    ) : (
                      selected && <FontAwesome name="check" size={13} color={Colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
