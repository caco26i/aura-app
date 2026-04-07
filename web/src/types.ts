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
  voiceKeyword: string;
  silentTriggerMs: number;
  timerDefaultMinutes: number;
  locationPrecision: 'approximate' | 'precise';
};

export type GlobalStatus = 'calm' | 'alert';
