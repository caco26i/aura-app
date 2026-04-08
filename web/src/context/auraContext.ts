import { createContext } from 'react';
import type {
  ActiveJourney,
  AuraSettings,
  GlobalStatus,
  JourneyTrackState,
  MapLayers,
  TrustedContact,
} from '../types';

export type AuraContextValue = {
  contacts: TrustedContact[];
  addContact: (c: Omit<TrustedContact, 'id'>) => void;
  updateContact: (id: string, patch: Partial<TrustedContact>) => void;
  removeContact: (id: string) => void;
  activeJourney: ActiveJourney | null;
  startJourney: (input: {
    /** When live API is used, must be the id returned by `POST /v1/journeys`. */
    id?: string;
    label: string;
    destinationLabel: string;
    etaMinutes: number;
    trackState?: JourneyTrackState;
  }) => void;
  endJourney: () => void;
  setTrackState: (state: JourneyTrackState) => void;
  mapLayers: MapLayers;
  setMapLayer: (key: keyof MapLayers, value: boolean) => void;
  settings: AuraSettings;
  updateSettings: (patch: Partial<AuraSettings>) => void;
  globalStatus: GlobalStatus;
  setGlobalStatus: (s: GlobalStatus) => void;
};

export const AuraContext = createContext<AuraContextValue | null>(null);
