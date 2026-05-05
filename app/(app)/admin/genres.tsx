import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import ScreenContainer from '../../../src/components/ScreenContainer';

export default function AdminGenresScreen() {
  const router = useRouter();
  const pending = useQuery(api.genres.adminListPending);
  const review = useMutation(api.genres.adminReview);

  const handleReview = async (id: any, approve: boolean) => {
    try {
      await review({ id, approve });
    } catch (e: any) {
      console.error(e.message);
    }
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 8, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Genre Review</Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Admin — approve or reject submitted genres</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 48 }}>
        {pending === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : pending.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <FontAwesome name="check-circle" size={40} color={Colors.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 6 }}>All clear</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>No pending genre submissions</Text>
          </View>
        ) : (
          pending.map((genre) => (
            <View
              key={genre._id}
              style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary }}>{genre.name}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                  Submitted {new Date(genre.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleReview(genre._id, false)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: `${Colors.accentRed}18`, borderWidth: 1, borderColor: `${Colors.accentRed}40` }}
                >
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.accentRed }}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReview(genre._id, true)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.accent }}
                >
                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#000' }}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
