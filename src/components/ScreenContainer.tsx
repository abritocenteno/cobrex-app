import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function ScreenContainer({ children, scrollable = true }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
