import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

const IDLE_TIMEOUT_MS = 20 * 60 * 1000;        // 20 minutes
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
const WARNING_BEFORE_MS = 60 * 1000;             // warn 60s before
const CHECK_INTERVAL_MS = 5_000;
const SESSION_START_KEY = 'cobrex_session_start';

function ls() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.localStorage;
  return null;
}

export function useSessionTimeout() {
  const { signOut } = useAuth();
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  // Web: track mouse/keyboard/touch activity via document events
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const handle = () => { lastActivityRef.current = Date.now(); };
    document.addEventListener('mousemove', handle, { passive: true });
    document.addEventListener('keydown', handle, { passive: true });
    document.addEventListener('click', handle, { passive: true });
    document.addEventListener('touchstart', handle, { passive: true });
    document.addEventListener('scroll', handle, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handle);
      document.removeEventListener('keydown', handle);
      document.removeEventListener('click', handle);
      document.removeEventListener('touchstart', handle);
      document.removeEventListener('scroll', handle);
    };
  }, []);

  // Native: reset idle timer when app returns to foreground
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') resetTimer();
    });
    return () => sub.remove();
  }, [resetTimer]);

  // Record session start (for absolute timeout)
  useEffect(() => {
    const store = ls();
    if (!store) return;
    if (!store.getItem(SESSION_START_KEY)) {
      store.setItem(SESSION_START_KEY, String(Date.now()));
    }
  }, []);

  // Main tick: check idle + absolute timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;

      const store = ls();
      const sessionStart = store
        ? parseInt(store.getItem(SESSION_START_KEY) ?? String(now))
        : now;
      const absoluteMs = now - sessionStart;

      const msUntilExpiry = Math.min(
        IDLE_TIMEOUT_MS - idleMs,
        ABSOLUTE_TIMEOUT_MS - absoluteMs,
      );

      if (msUntilExpiry <= 0) {
        ls()?.removeItem(SESSION_START_KEY);
        signOutRef.current();
        return;
      }

      if (msUntilExpiry <= WARNING_BEFORE_MS) {
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(msUntilExpiry / 1000)));
      } else {
        setShowWarning(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return { showWarning, secondsRemaining, resetTimer };
}
