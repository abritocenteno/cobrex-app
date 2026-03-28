import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Platform, Modal } from 'react-native';
import { Colors } from '../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutBanner from './SessionTimeoutBanner';

const NAV_ITEMS_ARTIST = [
  { label: 'Dashboard', icon: '⚡', route: '/(app)/dashboard' },
  { label: 'Shows', icon: '🎤', route: '/(app)/shows' },
  { label: 'Contacts', icon: '👥', route: '/(app)/contacts' },
  { label: 'Deals', icon: '🤝', route: '/(app)/deals' },
  { label: 'Assets', icon: '📁', route: '/(app)/assets' },
  { label: 'Setlist', icon: '🎵', route: '/(app)/setlist' },
  { label: 'Metrics', icon: '📊', route: '/(app)/metrics' },
  { label: 'Alerts', icon: '🔔', route: '/(app)/alerts' },
  { label: 'Notifications', icon: '📬', route: '/(app)/notifications' },
  { label: 'Profile', icon: '👤', route: '/(app)/profile' },
];

const NAV_ITEMS_MANAGER = [
  { label: 'Dashboard', icon: '⚡', route: '/(app)/dashboard' },
  { label: 'Roster', icon: '👥', route: '/(app)/roster' },
  { label: 'Shows', icon: '🎤', route: '/(app)/shows' },
  { label: 'Deals', icon: '🤝', route: '/(app)/deals' },
  { label: 'Metrics', icon: '📊', route: '/(app)/metrics' },
  { label: 'Notifications', icon: '📬', route: '/(app)/notifications' },
  { label: 'Profile', icon: '👤', route: '/(app)/profile' },
];

const NAV_ITEMS_VENUE = [
  { label: 'Dashboard', icon: '⚡', route: '/(app)/dashboard' },
  { label: 'Shows', icon: '🎤', route: '/(app)/shows' },
  { label: 'Requests', icon: '📬', route: '/(app)/requests' },
  { label: 'Notifications', icon: '📬', route: '/(app)/notifications' },
  { label: 'Profile', icon: '👤', route: '/(app)/profile' },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const profile = useQuery(api.users.myProfile);
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = profile?.role ?? 'artist';
  const navItems = role === 'manager' ? NAV_ITEMS_MANAGER : role === 'venue' ? NAV_ITEMS_VENUE : NAV_ITEMS_ARTIST;

  const handleNav = (route: string) => {
    router.push(route as any);
    onNavigate?.();
  };

  return (
    <View style={{ flex: 1, paddingTop: 24 }}>
      {/* Logo */}
      <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 28, letterSpacing: 4, color: Colors.accent }}>COBREX</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: Colors.textMuted, letterSpacing: 2, marginTop: 2 }}>{role.toUpperCase()} PORTAL</Text>
      </View>

      {/* Nav items */}
      <ScrollView style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleNav(item.route)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, marginHorizontal: 8, marginBottom: 2, borderRadius: 10, backgroundColor: isActive ? `${Colors.accent}18` : 'transparent' }}
            >
              <Text style={{ fontSize: 16, marginRight: 12 }}>{item.icon}</Text>
              <Text style={{ fontFamily: isActive ? 'DMSans_600SemiBold' : 'DMSans_400Regular', fontSize: 14, color: isActive ? Colors.textPrimary : Colors.textMuted, flex: 1 }}>
                {item.label}
              </Text>
              {isActive && <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: Colors.accent }} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User info + sign out */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.textPrimary, marginBottom: 2 }} numberOfLines={1}>{profile?.displayName ?? ''}</Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 12 }} numberOfLines={1}>{profile?.email ?? ''}</Text>
        <TouchableOpacity
          onPress={() => signOut()}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.textMuted }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CLEAN_PATHS = ['/(app)/onboarding', '/(app)/role-selection'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Wide: full sidebar | Medium: icon-only | Mobile: bottom tabs + hamburger
  const isWide = width >= 1024;
  const isMedium = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const { signOut } = useAuth();
  const profile = useQuery(api.users.myProfile);
  const role = profile?.role ?? 'artist';
  const router = useRouter();
  const pathname = usePathname();

  const { showWarning, secondsRemaining, resetTimer } = useSessionTimeout();

  // Onboarding and role-selection render without any nav chrome
  const isCleanPath = CLEAN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isCleanPath) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }}>{children}</View>;
  }
  const navItems = role === 'manager' ? NAV_ITEMS_MANAGER : role === 'venue' ? NAV_ITEMS_VENUE : NAV_ITEMS_ARTIST;

  if (isWide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.bg }}>
        <View style={{ width: 220, backgroundColor: Colors.surface, borderRightWidth: 1, borderRightColor: Colors.border }}>
          <SafeAreaView style={{ flex: 1 }}><NavContent /></SafeAreaView>
        </View>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            {showWarning && <SessionTimeoutBanner secondsRemaining={secondsRemaining} onKeepAlive={resetTimer} />}
            {children}
          </SafeAreaView>
        </View>
      </View>
    );
  }

  if (isMedium) {
    // Icon-only collapsed sidebar
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.bg }}>
        <View style={{ width: 64, backgroundColor: Colors.surface, borderRightWidth: 1, borderRightColor: Colors.border }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingTop: 16 }}>
              {/* Logo icon */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: Colors.accent }}>C</Text>
              </View>
              <ScrollView>
                {navItems.map((item) => {
                  const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
                  return (
                    <TouchableOpacity
                      key={item.route}
                      onPress={() => router.push(item.route as any)}
                      style={{ alignItems: 'center', paddingVertical: 12, marginHorizontal: 8, marginBottom: 2, borderRadius: 10, backgroundColor: isActive ? `${Colors.accent}18` : 'transparent' }}
                    >
                      <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {/* Sign out */}
              <TouchableOpacity
                onPress={() => signOut()}
                style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 8 }}
              >
                <Text style={{ fontSize: 18 }}>🚪</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            {showWarning && <SessionTimeoutBanner secondsRemaining={secondsRemaining} onKeepAlive={resetTimer} />}
            {children}
          </SafeAreaView>
        </View>
      </View>
    );
  }

  // Mobile: bottom tabs + hamburger drawer
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Hamburger drawer */}
      <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: 280, backgroundColor: Colors.surface, height: '100%' }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                  <Text style={{ color: Colors.textMuted, fontSize: 24 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <NavContent onNavigate={() => setDrawerOpen(false)} />
            </SafeAreaView>
          </View>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar with hamburger */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 8, marginRight: 12, borderRadius: 8, backgroundColor: Colors.surface2 }}>
            <Text style={{ fontSize: 20, color: Colors.textPrimary }}>☰</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 4, color: Colors.accent, flex: 1 }}>COBREX</Text>
        </View>

        {showWarning && <SessionTimeoutBanner secondsRemaining={secondsRemaining} onKeepAlive={resetTimer} />}
        <View style={{ flex: 1 }}>{children}</View>

        {/* Bottom tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 0 : 8 }}>
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity key={item.route} onPress={() => router.push(item.route as any)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: isActive ? Colors.accent : Colors.textMuted, marginTop: 2 }}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
