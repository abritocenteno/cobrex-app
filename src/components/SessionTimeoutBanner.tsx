import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  secondsRemaining: number;
  onKeepAlive: () => void;
}

export default function SessionTimeoutBanner({ secondsRemaining, onKeepAlive }: Props) {
  return (
    <View style={{
      backgroundColor: '#5B21B6',
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Text style={{
        fontFamily: 'DMSans_400Regular',
        fontSize: 13,
        color: '#fff',
        flex: 1,
        lineHeight: 18,
      }}>
        Your session will expire in {secondsRemaining}s. Your draft has been saved.
      </Text>
      <TouchableOpacity
        onPress={onKeepAlive}
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          marginLeft: 12,
        }}
      >
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#fff' }}>
          Keep signed in
        </Text>
      </TouchableOpacity>
    </View>
  );
}
