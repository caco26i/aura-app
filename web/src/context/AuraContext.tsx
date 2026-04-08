import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  ActiveJourney,
  AuraSettings,
  GlobalStatus,
  JourneyTrackState,
  MapLayers,
  TrustedContact,
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
};

const defaultSettings: AuraSettings = {
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

  useEffect(() => {
    const payload: Persisted = {
      contacts,
      activeJourney,
      mapLayers,
      settings,
      globalStatus,
      onboardingCompleted,
      shareLocationPrimerAcknowledged,
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
    ],
  );

  return <AuraContext.Provider value={value}>{children}</AuraContext.Provider>;
}
