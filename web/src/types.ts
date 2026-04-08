export type PermissionLevel = 'full' | 'location' | 'alerts';

export type TrustedContact = {
  id: string;
  name: string;
  phone?: string;
  group: string;
  permission: PermissionLevel;
};

export type JourneyTrackState = 'on_track' | 'delay' | 'deviation';

export type ActiveJourney = {
  id: string;
  label: string;
  destinationLabel: string;
  etaMinutes: number;
  trackState: JourneyTrackState;
  startedAt: string;
};

export type MapLayers = {
  risk: boolean;
  safePoints: boolean;
  activity: boolean;
};

export type AuraSettings = {
  /** Shown on the home header (M3 prototype). */
  displayName: string;
  /** Profile image URL from Firebase (or empty). */
  profilePhotoUrl: string;
  /** Email for the Firebase-linked account on this device (or empty). */
  linkedAccountEmail: string;
  voiceKeyword: string;
  silentTriggerMs: number;
  timerDefaultMinutes: number;
  locationPrecision: 'approximate' | 'precise';
};

export type GlobalStatus = 'calm' | 'alert';

/** Modo Cita — local draft only (no backend). */
export type EncuentroDraft = {
  contactName: string;
  place: string;
  safetyKeyword: string;
  /** Value for `<input type="datetime-local">` (local, no timezone suffix). */
  meetingLocalValue: string;
  checkInIntervalMinutes: number;
  /** Last time the user acknowledged a local check-in nudge (`Date.now()`), or null until first future meeting is active. */
  encuentroLastLocalCheckInAckMs: number | null;
  /** User opted in to try Web Notifications for check-in nudges (still requires browser permission). */
  encuentroBrowserNotifyWanted: boolean;
};

export function defaultEncuentroDraft(): EncuentroDraft {
  return {
    contactName: '',
    place: '',
    safetyKeyword: '',
    meetingLocalValue: '',
    checkInIntervalMinutes: 15,
    encuentroLastLocalCheckInAckMs: null,
    encuentroBrowserNotifyWanted: false,
  };
}
