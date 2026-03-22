import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onSkip?: () => void;
}

export default function OnboardingHeader({ step, totalSteps, title, subtitle, onSkip }: Props) {
  const router = useRouter();
  const pct = (step / totalSteps) * 100;

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
      {/* Progress */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.textMuted }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, height: 4, backgroundColor: Colors.surface2, borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ height: 4, width: `${pct}%`, backgroundColor: Colors.accent, borderRadius: 2 }} />
        </View>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>{step}/{totalSteps}</Text>
        {onSkip && (
          <TouchableOpacity onPress={onSkip}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textMuted }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>{title}</Text>
      {subtitle && <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{subtitle}</Text>}
    </View>
  );
}
