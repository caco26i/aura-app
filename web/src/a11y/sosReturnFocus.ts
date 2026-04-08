/**
 * Remembers the control that opened /emergency so "Go back" can restore keyboard focus
 * (see web/docs/UX_EMPTY_LOADING_SAFETY.md §2.3).
 *
 * Uses `data-aura-sos-entry` on openers — not React refs — because `/emergency` sits outside
 * `AppShell`, so opener components unmount and refs go stale.
 */
let pendingRestore: (() => void) | null = null;

export type SosEntryKind = 'nav' | 'home-tile' | 'fab';

export function registerSosOpenerReturnFocusFromEntry(kind: SosEntryKind): void {
  pendingRestore = () => {
    document.querySelector<HTMLElement>(`[data-aura-sos-entry="${kind}"]`)?.focus();
  };
}

/** Register before navigating to `/emergency`. Overwrites any previous pending restore. */
export function registerSosOpenerReturnFocus(run: () => void): void {
  pendingRestore = run;
}

export function takeSosOpenerReturnFocus(): (() => void) | null {
  const fn = pendingRestore;
  pendingRestore = null;
  return fn;
}

/** Run after route change so the opener is mounted and refs are current. */
export function scheduleAfterNavFocusRestore(restore: (() => void) | null): void {
  if (!restore) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      restore();
    });
  });
}
