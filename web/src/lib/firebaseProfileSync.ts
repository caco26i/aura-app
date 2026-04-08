import type { User } from 'firebase/auth';
import type { AuraSettings } from '../types';

/**
 * Maps Firebase Auth user fields into Aura settings so the shell (Home, Settings) can show
 * name, photo, and account email after sign-in.
 */
export function auraSettingsPatchFromFirebaseUser(user: User): Partial<AuraSettings> {
  const email = user.email?.trim() ?? '';
  const localFromEmail = email.includes('@') ? email.split('@')[0]?.trim() ?? '' : email;
  const displayName = user.displayName?.trim() || localFromEmail || email;
  return {
    displayName,
    profilePhotoUrl: user.photoURL?.trim() ?? '',
    linkedAccountEmail: email,
  };
}

/** Photo + email only — used when restoring Firebase session so a locally edited display name is not reset. */
export function auraLinkedProfilePatchFromFirebaseUser(user: User): Pick<AuraSettings, 'profilePhotoUrl' | 'linkedAccountEmail'> {
  return {
    profilePhotoUrl: user.photoURL?.trim() ?? '',
    linkedAccountEmail: user.email?.trim() ?? '',
  };
}
