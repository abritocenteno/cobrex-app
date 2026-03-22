import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../../src/constants/colors';
import OnboardingHeader from '../../../src/components/OnboardingHeader';
import { useMutation as useConvexMutation } from 'convex/react';

const COMMON_ASSETS = [
  { value: 'tech_rider', label: '🎚️ Tech Rider' },
  { value: 'stage_plot', label: '🗺️ Stage Plot' },
  { value: 'press_kit', label: '📰 Press Kit' },
  { value: 'press_photo', label: '📷 Press Photo' },
];

export default function OnboardingAsset() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const saveFile = useMutation(api.assets.saveFile);
  const saveLink = useMutation(api.assets.saveLink);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [assetType, setAssetType] = useState('tech_rider');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'upload' | 'link'>('link');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
      if (!name) setName(result.assets[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFinish = async (skip = false) => {
    setLoading(true);
    try {
      if (!skip && profile?.artistId && name.trim()) {
        if (mode === 'link' && url.trim()) {
          await saveLink({ artistId: profile.artistId, name: name.trim(), assetType, fileUrl: url.trim() });
        } else if (mode === 'upload' && selectedFile) {
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(selectedFile.uri);
          const blob = await response.blob();
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': selectedFile.mimeType ?? 'application/octet-stream' },
            body: blob,
          });
          if (uploadResponse.ok) {
            const { storageId } = await uploadResponse.json();
            await saveFile({ artistId: profile.artistId, name: name.trim(), assetType, storageId, mimeType: selectedFile.mimeType });
          }
        }
      }
      await completeOnboarding();
      router.replace('/(app)/dashboard');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 16 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center' }}>
      <OnboardingHeader step={5} totalSteps={5} title="First Asset" subtitle="Upload a tech rider or press kit to share with venues." onSkip={() => handleFinish(true)} />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}>

        {/* Asset type */}
        <Text style={labelStyle}>Asset Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {COMMON_ASSETS.map((a) => (
            <TouchableOpacity
              key={a.value}
              onPress={() => setAssetType(a.value)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: assetType === a.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: assetType === a.value ? Colors.accent : Colors.border }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: assetType === a.value ? '#000' : Colors.textMuted }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: 10, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: Colors.border }}>
          <TouchableOpacity onPress={() => setMode('link')} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'link' ? Colors.accent : 'transparent', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: mode === 'link' ? '#000' : Colors.textMuted }}>🔗 Link URL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('upload')} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'upload' ? Colors.accent : 'transparent', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: mode === 'upload' ? '#000' : Colors.textMuted }}>📤 Upload</Text>
          </TouchableOpacity>
        </View>

        <Text style={labelStyle}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Tech Rider 2025" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        {mode === 'link' ? (
          <>
            <Text style={labelStyle}>URL</Text>
            <TextInput value={url} onChangeText={setUrl} placeholder="https://drive.google.com/..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" style={inputStyle} />
          </>
        ) : (
          <TouchableOpacity onPress={handlePickFile} style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: selectedFile ? Colors.accent : Colors.border, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16, borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{selectedFile ? '📄' : '📤'}</Text>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>
              {selectedFile ? selectedFile.name : 'Choose a file'}
            </Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

        <TouchableOpacity
          onPress={() => handleFinish(false)}
          disabled={loading}
          style={{ backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#000' }}>Finish Setup 🎉</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleFinish(true)} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted }}>Skip & go to dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
