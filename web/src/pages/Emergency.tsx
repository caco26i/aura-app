import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { postEmergencyAlert } from '../api/auraBackend';
import { useAura } from '../context/AuraContext';

type LocState = { mode?: 'silent' | 'visible' } | null;

export function Emergency() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocState;
  const { setGlobalStatus } = useAura();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const silentPreferred = state?.mode === 'silent';

  const send = async (mode: 'silent' | 'visible') => {
    setError(null);
    setBusy(true);
    const res = await postEmergencyAlert(mode);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setGlobalStatus('alert');
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100%',
        padding: 20,
        background: 'linear-gradient(180deg, #2a1530, #1a0d22)',
        color: '#fff',
      }}
    >
      <h1 style={{ marginTop: 0 }}>Emergency</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        {silentPreferred
          ? 'Silent path: we will minimize on-screen cues in a future build. This demo still confirms before sending.'
          : 'Visible alert: contacts can be notified immediately when backend is connected.'}
      </p>

      {error ? (
        <div role="alert" style={{ marginTop: 12, color: '#ffb4b4', fontWeight: 700 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => send('visible')}
          style={btn('#c94c5c')}
        >
          {busy ? 'Sending…' : 'Send visible alert'}
        </button>
        <button type="button" disabled={busy} onClick={() => send('silent')} style={btn('#5b6fd6')}>
          {busy ? 'Sending…' : 'Send silent alert'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => navigate(-1)}
          style={{ ...btn('transparent'), border: '1px solid rgba(255,255,255,0.35)' }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}

function btn(bg: string) {
  return {
    padding: '16px 18px',
    borderRadius: 16,
    border: 'none',
    background: bg,
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer' as const,
  };
}
