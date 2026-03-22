import { useQuery, useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import ConfirmDialog from '../../../src/components/ConfirmDialog';

const TYPE_LABELS: Record<string, string> = {
  foh_engineer: 'FOH Engineer',
  monitor_engineer: 'Monitor Engineer',
  tour_manager: 'Tour Manager',
  promoter: 'Promoter',
  booking_agent: 'Booking Agent',
  lighting_designer: 'Lighting Designer',
  photographer: 'Photographer',
  other: 'Other',
};

const TYPE_ICONS: Record<string, string> = {
  foh_engineer: '🎚️',
  monitor_engineer: '🎛️',
  tour_manager: '🗺️',
  promoter: '📣',
  booking_agent: '🤝',
  lighting_designer: '💡',
  photographer: '📷',
  other: '👤',
};

const STATUS_COLORS: Record<string, string> = {
  active: Colors.green,
  inactive: Colors.textMuted,
  blacklisted: Colors.accentRed,
};

export default function ContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const contact = useQuery(api.contacts.get, id ? { id: id as any } : 'skip');
  const updateContact = useMutation(api.contacts.update);
  const removeContact = useMutation(api.contacts.remove);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (contact === undefined) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  }

  if (!contact) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: Colors.textMuted }}>Contact not found</Text></View>;
  }

  const statusColor = STATUS_COLORS[contact.status] ?? Colors.textMuted;

  const handleStatusChange = (status: string) => {
    updateContact({ id: contact._id, status: status as any });
  };

  const handleDelete = async () => {
    await removeContact({ id: contact._id });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Contacts</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 26 }}>{TYPE_ICONS[contact.contactType] ?? '👤'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 2 }}>{contact.displayName}</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>{TYPE_LABELS[contact.contactType] ?? contact.contactType}</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${statusColor}18` }}>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: statusColor, textTransform: 'capitalize' }}>{contact.status}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, maxWidth: 700, width: '100%', alignSelf: 'center' }}>

        {/* Contact info */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 16 }}>📋 Contact Info</Text>
          <View style={{ gap: 14 }}>
            {contact.email && (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${contact.email}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>✉️</Text>
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Email</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accentBlue }}>{contact.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            {contact.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>📞</Text>
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Phone</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accentBlue }}>{contact.phone}</Text>
                </View>
              </TouchableOpacity>
            )}
            {contact.company && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>🏢</Text>
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Company</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>{contact.company}</Text>
                </View>
              </View>
            )}
            {(contact.city || contact.country) && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>📍</Text>
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Location</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textPrimary }}>{[contact.city, contact.country].filter(Boolean).join(', ')}</Text>
                </View>
              </View>
            )}
            {contact.rating && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 12 }}>⭐</Text>
                <View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Rating</Text>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.orange }}>{'★'.repeat(contact.rating)}{'☆'.repeat(5 - contact.rating)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {contact.notes && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 10 }}>📝 Notes</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{contact.notes}</Text>
          </View>
        )}

        {/* Status */}
        <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 14 }}>🔄 Status</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['active', 'inactive', 'blacklisted'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleStatusChange(s)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: contact.status === s ? `${STATUS_COLORS[s]}20` : Colors.surface2, borderWidth: 1, borderColor: contact.status === s ? STATUS_COLORS[s] : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: contact.status === s ? STATUS_COLORS[s] : Colors.textMuted, textTransform: 'capitalize' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={() => setShowDeleteConfirm(true)}
          style={{ borderWidth: 1, borderColor: `${Colors.accentRed}40`, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 }}
        >
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.accentRed }}>🗑️ Delete Contact</Text>
        </TouchableOpacity>

        <ConfirmDialog
          visible={showDeleteConfirm}
          title="Delete Contact"
          message={`Are you sure you want to delete ${contact.displayName}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

      </ScrollView>
    </View>
  );
}
