import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import EmptyState from '../../../src/components/EmptyState';
import { SkeletonList } from '../../../src/components/Skeleton';
import { useState } from 'react';

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

export default function ContactsScreen() {
  const profile = useQuery(api.users.myProfile);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const contacts = useQuery(
    api.contacts.list,
    profile?.artistId ? { artistId: profile.artistId } : 'skip'
  );

  const types = ['all', ...Array.from(new Set((contacts ?? []).map((c: any) => c.contactType)))];

  const filtered = (contacts ?? []).filter((c: any) => {
    const matchesSearch = search === '' ||
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || c.contactType === typeFilter;
    return matchesSearch && matchesType;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 28, paddingBottom: 0 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 24, color: Colors.textPrimary, marginBottom: 4 }}>Contacts</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1 }}>
            {(contacts ?? []).length} total
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/contacts/add')}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>+ Add Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.textMuted}
          style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 14 }}
        />

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {types.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTypeFilter(t)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: typeFilter === t ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: typeFilter === t ? Colors.accent : Colors.border }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: typeFilter === t ? '#000' : Colors.textMuted }}>
                  {t === 'all' ? 'All' : TYPE_LABELS[t] ?? t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
        {contacts === undefined ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title="No contacts found" message={search ? 'Try a different search term' : 'Add your first contact to get started'} actionLabel={!search ? '+ Add Contact' : undefined} onAction={!search ? () => router.push('/(app)/contacts/add') : undefined} />
        ) : (
          filtered.map((contact: any) => (
            <TouchableOpacity key={contact._id} onPress={() => router.push(`/(app)/contacts/${contact._id}` as any)} style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${Colors.accent}18`, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 22 }}>{TYPE_ICONS[contact.contactType] ?? '👤'}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 }}>
                  {contact.displayName}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 6 }}>
                  {TYPE_LABELS[contact.contactType] ?? contact.contactType}
                  {contact.company ? ` · ${contact.company}` : ''}
                  {contact.city ? ` · ${contact.city}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {contact.email && (
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.accentBlue }}>
                      {contact.email}
                    </Text>
                  )}
                </View>
              </View>

              {/* Status + rating */}
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${STATUS_COLORS[contact.status] ?? Colors.textMuted}18` }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 11, color: STATUS_COLORS[contact.status] ?? Colors.textMuted, textTransform: 'capitalize' }}>
                    {contact.status}
                  </Text>
                </View>
                {contact.rating && (
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.orange }}>
                    {'★'.repeat(contact.rating)}{'☆'.repeat(5 - contact.rating)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
