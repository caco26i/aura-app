import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postImSafe, postShareLocation } from '../api/auraBackend';
import { emitTelemetry } from '../observability/auraTelemetry';
import { AuraMap } from '../components/AuraMap';
import { StatusPill } from '../components/StatusPill';
import { useAura } from '../context/AuraContext';
import { MAP_INTEL_SEED } from '../data/mapIntelSeed';

export function JourneyActive() {
  const navigate = useNavigate();
  const { activeJourney, contacts, endJourney, setTrackState, mapLayers } = useAura();
  const [busy, setBusy] = useState<'safe' | 'share' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [silentSheetOpen, setSilentSheetOpen] = useState(false);

  if (!activeJourney) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>No active journey</h1>
        <p style={{ color: 'var(--aura-muted)' }} role="status">
          Start a journey to enable live tracking and backend actions.
        </p>
        {contacts.length === 0 ? (
          <p>
            <Link to="/trusted">Add trusted contacts</Link> so someone can be notified when you share location.
          </p>
        ) : (
          <Link to="/journey/new">Start journey</Link>
        )}
      </div>
    );
  }

  const visibleIntel = MAP_INTEL_SEED.filter((f) => {
    if (f.kind === 'risk') return mapLayers.risk;
    if (f.kind === 'safe') return mapLayers.safePoints;
    return mapLayers.activity;
  });

  const runSafe = async () => {
    setError(null);
    setBusy('safe');
    const res = await postImSafe(activeJourney.id);
    setBusy(null);
    if (!res.ok) {
      emitTelemetry({ category: 'journey', event: 'im_safe_failed', journeyId: activeJourney.id, error: res.error });
      setError(res.error);
      return;
    }
    emitTelemetry({ category: 'journey', event: 'im_safe', journeyId: activeJourney.id });
  };

  const runShare = async () => {
    setError(null);
    setBusy('share');
    const res = await postShareLocation(activeJourney.id);
    setBusy(null);
    if (!res.ok) {
      emitTelemetry({
        category: 'journey',
        event: 'share_location_failed',
        journeyId: activeJourney.id,
        error: res.error,
      });
      setError(res.error);
      return;
    }
    emitTelemetry({ category: 'journey', event: 'share_location', journeyId: activeJourney.id });
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Live tracking</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <StatusPill state={activeJourney.trackState} />
        <span style={{ color: 'var(--aura-muted)', fontSize: 13 }}>ETA ~{activeJourney.etaMinutes} min</span>
      </div>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{activeJourney.label}</p>
      <p style={{ color: 'var(--aura-muted)', marginTop: 0 }}>To {activeJourney.destinationLabel}</p>

      <p style={{ fontSize: 13, color: 'var(--aura-muted)' }}>
        Double-tap the map for a silent SOS shortcut (demo gesture).
      </p>
      <AuraMap
        features={visibleIntel}
        height={320}
        onDoubleTapHint={() => setSilentSheetOpen(true)}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          aria-pressed={activeJourney.trackState === 'on_track'}
          onClick={() => {
            emitTelemetry({ category: 'journey', event: 'track_state', state: 'on_track' });
            setTrackState('on_track');
          }}
        >
          On track
        </button>
        <button
          type="button"
          aria-pressed={activeJourney.trackState === 'delay'}
          onClick={() => {
            emitTelemetry({ category: 'journey', event: 'track_state', state: 'delay' });
            setTrackState('delay');
          }}
        >
          Delay
        </button>
        <button
          type="button"
          aria-pressed={activeJourney.trackState === 'deviation'}
          onClick={() => {
            emitTelemetry({ category: 'journey', event: 'track_state', state: 'deviation' });
            setTrackState('deviation');
          }}
        >
          Deviation
        </button>
      </div>

      {error ? (
        <div role="alert" style={{ marginTop: 12, color: 'var(--aura-status-alert)', fontWeight: 600 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <button type="button" disabled={busy !== null} onClick={runSafe} style={actionBtn}>
          {busy === 'safe' ? 'Sending…' : "I'm safe"}
        </button>
        <button type="button" disabled={busy !== null} onClick={runShare} style={actionBtn}>
          {busy === 'share' ? 'Sharing…' : 'Share live location'}
        </button>
        <button
          type="button"
          onClick={() => {
            emitTelemetry({ category: 'journey', event: 'ended', journeyId: activeJourney.id });
            endJourney();
          }}
          style={{ ...actionBtn, background: '#fff' }}
        >
          End journey
        </button>
      </div>

      {silentSheetOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Silent alert options"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'grid',
            placeItems: 'end center',
            padding: 16,
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 'calc(24px + var(--aura-safe-area-bottom))',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Silent alert</h2>
            <p style={{ color: 'var(--aura-muted)' }}>Open emergency flow in silent mode (fewer visible cues).</p>
            <button
              type="button"
              style={{ ...actionBtn, marginTop: 12 }}
              onClick={() => {
                setSilentSheetOpen(false);
                navigate('/emergency', { state: { mode: 'silent' as const } });
              }}
            >
              Continue to emergency
            </button>
            <button
              type="button"
              style={{ ...actionBtn, marginTop: 8, background: '#fff' }}
              onClick={() => setSilentSheetOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const actionBtn: CSSProperties = {
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid var(--aura-border)',
  background: 'var(--aura-lavender-wash)',
  fontWeight: 700,
  cursor: 'pointer',
};
