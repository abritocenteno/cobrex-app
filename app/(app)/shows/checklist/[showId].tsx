import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../../../src/constants/colors';

const CATEGORIES = ['production', 'logistics', 'hospitality', 'promotion', 'finance', 'other'];

const CATEGORY_ICONS: Record<string, string> = {
  production: '🎚️',
  logistics: '🚛',
  hospitality: '🍽️',
  promotion: '📣',
  finance: '💰',
  other: '📋',
};

export default function ShowChecklist() {
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const router = useRouter();
  const items = useQuery(api.checklist.items, showId ? { showId: showId as any } : 'skip');
  const toggle = useMutation(api.checklist.toggle);
  const add = useMutation(api.checklist.add);
  const remove = useMutation(api.checklist.remove);
  const profile = useQuery(api.users.myProfile);

  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('production');
  const [isCritical, setIsCritical] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async () => {
    if (!newLabel.trim() || !profile?.artistId || !showId) return;
    setAdding(true);
    try {
      await add({
        showId: showId as any,
        artistId: profile.artistId,
        label: newLabel.trim(),
        category: newCategory,
        isCritical,
        sortOrder: (items ?? []).length,
      });
      setNewLabel('');
      setIsCritical(false);
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  };

  const grouped = (items ?? []).reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const total = (items ?? []).length;
  const checked = (items ?? []).filter((i: any) => i.isChecked).length;
  const pct = total > 0 ? Math.round(checked / total * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: Colors.accent }}>← Show</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary, flex: 1 }}>Checklist</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={{ backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#000' }}>
              {showAddForm ? '✕ Cancel' : '+ Add Item'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${pct}%`, backgroundColor: pct === 100 ? Colors.green : Colors.accent, borderRadius: 3 }} />
          </View>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: pct === 100 ? Colors.green : Colors.textMuted }}>
            {checked}/{total}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Add form */}
        {showAddForm && (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.textPrimary, marginBottom: 12 }}>New Item</Text>
            <TextInput
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="e.g. Confirm stage plot received"
              placeholderTextColor={Colors.textMuted}
              style={{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontFamily: 'DMSans_400Regular', fontSize: 14, marginBottom: 12 }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewCategory(cat)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: newCategory === cat ? Colors.accent : Colors.surface2, borderWidth: 1, borderColor: newCategory === cat ? Colors.accent : Colors.border }}
                  >
                    <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: newCategory === cat ? '#000' : Colors.textMuted, textTransform: 'capitalize' }}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIsCritical(!isCritical)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: isCritical ? Colors.accentRed : Colors.textMuted, backgroundColor: isCritical ? Colors.accentRed : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                {isCritical && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textPrimary }}>Critical item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={adding || !newLabel.trim()}
              style={{ backgroundColor: Colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center', opacity: !newLabel.trim() ? 0.5 : 1 }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#000' }}>
                {adding ? 'Adding...' : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {items === undefined ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textPrimary, marginBottom: 8 }}>No checklist items</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted }}>Add items to track show preparation</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([category, catItems]) => (
            <View key={category} style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                {CATEGORY_ICONS[category]} {category}
              </Text>
              {(catItems as any[]).map((item: any) => (
                <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: item.isChecked ? `${Colors.green}30` : item.isCritical ? `${Colors.accentRed}30` : Colors.border, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => toggle({ id: item._id, checked: !item.isChecked, checkedByName: profile?.displayName })}
                    style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: item.isChecked ? Colors.green : Colors.textMuted, backgroundColor: item.isChecked ? Colors.green : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
                  >
                    {item.isChecked && <Text style={{ color: '#000', fontSize: 13 }}>✓</Text>}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: item.isChecked ? 'DMSans_400Regular' : 'DMSans_500Medium', fontSize: 14, color: item.isChecked ? Colors.textMuted : Colors.textPrimary, textDecorationLine: item.isChecked ? 'line-through' : 'none' }}>
                      {item.isCritical && !item.isChecked ? '🚨 ' : ''}{item.label}
                    </Text>
                    {item.isChecked && item.checkedByName && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                        ✓ {item.checkedByName} · {item.checkedAt ? new Date(item.checkedAt).toLocaleString() : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => remove({ id: item._id })} style={{ padding: 4, marginLeft: 8 }}>
                    <Text style={{ color: Colors.textMuted, fontSize: 14 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
