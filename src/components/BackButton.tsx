import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

interface Props {
  label?: string;
}

export default function BackButton({ label = 'Back' }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}>
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← {label}</Text>
    </TouchableOpacity>
  );
}
