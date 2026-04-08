import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { useAura } from '../context/useAura';
import { firebaseAuthConfigured, getAuraFirebaseAuth } from '../lib/firebaseClient';
import {
  auraLinkedProfilePatchFromFirebaseUser,
  auraSettingsPatchFromFirebaseUser,
} from '../lib/firebaseProfileSync';

/**
 * Keeps persisted Aura settings aligned with the signed-in Firebase user (photo, name, email)
 * when the session restores after refresh or another tab.
 */
export function FirebaseProfileSync() {
  const { updateSettings, settings } = useAura();
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!firebaseAuthConfigured()) return;
    const auth = getAuraFirebaseAuth();
    return onAuthStateChanged(auth, (user) => {
      if (!user) return;
      const linked = auraLinkedProfilePatchFromFirebaseUser(user);
      if (!settingsRef.current.displayName.trim()) {
        updateSettings({ ...auraSettingsPatchFromFirebaseUser(user) });
      } else {
        updateSettings(linked);
      }
    });
  }, [updateSettings]);

  return null;
}
