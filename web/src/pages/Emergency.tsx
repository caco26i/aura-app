import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { postEmergencyAlert } from '../api/auraBackend';
import { useAura } from '../context/useAura';
import { emitTelemetry } from '../observability/auraTelemetry';

type LocState = { mode?: 'silent' | 'visible' } | null;

type SilentConfirmStep = 0 | 1 | 2;

export function Emergency() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocState;
  const { setGlobalStatus } = useAura();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [visibleConfirmOpen, setVisibleConfirmOpen] = useState(false);
  const [silentConfirmStep, setSilentConfirmStep] = useState<SilentConfirmStep>(0);
  const silentPreferred = state?.mode === 'silent';

  const visibleDialogRef = useRef<HTMLDivElement>(null);
  const silentDialogRef = useRef<HTMLDivElement>(null);

  const anyConfirmOpen = visibleConfirmOpen || silentConfirmStep > 0;

  useEffect(() => {
    if (!anyConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setVisibleConfirmOpen(false);
        setSilentConfirmStep(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyConfirmOpen]);

  useEffect(() => {
    if (visibleConfirmOpen) {
      visibleDialogRef.current?.querySelector<HTMLButtonElement>('button[type="button"]')?.focus();
    }
  }, [visibleConfirmOpen]);

  useEffect(() => {
    if (silentConfirmStep > 0) {
      silentDialogRef.current?.querySelector<HTMLButtonElement>('button[type="button"]')?.focus();
    }
  }, [silentConfirmStep]);

  const send = async (mode: 'silent' | 'visible') => {
    setVisibleConfirmOpen(false);
    setSilentConfirmStep(0);
    setError(null);
    setInfo(null);
    setBusy(true);
    const res = await postEmergencyAlert(mode);
    if (!res.ok) {
      setBusy(false);
      emitTelemetry({ category: 'sos', event: 'alert_failed', mode, error: res.error });
      setError(res.userMessage);
      return;
    }
    emitTelemetry({
      category: 'sos',
      event: 'alert_sent',
      mode,
      alertId: res.data.alertId,
      ...(res.anomalyHeader ? { anomalyHeader: res.anomalyHeader } : {}),
    });
    if (res.notice) {
      setInfo(res.notice);
      await new Promise((r) => setTimeout(r, 3200));
    }
    setBusy(false);
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
          ? 'Silent path: fewer on-screen cues than a visible alert. Sending always takes an extra confirmation step so it is harder to trigger by accident than a visible alert.'
          : 'Visible alert: contacts can be notified when the backend is connected. You will confirm before anything is sent.'}
      </p>

      {error ? (
        <div role="alert" style={{ marginTop: 12, color: '#ffb4b4', fontWeight: 700 }}>
          {error}
        </div>
      ) : null}

      {info ? (
        <div
          role="status"
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.12)',
            lineHeight: 1.5,
          }}
        >
          {info}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          disabled={busy || anyConfirmOpen}
          onClick={() => setVisibleConfirmOpen(true)}
          style={btn('#c94c5c')}
        >
          Send visible alert
        </button>
        <button
          type="button"
          disabled={busy || anyConfirmOpen}
          onClick={() => setSilentConfirmStep(1)}
          style={btn('#5b6fd6')}
        >
          Send silent alert
        </button>
        <button
          type="button"
          disabled={busy || anyConfirmOpen}
          onClick={() => navigate(-1)}
          style={{ ...btn('transparent'), border: '1px solid rgba(255,255,255,0.35)' }}
        >
          Go back
        </button>
      </div>

      {visibleConfirmOpen ? (
        <div
          role="presentation"
          style={overlayStyle}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setVisibleConfirmOpen(false);
          }}
        >
          <div
            ref={visibleDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-visible-confirm-title"
            style={sheetStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="sos-visible-confirm-title" style={{ marginTop: 0, color: '#1a0d22' }}>
              Send alert to trusted contacts?
            </h2>
            <p style={{ color: '#4a3d52', lineHeight: 1.5, marginBottom: 0 }}>
              This will send a visible emergency alert through Aura when the service is connected. If you are in immediate
              danger, contact local emergency services.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setVisibleConfirmOpen(false)}
                style={{
                  ...btn('#fff'),
                  width: '100%',
                  color: '#1a0d22',
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => send('visible')}
                style={{ ...btn('#c94c5c'), width: '100%' }}
                aria-busy={busy}
              >
                {busy ? 'Sending…' : 'Send alert'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {silentConfirmStep > 0 ? (
        <div
          role="presentation"
          style={overlayStyle}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSilentConfirmStep(0);
          }}
        >
          <div
            ref={silentDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={silentConfirmStep === 1 ? 'sos-silent-step1-title' : 'sos-silent-step2-title'}
            style={sheetStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {silentConfirmStep === 1 ? (
              <>
                <h2 id="sos-silent-step1-title" style={{ marginTop: 0, color: '#1a0d22' }}>
                  Silent alert
                </h2>
                <p style={{ color: '#4a3d52', lineHeight: 1.5, marginBottom: 0 }}>
                  A silent alert still notifies your trusted contacts through Aura with fewer on-screen cues. Continue only if
                  you mean to send this alert.
                </p>
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setSilentConfirmStep(0)}
                    style={{
                      ...btn('#fff'),
                      width: '100%',
                      color: '#1a0d22',
                      border: '1px solid rgba(0,0,0,0.12)',
                    }}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={() => setSilentConfirmStep(2)} style={{ ...btn('#5b6fd6'), width: '100%' }}>
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="sos-silent-step2-title" style={{ marginTop: 0, color: '#1a0d22' }}>
                  Send silent alert now?
                </h2>
                <p style={{ color: '#4a3d52', lineHeight: 1.5, marginBottom: 0 }}>
                  This is the last step before Aura sends your silent alert. If you are in immediate danger, contact local
                  emergency services.
                </p>
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSilentConfirmStep(0)}
                    style={{
                      ...btn('#fff'),
                      width: '100%',
                      color: '#1a0d22',
                      border: '1px solid rgba(0,0,0,0.12)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSilentConfirmStep(1)}
                    style={{
                      ...btn('#fff'),
                      width: '100%',
                      color: '#1a0d22',
                      border: '1px solid rgba(0,0,0,0.12)',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => send('silent')}
                    style={{ ...btn('#5b6fd6'), width: '100%' }}
                    aria-busy={busy}
                  >
                    {busy ? 'Sending…' : 'Send silent alert'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  zIndex: 80,
};

const sheetStyle: CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
};

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
