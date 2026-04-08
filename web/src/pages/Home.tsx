import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { registerSosOpenerReturnFocusFromEntry } from '../a11y/sosReturnFocus';
import { useAura } from '../context/useAura';

function greetingLine(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home() {
  const { activeJourney, contacts, globalStatus, settings } = useAura();
  const name = settings.displayName.trim() || 'You';
  const journeyHref = activeJourney ? '/journey/active' : '/journey/new';
  const safeHeadline = globalStatus === 'alert' ? 'Alert active.' : 'Safe.';
  const monitorLine =
    contacts.length === 0
      ? 'Trusted contacts stay on this device until Aura is connected. Add someone to be notified when you share or alert.'
      : `${contacts.length} contact${contacts.length === 1 ? '' : 's'} on this device · tracking and alerts when connected`;

  return (
    <div>
      <h1 style={srOnlyPageTitle}>Home</h1>
      <div
        style={{
          padding: '10px 0 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--k3)' }}>{greetingLine()}</div>
          <div
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 20,
              fontStyle: 'italic',
              color: 'var(--k1)',
            }}
          >
            {name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button type="button" className="ibtn" aria-label="Notifications (coming soon)">
            <span className="mi material-symbols-rounded">notifications</span>
          </button>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--Pbg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--fd)',
              fontStyle: 'italic',
              color: '#fff',
              fontSize: 14,
            }}
            aria-hidden
          >
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 0 18px', textAlign: 'center' }}>
        <div className="logo-orb" aria-hidden />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'var(--k2)',
            marginBottom: 4,
          }}
        >
          <span className="pdot s" />
          Protected · Home area
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            fontFamily: 'var(--fd)',
            fontSize: 56,
            fontStyle: 'italic',
            color: 'var(--k1)',
            lineHeight: 0.9,
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          {safeHeadline}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--k2)',
            fontWeight: 300,
            maxWidth: 260,
            margin: '0 auto',
            lineHeight: 1.45,
          }}
        >
          {monitorLine}
        </div>
      </div>

      <div className="m3-rule" />

      <Link to={journeyHref} className="btn-p" style={{ marginBottom: 12 }}>
        <span className="mi material-symbols-rounded s18">navigation</span>
        {activeJourney ? 'Continue safe journey' : 'Start safe journey'}
      </Link>

      <div className="slbl">Security features</div>
      <div className="feat-grid" style={{ marginBottom: 8 }}>
        <Link to="/journey/new" className="feat-tile">
          <span className="mi material-symbols-rounded s28 ft-ic">route</span>
          <span className="ft-l">Journey</span>
        </Link>
        <Link to="/journey/active" className="feat-tile">
          <span className="mi material-symbols-rounded s28 ft-ic">location_on</span>
          <span className="ft-l">Tracking</span>
        </Link>
        <Link
          to="/emergency"
          className="feat-tile"
          data-aura-sos-entry="home-tile"
          onClick={() => {
            registerSosOpenerReturnFocusFromEntry('home-tile');
          }}
        >
          <span className="mi material-symbols-rounded s28" style={{ color: 'var(--danger)' }}>
            emergency
          </span>
          <span className="ft-l" style={{ color: 'var(--danger)' }}>
            SOS
          </span>
        </Link>
      </div>

      <div className="feat-grid">
        <Link to="/cita" className="feat-tile new">
          <span className="mi material-symbols-rounded s28 ft-ic">favorite</span>
          <span className="ft-l">Modo Cita</span>
          <span className="ft-new">NUEVO</span>
        </Link>
        <Link to="/transport" className="feat-tile new">
          <span className="mi material-symbols-rounded s28 ft-ic">directions_car</span>
          <span className="ft-l">Transporte</span>
          <span className="ft-new">NUEVO</span>
        </Link>
        <Link to="/checkin" className="feat-tile new">
          <span className="mi material-symbols-rounded s28 ft-ic">check_circle</span>
          <span className="ft-l">Check-in IA</span>
          <span className="ft-new">NUEVO</span>
        </Link>
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 16px',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <Link to="/map" style={{ color: 'var(--P)' }}>
          Safety map
        </Link>
        <Link to="/trusted" style={{ color: 'var(--P)' }}>
          Network
        </Link>
        <Link to="/settings" style={{ color: 'var(--P)' }}>
          Settings
        </Link>
      </div>
    </div>
  );
}

/** Visually hidden; keeps a single top-level heading for SR / heading navigation (PDR §5). */
const srOnlyPageTitle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
