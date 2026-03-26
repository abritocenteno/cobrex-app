import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';

export default function OnboardingProfile() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const artist = useQuery(api.artists.list);
  const updateArtist = useMutation(api.artists.update);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const imagePickedRef = useRef(false);

  const artistData = artist?.[0];
  const storedAvatarId = artistData?.avatarUrl;
  const storageUrl = useQuery(
    api.artists.getStorageUrl,
    storedAvatarId && !storedAvatarId.startsWith('http') && !storedAvatarId.startsWith('data')
      ? { storageId: storedAvatarId }
      : 'skip'
  );
  const displayAvatarUrl = imagePickedRef.current ? avatarUrl : (storageUrl ?? (storedAvatarId?.startsWith('http') ? storedAvatarId : null));

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
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri);
        imagePickedRef.current = true;
      }
    } catch (e) {
      console.log('Image pick error:', e);
    }
  };

  const handleNext = async () => {
    if (!artistData?._id) return;
    setLoading(true);
    try {
      let finalAvatarUrl = artistData.avatarUrl ?? undefined;

      // Upload image to Convex storage if a new one was selected
      if (avatarUrl && avatarUrl !== artistData.avatarUrl && !avatarUrl.startsWith('http')) {
        try {
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(avatarUrl);
          const blob = await response.blob();
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': blob.type || 'image/jpeg' },
            body: blob,
          });
          if (uploadResponse.ok) {
            const { storageId } = await uploadResponse.json();
            // Get public URL - use storageId as URL reference
            finalAvatarUrl = storageId;
          }
        } catch (e) {
          console.log('Image upload failed, skipping:', e);
        }
      }

      await updateArtist({
        id: artistData._id,
        name: name.trim() || artistData.name,
        bio: bio || undefined,
        location: location || undefined,
        country: country || undefined,
        avatarUrl: finalAvatarUrl,
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
          {displayAvatarUrl ? (
            <View>
              <Image source={{ uri: displayAvatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} />
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
            {displayAvatarUrl ? 'Change photo' : 'Add photo'}
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
