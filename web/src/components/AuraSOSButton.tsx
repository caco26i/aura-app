import { useNavigate, useLocation } from 'react-router-dom';
import { useAura } from '../context/useAura';
import { emitTelemetry } from '../observability/auraTelemetry';

export function AuraSOSButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { globalStatus } = useAura();

  if (location.pathname === '/emergency') return null;

  const bg = globalStatus === 'alert' ? 'var(--aura-status-alert)' : 'var(--aura-blush)';

  return (
    <button
      type="button"
      aria-label="Emergency SOS"
      onClick={() => {
        emitTelemetry({ category: 'sos', event: 'fab_open' });
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
