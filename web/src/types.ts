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
};

export function defaultEncuentroDraft(): EncuentroDraft {
  return {
    contactName: '',
    place: '',
    safetyKeyword: '',
    meetingLocalValue: '',
    checkInIntervalMinutes: 15,
  };
}
