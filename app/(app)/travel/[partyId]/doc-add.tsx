import { useMutation, useQuery, useAction } from 'convex/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../../../src/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

const DOC_TYPES = [
  { value: 'passport', label: 'Passport', icon: 'id-card-o' },
  { value: 'national_id', label: 'National ID', icon: 'id-badge' },
  { value: 'driving_license', label: "Driver's Licence", icon: 'car' },
];

function parseLocalDate(str: string): number | null {
  const d = new Date(str + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d.getTime();
}

export default function DocAddScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const tourPartyId = partyId as Id<'tourParties'>;

  const travelers = useQuery(api.travel.listTravelers, { tourPartyId });
  const addDoc = useMutation(api.travel.addTravelDocument);
  const generateUploadUrl = useMutation(api.travel.generateDocUploadUrl);
  const extractPassportData = useAction(api.aiTravel.extractPassportData);

  const [travelerId, setTravelerId] = useState<Id<'travelers'> | null>(null);
  const [docType, setDocType] = useState('passport');
  const [issuingCountry, setIssuingCountry] = useState('');
  const [nationality, setNationality] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; storageId: Id<'_storage'>; mimeType: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setUploading(true);

      const uploadUrl = await generateUploadUrl();
      const blob = await fetch(file.uri).then((r) => r.blob());
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.mimeType ?? 'application/octet-stream' },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { storageId } = await uploadRes.json();
      setUploadedFile({ name: file.name ?? 'Document', storageId, mimeType: file.mimeType ?? 'image/jpeg' });
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message ?? 'Could not upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!uploadedFile) return;
    setExtracting(true);
    try {
      const result = await extractPassportData({ storageId: uploadedFile.storageId, mimeType: uploadedFile.mimeType });
      if (result.ok && result.data) {
        const d = result.data as Record<string, string | null>;
        if (d.docType && DOC_TYPES.find((t) => t.value === d.docType)) setDocType(d.docType!);
        if (d.issuingCountry) setIssuingCountry(d.issuingCountry);
        if (d.nationality) setNationality(d.nationality);
        if (d.docNumber) setDocNumber(d.docNumber);
        if (d.expiryDate) setExpiryDate(d.expiryDate);
        Alert.alert('Data Extracted', 'Fields pre-filled from the document. Please verify before saving.');
      } else {
        Alert.alert('Could Not Extract', 'No readable data found in this document. Fill in the fields manually.');
      }
    } catch (err: any) {
      Alert.alert('Extract Error', err?.message ?? 'Could not extract document data');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!travelerId) { Alert.alert('Validation', 'Select a traveler'); return; }
    if (!issuingCountry.trim()) { Alert.alert('Validation', 'Issuing country is required'); return; }
    if (!nationality.trim()) { Alert.alert('Validation', 'Nationality is required'); return; }
    if (!docNumber.trim()) { Alert.alert('Validation', 'Document number is required'); return; }
    const expTs = parseLocalDate(expiryDate);
    if (!expTs) { Alert.alert('Validation', 'Enter a valid expiry date (YYYY-MM-DD)'); return; }

    setSaving(true);
    try {
      const trimmed = docNumber.replace(/\s/g, '');
      await addDoc({
        travelerId,
        type: docType,
        issuingCountry: issuingCountry.trim(),
        nationality: nationality.trim(),
        numberLast4: trimmed.slice(-4),
        numberEncrypted: trimmed,
        expiresAt: expTs,
        storageId: uploadedFile?.storageId,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (travelers === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 28, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }}>
          Add Document
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}
        >
          {saving
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 4 }}>
        {/* Traveler picker */}
        <Field label="Traveler *">
          {travelers.length === 0 ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
              Add travelers to the party first.
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {travelers.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  onPress={() => setTravelerId(t._id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: travelerId === t._id ? Colors.accent : Colors.surface,
                    borderWidth: 1,
                    borderColor: travelerId === t._id ? Colors.accent : Colors.border,
                  }}
                >
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: travelerId === t._id ? '#000' : Colors.textMuted }}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        {/* Document type */}
        <Field label="Document Type *">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {DOC_TYPES.map((dt) => (
              <TouchableOpacity
                key={dt.value}
                onPress={() => setDocType(dt.value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: docType === dt.value ? Colors.accent : Colors.surface,
                  borderWidth: 1,
                  borderColor: docType === dt.value ? Colors.accent : Colors.border,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FontAwesome name={dt.icon as any} size={14} color={docType === dt.value ? '#000' : Colors.textMuted} />
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: docType === dt.value ? '#000' : Colors.textMuted, textAlign: 'center' }}>
                  {dt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Issuing Country *">
              <TextInput
                value={issuingCountry}
                onChangeText={setIssuingCountry}
                placeholder="United Kingdom"
                placeholderTextColor={Colors.textMuted}
                style={inputStyle}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Nationality *">
              <TextInput
                value={nationality}
                onChangeText={setNationality}
                placeholder="British"
                placeholderTextColor={Colors.textMuted}
                style={inputStyle}
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}>
            <Field label="Document Number *">
              <TextInput
                value={docNumber}
                onChangeText={setDocNumber}
                placeholder="123456789"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                style={inputStyle}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Expiry Date * (YYYY-MM-DD)">
              <TextInput
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="2030-06-15"
                placeholderTextColor={Colors.textMuted}
                style={inputStyle}
              />
            </Field>
          </View>
        </View>

        {/* File upload */}
        <Field label="Document Scan (optional)">
          <TouchableOpacity
            onPress={handleFilePick}
            disabled={uploading}
            style={{
              backgroundColor: Colors.surface,
              borderWidth: 1,
              borderColor: uploadedFile ? `${Colors.green}50` : Colors.border,
              borderRadius: 10,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <FontAwesome
                name={uploadedFile ? 'check-circle' : 'upload'}
                size={16}
                color={uploadedFile ? Colors.green : Colors.textMuted}
              />
            )}
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: uploadedFile ? Colors.green : Colors.textMuted, flex: 1 }}>
              {uploading
                ? 'Uploading…'
                : uploadedFile
                ? uploadedFile.name
                : 'Tap to upload PDF or image'}
            </Text>
            {uploadedFile && (
              <TouchableOpacity onPress={() => setUploadedFile(null)}>
                <FontAwesome name="times" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {uploadedFile && (
            <TouchableOpacity
              onPress={handleExtract}
              disabled={extracting}
              style={{
                marginTop: 8,
                backgroundColor: `${Colors.accent}18`,
                borderWidth: 1,
                borderColor: `${Colors.accent}40`,
                borderRadius: 10,
                paddingVertical: 11,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {extracting ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <FontAwesome name="magic" size={14} color={Colors.accent} />
              )}
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.accent }}>
                {extracting ? 'Extracting…' : 'Scan & Extract Data'}
              </Text>
            </TouchableOpacity>
          )}
        </Field>

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          />
        </Field>

        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <FontAwesome name="lock" size={12} color={Colors.textMuted} style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18 }}>
            Document numbers are stored securely. Only the last 4 digits are displayed in the UI.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  padding: 14,
  fontFamily: 'DMSans_400Regular' as const,
  fontSize: 14,
  color: Colors.textPrimary,
};
