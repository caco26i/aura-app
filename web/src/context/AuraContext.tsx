import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  defaultEncuentroDraft,
  type ActiveJourney,
  type AuraSettings,
  type EncuentroDraft,
  type GlobalStatus,
  type JourneyTrackState,
  type MapLayers,
  type TrustedContact,
} from '../types';
import { AuraContext } from './auraContext';
import { emitTelemetry } from '../observability/auraTelemetry';

const STORAGE_KEY = 'aura:v1';

type Persisted = {
  contacts: TrustedContact[];
  activeJourney: ActiveJourney | null;
  mapLayers: MapLayers;
  settings: AuraSettings;
  globalStatus: GlobalStatus;
  onboardingCompleted: boolean;
  shareLocationPrimerAcknowledged: boolean;
  encuentroDraft: EncuentroDraft;
};

function normalizeEncuentroDraft(raw: unknown): EncuentroDraft {
  const d = defaultEncuentroDraft();
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Record<string, unknown>;
  const interval =
    typeof o.checkInIntervalMinutes === 'number' && Number.isFinite(o.checkInIntervalMinutes)
      ? Math.min(120, Math.max(1, Math.round(o.checkInIntervalMinutes)))
      : d.checkInIntervalMinutes;
  return {
    contactName: typeof o.contactName === 'string' ? o.contactName : d.contactName,
    place: typeof o.place === 'string' ? o.place : d.place,
    safetyKeyword: typeof o.safetyKeyword === 'string' ? o.safetyKeyword : d.safetyKeyword,
    meetingLocalValue: typeof o.meetingLocalValue === 'string' ? o.meetingLocalValue : d.meetingLocalValue,
    checkInIntervalMinutes: interval,
  };
}

const defaultSettings: AuraSettings = {
  displayName: '',
  voiceKeyword: 'Aura help',
  silentTriggerMs: 800,
  timerDefaultMinutes: 15,
  locationPrecision: 'approximate',
};

const defaultLayers: MapLayers = {
  risk: true,
  safePoints: true,
  activity: false,
};

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        contacts: [],
        activeJourney: null,
        mapLayers: defaultLayers,
        settings: defaultSettings,
        globalStatus: 'calm',
        onboardingCompleted: false,
        shareLocationPrimerAcknowledged: false,
        encuentroDraft: defaultEncuentroDraft(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const onboardingCompleted =
      typeof parsed.onboardingCompleted === 'boolean'
        ? parsed.onboardingCompleted
        : true;
    const shareLocationPrimerAcknowledged =
      typeof parsed.shareLocationPrimerAcknowledged === 'boolean'
        ? parsed.shareLocationPrimerAcknowledged
        : false;
    return {
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      activeJourney: parsed.activeJourney ?? null,
      mapLayers: { ...defaultLayers, ...parsed.mapLayers },
      settings: { ...defaultSettings, ...parsed.settings },
      globalStatus: parsed.globalStatus === 'alert' ? 'alert' : 'calm',
      onboardingCompleted,
      shareLocationPrimerAcknowledged,
      encuentroDraft: normalizeEncuentroDraft(parsed.encuentroDraft),
    };
  } catch {
    return {
      contacts: [],
      activeJourney: null,
      mapLayers: defaultLayers,
      settings: defaultSettings,
      globalStatus: 'calm',
      onboardingCompleted: false,
      shareLocationPrimerAcknowledged: false,
      encuentroDraft: defaultEncuentroDraft(),
    };
  }
}

