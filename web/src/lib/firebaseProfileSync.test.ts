import { describe, expect, it } from 'vitest';
import type { User } from 'firebase/auth';
import { auraLinkedProfilePatchFromFirebaseUser, auraSettingsPatchFromFirebaseUser } from './firebaseProfileSync';

function mockUser(partial: Partial<User> & { email?: string | null; displayName?: string | null; photoURL?: string | null }): User {
  return {
    email: partial.email ?? null,
    displayName: partial.displayName ?? null,
    photoURL: partial.photoURL ?? null,
  } as User;
}

describe('auraSettingsPatchFromFirebaseUser', () => {
  it('uses displayName, photoURL, and email when present', () => {
    const u = mockUser({
      email: 'sofia@example.com',
      displayName: 'Sofia García',
      photoURL: 'https://example.com/p.jpg',
    });
    expect(auraSettingsPatchFromFirebaseUser(u)).toEqual({
      displayName: 'Sofia García',
      profilePhotoUrl: 'https://example.com/p.jpg',
      linkedAccountEmail: 'sofia@example.com',
    });
  });

  it('falls back displayName to email local part', () => {
    const u = mockUser({ email: 'alex@example.com', displayName: null, photoURL: null });
    expect(auraSettingsPatchFromFirebaseUser(u).displayName).toBe('alex');
    expect(auraSettingsPatchFromFirebaseUser(u).profilePhotoUrl).toBe('');
  });
});

describe('auraLinkedProfilePatchFromFirebaseUser', () => {
  it('only returns photo and email fields', () => {
    const u = mockUser({
      email: 'a@b.co',
      displayName: 'Full Name',
      photoURL: 'https://x/y.png',
    });
    expect(auraLinkedProfilePatchFromFirebaseUser(u)).toEqual({
      profilePhotoUrl: 'https://x/y.png',
      linkedAccountEmail: 'a@b.co',
    });
  });
});
