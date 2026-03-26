import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import Toast from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import ScreenContainer from '../../src/components/ScreenContainer';

const GENRES = ['Electronic', 'Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'R&B', 'Folk', 'Metal', 'Reggae', 'Country', 'Latin', 'Afrobeat', 'Punk', 'Soul', 'Indie', 'Dance', 'Ambient', 'World', 'Other'];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const artist = useQuery(api.artists.list);
  const artistData0 = artist?.[0];
  const storedAvatarId = artistData0?.avatarUrl;
  const storageUrl = useQuery(
    api.artists.getStorageUrl,
    storedAvatarId && !storedAvatarId.startsWith('http') && !storedAvatarId.startsWith('data') ? { storageId: storedAvatarId } : 'skip'
  );
  const updateProfile = useMutation(api.users.update);
  const updateArtist = useMutation(api.artists.update);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const saveFile = useMutation(api.assets.saveFile);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const { toast, showToast, hideToast } = useToast();

  // User profile fields
  const [displayName, setDisplayName] = useState('');

  // Artist fields
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [genre, setGenre] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const imagePickedRef = useRef(false);

  const artistData = artistData0;
  const displayAvatarUrl = imagePickedRef.current ? avatarUrl : (storageUrl ?? (storedAvatarId?.startsWith('http') ? storedAvatarId : null));
  const isArtist = profile?.role === 'artist';

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName ?? '');
  }, [profile]);

  useEffect(() => {
    if (artistData) {
      setArtistName(artistData.name ?? '');
      setBio(artistData.bio ?? '');
      setLocation(artistData.location ?? '');
      setCountry(artistData.country ?? '');
      setGenre(artistData.genre ?? '');
      setSubGenre(artistData.subGenre ?? '');
      setInstagram(artistData.instagramHandle ?? '');
      setSpotify(artistData.spotifyArtistId ?? '');
      setTiktok((artistData as any).tiktokHandle ?? '');
      setYoutube((artistData as any).youtubeHandle ?? '');
      setWebsite(artistData.websiteUrl ?? '');
      if (!imagePickedRef.current) setAvatarUrl(artistData.avatarUrl ?? '');
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
        imagePickedRef.current = true;
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Image pick error:', e);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() });

      if (isArtist && artistData?._id) {
        let finalAvatarUrl = artistData.avatarUrl ?? undefined;
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
              finalAvatarUrl = storageId;
            }
          } catch (e) {
            console.log('Image upload failed:', e);
          }
        }

        await updateArtist({
          id: artistData._id,
          name: artistName.trim() || artistData.name,
          bio: bio || undefined,
          location: location || undefined,
          country: country || undefined,
          genre: genre || undefined,
          subGenre: subGenre || undefined,
          instagramHandle: instagram || undefined,
          spotifyArtistId: spotify || undefined,
          tiktokHandle: tiktok || undefined,
          youtubeHandle: youtube || undefined,
          websiteUrl: website || undefined,
          avatarUrl: finalAvatarUrl,
        });
      }

      imagePickedRef.current = false;
      if (isArtist && artistName.trim() && !profile?.profileComplete) {
        await completeOnboarding();
      }
      showToast('Profile saved!');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 8 };
  const sectionStyle = { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 } as const;

  return (
    <ScreenContainer>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Profile</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>Manage your account and artist details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0, maxWidth: 680, width: '100%', alignSelf: 'center' }}>

        {/* Avatar */}
        {isArtist && (
          <TouchableOpacity onPress={handlePickImage} style={{ alignSelf: 'center', marginBottom: 24 }}>
            {displayAvatarUrl ? (
              <View>
                <Image source={{ uri: displayAvatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14 }}>✏️</Text>
                </View>
              </View>
            ) : (
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: `${Colors.accent}18`, borderWidth: 2, borderColor: `${Colors.accent}40`, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 32, color: Colors.accent }}>
                  {(artistName || displayName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 6 }}>
              {avatarUrl ? 'Change photo' : 'Add photo'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Account */}
        <View style={sectionStyle}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>👤 Account</Text>
          <Text style={labelStyle}>Display Name</Text>
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={Colors.textMuted} style={inputStyle} />
          <Text style={labelStyle}>Email</Text>
          <View style={{ ...inputStyle, marginBottom: 0 }}>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>{profile?.email ?? '—'}</Text>
          </View>
        </View>

        {isArtist ? (
          <>
            <View style={sectionStyle}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>🎤 Artist Profile</Text>
              <Text style={labelStyle}>Artist Name</Text>
              <TextInput value={artistName} onChangeText={setArtistName} placeholder="Your artist name" placeholderTextColor={Colors.textMuted} style={inputStyle} />
              <Text style={labelStyle}>Bio</Text>
              <TextInput value={bio} onChangeText={setBio} placeholder="Tell your story..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} style={{ ...inputStyle, height: 100, textAlignVertical: 'top' }} />
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
            </View>

            {/* Genre */}
            <View style={sectionStyle}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>🎵 Genre</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGenre(g === genre ? '' : g)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: genre === g ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: genre === g ? Colors.accent : Colors.border }}
                  >
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: genre === g ? '#000' : Colors.textMuted }}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {genre ? (
                <>
                  <Text style={{ ...labelStyle, marginTop: 16 }}>Subgenre</Text>
                  <TextInput value={subGenre} onChangeText={setSubGenre} placeholder="e.g. House, Trap, Indie..." placeholderTextColor={Colors.textMuted} style={inputStyle} />
                </>
              ) : null}
            </View>

            {/* Social */}
            <View style={sectionStyle}>
              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>�� Social Links</Text>
              {[
                { icon: '📸', label: 'Instagram', value: instagram, onChange: setInstagram, placeholder: '@handle' },
                { icon: '🎧', label: 'Spotify', value: spotify, onChange: setSpotify, placeholder: 'Artist ID' },
                { icon: '🎬', label: 'TikTok', value: tiktok, onChange: setTiktok, placeholder: '@handle' },
                { icon: '▶️', label: 'YouTube', value: youtube, onChange: setYoutube, placeholder: '@channel' },
                { icon: '🌐', label: 'Website', value: website, onChange: setWebsite, placeholder: 'https://...' },
              ].map((s) => (
                <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.surface2, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: Colors.border }}>
                    <Text style={{ fontSize: 18 }}>{s.icon}</Text>
                  </View>
                  <TextInput value={s.value} onChangeText={s.onChange} placeholder={s.placeholder} placeholderTextColor={Colors.textMuted} autoCapitalize="none" style={{ flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14 }} />
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Account info */}
        <View style={sectionStyle}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 12 }}>⚙️ Account Info</Text>
          {[
            { label: 'Role', value: profile?.role?.toUpperCase() ?? '—' },
            { label: 'Profile complete', value: profile?.profileComplete ? '✓ Yes' : '✗ No', color: profile?.profileComplete ? Colors.green : Colors.orange },
            { label: 'Member since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>{item.label}</Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: (item as any).color ?? Colors.textPrimary }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 }}
        >
          {saving ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Save Changes</Text>}
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          onPress={() => signOut()}
          style={{ borderWidth: 1, borderColor: `${Colors.accentRed}40`, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 }}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.accentRed }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
          Cobrex Artist Management OS
        </Text>

      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