export function AuraProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<TrustedContact[]>(() => loadPersisted().contacts);
  const [activeJourney, setActiveJourney] = useState<ActiveJourney | null>(
    () => loadPersisted().activeJourney,
  );
  const [mapLayers, setMapLayersState] = useState<MapLayers>(() => loadPersisted().mapLayers);
  const [settings, setSettingsState] = useState<AuraSettings>(() => loadPersisted().settings);
  const [globalStatus, setGlobalStatusState] = useState<GlobalStatus>(
    () => loadPersisted().globalStatus,
  );
  const [onboardingCompleted, setOnboardingCompletedState] = useState(
    () => loadPersisted().onboardingCompleted,
  );
  const [shareLocationPrimerAcknowledged, setShareLocationPrimerAcknowledgedState] = useState(
    () => loadPersisted().shareLocationPrimerAcknowledged,
  );
  const [encuentroDraft, setEncuentroDraftState] = useState<EncuentroDraft>(
    () => loadPersisted().encuentroDraft,
  );

  useEffect(() => {
    const payload: Persisted = {
      contacts,
      activeJourney,
      mapLayers,
      settings,
      globalStatus,
      onboardingCompleted,
      shareLocationPrimerAcknowledged,
      encuentroDraft,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    contacts,
    activeJourney,
    mapLayers,
    settings,
    globalStatus,
    onboardingCompleted,
    shareLocationPrimerAcknowledged,
    encuentroDraft,
  ]);

  const setOnboardingCompleted = useCallback((completed: boolean) => {
    setOnboardingCompletedState(completed);
  }, []);

  const setShareLocationPrimerAcknowledged = useCallback((acknowledged: boolean) => {
    setShareLocationPrimerAcknowledgedState(acknowledged);
  }, []);

  const addContact = useCallback((c: Omit<TrustedContact, 'id'>) => {
    const id = crypto.randomUUID();
    setContacts((prev) => [...prev, { ...c, id }]);
  }, []);

  const updateContact = useCallback((id: string, patch: Partial<TrustedContact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const startJourney = useCallback(
    (input: {
      id?: string;
      label: string;
      destinationLabel: string;
      etaMinutes: number;
      trackState?: JourneyTrackState;
    }) => {
      const j: ActiveJourney = {
        id: input.id ?? crypto.randomUUID(),
        label: input.label,
        destinationLabel: input.destinationLabel,
        etaMinutes: input.etaMinutes,
        trackState: input.trackState ?? 'on_track',
        startedAt: new Date().toISOString(),
      };
      setActiveJourney(j);
    },
    [],
  );

  const endJourney = useCallback(() => setActiveJourney(null), []);

  const setTrackState = useCallback((state: JourneyTrackState) => {
    setActiveJourney((j) => (j ? { ...j, trackState: state } : j));
  }, []);

  const setMapLayer = useCallback((key: keyof MapLayers, value: boolean) => {
    setMapLayersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AuraSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setGlobalStatus = useCallback((s: GlobalStatus) => setGlobalStatusState(s), []);

  const updateEncuentroDraft = useCallback((patch: Partial<EncuentroDraft>) => {
    setEncuentroDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearLocalAuraData = useCallback(() => {
    emitTelemetry({ category: 'app', event: 'local_data_cleared' });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore quota / private mode */
    }
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      contacts,
      addContact,
      updateContact,
      removeContact,
      activeJourney,
      startJourney,
      endJourney,
      setTrackState,
      mapLayers,
      setMapLayer,
      settings,
      updateSettings,
      globalStatus,
      setGlobalStatus,
      onboardingCompleted,
      setOnboardingCompleted,
      shareLocationPrimerAcknowledged,
      setShareLocationPrimerAcknowledged,
      clearLocalAuraData,
      encuentroDraft,
      updateEncuentroDraft,
    }),
    [
      contacts,
      addContact,
      updateContact,
      removeContact,
      activeJourney,
      startJourney,
      endJourney,
      setTrackState,
      mapLayers,
      setMapLayer,
      settings,
      updateSettings,
      globalStatus,
      setGlobalStatus,
      onboardingCompleted,
      setOnboardingCompleted,
      shareLocationPrimerAcknowledged,
      setShareLocationPrimerAcknowledged,
      clearLocalAuraData,
      encuentroDraft,
      updateEncuentroDraft,
    ],
  );

  return <AuraContext.Provider value={value}>{children}</AuraContext.Provider>;
}
