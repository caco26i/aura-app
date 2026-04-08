import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAura } from '../context/useAura';

const card: CSSProperties = {
  display: 'block',
  padding: 16,
  borderRadius: 'var(--aura-radius-lg)',
  background: 'var(--aura-card)',
  border: '1px solid var(--aura-border)',
  boxShadow: 'var(--aura-shadow)',
  textDecoration: 'none',
  marginBottom: 12,
};

export function Home() {
  const { activeJourney, contacts } = useAura();

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 26 }}>Aura</h1>
      <p style={{ margin: '0 0 20px', color: 'var(--aura-muted)', lineHeight: 1.5 }}>
        Your journeys, trusted network, and map intelligence — persisted on this device.
      </p>

      <Link to={activeJourney ? '/journey/active' : '/journey/new'} style={card}>
        <div style={{ fontWeight: 700 }}>{activeJourney ? 'Continue journey' : 'Start a journey'}</div>
        <div style={{ fontSize: 13, color: 'var(--aura-muted)', marginTop: 6 }}>
          {activeJourney
            ? `${activeJourney.label} · ETA ~${activeJourney.etaMinutes} min`
            : 'Plan destination and go live with tracking'}
        </div>
      </Link>

      <Link to="/map" style={card}>
        <div style={{ fontWeight: 700 }}>Map intel</div>
        <div style={{ fontSize: 13, color: 'var(--aura-muted)', marginTop: 6 }}>
          Risk, safe points, and activity layers
        </div>
      </Link>

      <Link to="/trusted" style={card}>
        <div style={{ fontWeight: 700 }}>Trusted network</div>
        <div style={{ fontSize: 13, color: 'var(--aura-muted)', marginTop: 6 }}>
          {contacts.length === 0 ? 'Add your first contact' : `${contacts.length} contacts saved`}
        </div>
      </Link>

      <Link to="/settings" style={card}>
        <div style={{ fontWeight: 700 }}>Settings</div>
        <div style={{ fontSize: 13, color: 'var(--aura-muted)', marginTop: 6 }}>
          Voice keyword, silent trigger, timers
        </div>
      </Link>
    </div>
  );
}
