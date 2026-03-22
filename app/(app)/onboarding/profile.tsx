import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';

export default function OnboardingProfile() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const artist = useQuery(api.artists.list);
  const updateArtist = useMutation(api.artists.update);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  const artistData = artist?.[0];

  useEffect(() => {
    if (artistData) {
      setName(artistData.name ?? '');
      setBio(artistData.bio ?? '');
      setLocation(artistData.location ?? '');
      setCountry(artistData.country ?? '');
      setAvatarUrl(artistData.avatarUrl ?? '');
    }
  }, [artistData]);

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAvatarUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setAvatarUrl(asset.uri);
        }
      }
    } catch (e) {
      console.log('Image pick error:', e);
    }
  };

  const handleNext = async () => {
    if (!artistData?._id) return;
    setLoading(true);
    try {
      await updateArtist({
        id: artistData._id,
        name: name.trim() || artistData.name,
        bio: bio || undefined,
        location: location || undefined,
        country: country || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      router.push('/(app)/onboarding/genre');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 16 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={1} totalSteps={5} title="Artist Profile" subtitle="Tell us about yourself so venues and promoters know who you are." onSkip={() => router.push('/(app)/onboarding/genre')} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>

        {/* Avatar */}
        <TouchableOpacity onPress={handlePickImage} style={{ alignSelf: 'center', marginBottom: 28 }}>
          {avatarUrl ? (
            <View>
              <Image source={{ uri: avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} />
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14 }}>✏️</Text>
              </View>
            </View>
          ) : (
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: `${Colors.accent}18`, borderWidth: 2, borderColor: `${Colors.accent}40`, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
              {uploadingImage ? <ActivityIndicator color={Colors.accent} /> : <Text style={{ fontSize: 32 }}>📷</Text>}
            </View>
          )}
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            {avatarUrl ? 'Change photo' : 'Add photo'}
          </Text>
        </TouchableOpacity>

        <Text style={labelStyle}>Artist Name *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your artist name" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        <Text style={labelStyle}>Bio</Text>
        <TextInput value={bio} onChangeText={setBio} placeholder="Tell your story in a few sentences..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} style={{ ...inputStyle, height: 110, textAlignVertical: 'top' }} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>City</Text>
            <TextInput value={location} onChangeText={setLocation} placeholder="Amsterdam" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Country</Text>
            <TextInput value={country} onChangeText={setCountry} placeholder="Netherlands" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={loading || !name.trim()}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: !name.trim() ? 0.5 : 1 }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Next →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
