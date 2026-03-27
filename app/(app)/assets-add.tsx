import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../src/constants/colors';
import ScreenContainer from '../../src/components/ScreenContainer';
import Toast from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

const ASSET_TYPES = [
  { value: 'tech_rider', label: '🎚️ Tech Rider' },
  { value: 'stage_plot', label: '🗺️ Stage Plot' },
  { value: 'input_list', label: '🎛️ Input List' },
  { value: 'hospitality_rider', label: '🍽️ Hospitality Rider' },
  { value: 'press_kit', label: '📰 Press Kit' },
  { value: 'press_photo', label: '📷 Press Photo' },
  { value: 'contract', label: '📄 Contract' },
  { value: 'invoice', label: '🧾 Invoice' },
  { value: 'setlist', label: '🎵 Setlist' },
  { value: 'other', label: '📁 Other' },
];

export default function AddAsset() {
  const router = useRouter();
  const profile = useQuery(api.users.myProfile);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const saveFile = useMutation(api.assets.saveFile);
  const saveLink = useMutation(api.assets.saveLink);

  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [assetType, setAssetType] = useState('tech_rider');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [error, setError] = useState('');

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile(file);
        if (!name) setName(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (e) {
      setError('Failed to pick file');
    }
  };

  const handleSave = async () => {
    if (!profile?.artistId) return;
    if (!name.trim()) { setError('Name is required'); return; }

    if (mode === 'link') {
      if (!url.trim()) { setError('URL is required'); return; }
      setLoading(true);
      setError('');
      try {
        await saveLink({
          artistId: profile.artistId,
          name: name.trim(),
          assetType,
          fileUrl: url.trim(),
        });
        router.back();
      } catch (e: any) {
        setError(e.message ?? 'Failed to save');
      showToast(e.message ?? 'Something went wrong', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Upload mode
    if (!selectedFile) { setError('Please select a file'); return; }
    setLoading(true);
    setError('');
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': selectedFile.mimeType ?? 'application/octet-stream' },
        body: blob,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      const { storageId } = await uploadResponse.json();

      await saveFile({
        artistId: profile.artistId,
        name: name.trim(),
        assetType,
        storageId,
        mimeType: selectedFile.mimeType ?? undefined,
        fileSizeBytes: selectedFile.size ?? undefined,
      });
      showToast('Asset saved!');
      setTimeout(() => router.back(), 800);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 } as const;
  const labelStyle = { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 4 };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.textPrimary, flex: 1 }}>Add Asset</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={{ backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
          {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {error ? <Text style={{ color: Colors.accentRed, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: 10, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border }}>
          <TouchableOpacity
            onPress={() => setMode('upload')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'upload' ? Colors.accent : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: mode === 'upload' ? '#000' : Colors.textMuted }}>📤 Upload File</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('link')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'link' ? Colors.accent : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: mode === 'link' ? '#000' : Colors.textMuted }}>🔗 Link URL</Text>
          </TouchableOpacity>
        </View>

        <Text style={labelStyle}>Asset Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ASSET_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setAssetType(t.value)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: assetType === t.value ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: assetType === t.value ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: assetType === t.value ? '#000' : Colors.textMuted }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={labelStyle}>Name *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Tech Rider 2025" placeholderTextColor={Colors.textMuted} style={inputStyle} />

        {mode === 'upload' ? (
          <>
            <Text style={labelStyle}>File</Text>
            <TouchableOpacity
              onPress={handlePickFile}
              style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: selectedFile ? Colors.accent : Colors.border, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12, borderStyle: 'dashed' }}
            >
              {selectedFile ? (
                <>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📄</Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>{selectedFile.name}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>
                    {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📤</Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>Choose a file</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted }}>PDF, images, Word documents</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={labelStyle}>URL *</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://drive.google.com/..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              style={inputStyle}
            />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 16 }}>
              Paste a link from Google Drive, Dropbox, or any other service.
            </Text>
          </>
        )}
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </ScreenContainer>
  );
}
