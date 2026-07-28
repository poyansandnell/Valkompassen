import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Municipality } from '@workspace/api-client-react';

const KEY = 'municipalities-cache-v1';

/** Load the locally cached municipality list (or null if none saved yet). */
export async function loadCachedMunicipalities(): Promise<Municipality[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist the municipality list so the picker opens instantly next time. */
export function saveCachedMunicipalities(list: Municipality[]): void {
  if (!Array.isArray(list) || list.length === 0) return;
  AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
}
