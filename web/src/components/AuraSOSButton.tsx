import { useNavigate, useLocation } from 'react-router-dom';
import { registerSosOpenerReturnFocusFromEntry } from '../a11y/sosReturnFocus';
import { useAura } from '../context/useAura';
import { emitTelemetry } from '../observability/auraTelemetry';

export function AuraSOSButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { globalStatus } = useAura();

  if (location.pathname === '/emergency') return null;

  const bg = globalStatus === 'alert' ? 'var(--aura-status-alert)' : 'var(--aura-blush)';

  const sosLabel = globalStatus === 'alert' ? 'Emergency SOS — alert active' : 'Emergency SOS';

  return (
    <button
      type="button"
      aria-label={sosLabel}
      data-aura-sos-entry="fab"
      onClick={() => {
        emitTelemetry({ category: 'sos', event: 'fab_open' });
        registerSosOpenerReturnFocusFromEntry('fab');
        navigate('/emergency');
      }}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 'calc(88px + var(--aura-safe-area-bottom))',
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: bg,
        color: '#fff',
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.5,
        boxShadow: 'var(--aura-shadow)',
        cursor: 'pointer',
        zIndex: 50,
      }}
    >
      SOS
    </button>
  );
}
