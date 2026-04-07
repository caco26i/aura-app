import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAura } from '../context/AuraContext';
import { emitTelemetry } from '../observability/auraTelemetry';

export function JourneyNew() {
  const navigate = useNavigate();
  const { startJourney, settings } = useAura();
  const [label, setLabel] = useState('Walk home');
  const [destination, setDestination] = useState('Home');
  const [eta, setEta] = useState(String(settings.timerDefaultMinutes));

  const onStart = () => {
    const etaMinutes = Math.max(1, Number.parseInt(eta, 10) || settings.timerDefaultMinutes);
    emitTelemetry({
      category: 'journey',
      event: 'started',
      etaMinutes,
      locationPrecision: settings.locationPrecision,
    });
    startJourney({
      label,
      destinationLabel: destination,
      etaMinutes,
      trackState: 'on_track',
    });
    navigate('/journey/active');
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>New journey</h1>
      <p style={{ color: 'var(--aura-muted)' }}>Details persist once you start — refresh mid-journey is safe.</p>

      <label style={{ display: 'block', marginTop: 16, fontWeight: 600 }} htmlFor="j-label">
        Journey name
      </label>
      <input
        id="j-label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={inputStyle}
      />

      <label style={{ display: 'block', marginTop: 12, fontWeight: 600 }} htmlFor="j-dest">
        Destination
      </label>
      <input
        id="j-dest"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        style={inputStyle}
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
      />

      <button type="button" onClick={onStart} style={btnPrimary}>
        Start live tracking
      </button>
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
