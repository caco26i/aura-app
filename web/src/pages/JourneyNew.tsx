import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { postCreateJourney } from '../api/auraBackend';
import { useAura } from '../context/useAura';
import { emitTelemetry } from '../observability/auraTelemetry';

export function JourneyNew() {
  const navigate = useNavigate();
  const { startJourney, settings } = useAura();
  const [label, setLabel] = useState('Walk home');
  const [destination, setDestination] = useState('Home');
  const [eta, setEta] = useState(String(settings.timerDefaultMinutes));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const onStart = async () => {
    const etaMinutes = Math.max(1, Number.parseInt(eta, 10) || settings.timerDefaultMinutes);
    setStartError(null);
    setStarting(true);
    try {
      const created = await postCreateJourney();
      if (!created.ok) {
        setStartError(created.userMessage);
        return;
      }
      emitTelemetry({
        category: 'journey',
        event: 'started',
        etaMinutes,
        locationPrecision: settings.locationPrecision,
      });
      startJourney({
        id: created.data.journeyId,
        label,
        destinationLabel: destination,
        etaMinutes,
        trackState: 'on_track',
      });
      navigate('/journey/active');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>New journey</h1>
      <p style={{ color: 'var(--aura-muted)' }}>Details persist once you start — refresh mid-journey is safe.</p>

      <div aria-busy={starting}>
        <label style={{ display: 'block', marginTop: 16, fontWeight: 600 }} htmlFor="j-label">
          Journey name
        </label>
        <input
          id="j-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={inputStyle}
          disabled={starting}
        />

        <label style={{ display: 'block', marginTop: 12, fontWeight: 600 }} htmlFor="j-dest">
          Destination
        </label>
        <input
          id="j-dest"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={inputStyle}
          disabled={starting}
        />

        <label style={{ display: 'block', marginTop: 12, fontWeight: 600 }} htmlFor="j-eta">
          ETA (minutes)
        </label>
        <input
          id="j-eta"
          inputMode="numeric"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          style={inputStyle}
          disabled={starting}
        />

        {startError ? (
          <p role="alert" style={{ marginTop: 12, color: '#b42318', fontSize: 14 }}>
            {startError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onStart}
          style={btnPrimary}
          disabled={starting}
          aria-busy={starting}
        >
          {starting ? 'Starting…' : 'Start live tracking'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: '#fff',
};

const btnPrimary: CSSProperties = {
  marginTop: 20,
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #c9b8ff, #f4b8c5)',
  color: '#1c1530',
  fontWeight: 700,
  cursor: 'pointer',
};
