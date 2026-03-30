import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const CONSENT_KEY = 'cobrex_cookie_consent';

export type ConsentState = 'accepted' | 'rejected' | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setLoaded(true);
      return;
    }
    const stored = window.localStorage.getItem(CONSENT_KEY) as ConsentState | null;
    setConsent(stored);
    setLoaded(true);
  }, []);

  function accept() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
  }

  function reject() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
  }

  // pending = we've finished loading and the user hasn't made a choice yet
  return { consent, accept, reject, pending: loaded && consent === null };
}
