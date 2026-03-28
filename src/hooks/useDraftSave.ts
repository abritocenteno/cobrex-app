import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export const DRAFT_PREFIX = 'cobrex_draft_';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEBOUNCE_MS = 8_000;

// Fields that must never be stored in drafts
const SENSITIVE_PATTERNS = [
  /password/i, /passwd/i, /secret/i, /token/i,
  /otp/i, /pin/i, /cvv/i, /cvc/i, /cardnum/i, /ssn/i,
];

function isSensitive(key: string) {
  return SENSITIVE_PATTERNS.some((re) => re.test(key));
}

function sanitize(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!isSensitive(k)) out[k] = v;
  }
  return out;
}

function store() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.localStorage;
  return null;
}

function storageKey(draftKey: string) {
  return `${DRAFT_PREFIX}${draftKey}`;
}

export function saveDraft(draftKey: string, values: Record<string, unknown>, route?: string) {
  const s = store();
  if (!s) return;
  try {
    s.setItem(storageKey(draftKey), JSON.stringify({
      v: 1,
      ts: Date.now(),
      route: route ?? draftKey,
      values: sanitize(values),
    }));
  } catch {}
}

export function getDraft(draftKey: string): { values: Record<string, unknown>; route: string; ts: number } | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(storageKey(draftKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > DRAFT_TTL_MS) {
      s.removeItem(storageKey(draftKey));
      return null;
    }
    return { values: parsed.values ?? {}, route: parsed.route, ts: parsed.ts };
  } catch {
    return null;
  }
}

export function clearDraft(draftKey: string) {
  try { store()?.removeItem(storageKey(draftKey)); } catch {}
}

export function listDrafts(): Array<{ key: string; route: string; ts: number; label: string }> {
  const s = store();
  if (!s) return [];
  const results: Array<{ key: string; route: string; ts: number; label: string }> = [];
  try {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (!k?.startsWith(DRAFT_PREFIX)) continue;
      const raw = s.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts || Date.now() - parsed.ts > DRAFT_TTL_MS) {
        s.removeItem(k);
        continue;
      }
      const draftKey = k.slice(DRAFT_PREFIX.length);
      results.push({ key: draftKey, route: parsed.route, ts: parsed.ts, label: DRAFT_LABELS[draftKey] ?? draftKey });
    }
  } catch {}
  return results;
}

export const DRAFT_LABELS: Record<string, string> = {
  shows_add: 'new show',
  contacts_add: 'new contact',
  deals_add: 'new deal',
  assets_add: 'new asset',
};

// Hook: auto-saves values whenever they change (debounced)
export function useDraftSave(draftKey: string, values: Record<string, unknown>, route?: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Flush immediately before unload (on web)
  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleUnload = () => saveDraft(draftKey, valuesRef.current, route);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [draftKey, route]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft(draftKey, values, route);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // JSON.stringify(values) is intentional: stable comparison of plain form state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, route, JSON.stringify(values)]);

  return {
    clearDraft: () => clearDraft(draftKey),
  };
}
