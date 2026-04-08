import { useCallback, useId, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

type RidePhase = 'empty' | 'active' | 'verified';

export function ModoTransporte() {
  const notMeHeadingId = useId();
  const [phase, setPhase] = useState<RidePhase>('empty');
  const [plate, setPlate] = useState('');
  const [driverHint, setDriverHint] = useState('');
  const [showNotMe, setShowNotMe] = useState(false);
  const [deviationNotice, setDeviationNotice] = useState(false);

  const statusMessage = (() => {
    if (phase === 'empty') {
      return 'Sin viaje activo. Cuando estés en camino, podrás comparar placa y conductor con lo que esperas.';
    }
    if (phase === 'active') {
      return 'Viaje en verificación: revisa placa y datos del conductor antes de subir. Si algo no coincide, usa «No soy yo».';
    }
    return 'Verificación marcada como correcta en este dispositivo. Sigue atento al trayecto; puedes reportar un desvío si la ruta no coincide con lo acordado.';
  })();

  const dismissNotMe = useCallback(() => setShowNotMe(false), []);

  return (
    <div>
      <header className="m3-tbar" aria-labelledby="modo-transporte-title">
        <Link to="/" className="ibtn" aria-label="Volver al inicio">
          <span className="mi material-symbols-rounded" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 id="modo-transporte-title" className="m3-tbar-title" style={{ margin: 0 }}>
          Modo Transporte
        </h1>
        <span className="feat-badge">
          <span className="mi material-symbols-rounded s18" aria-hidden>
            auto_awesome
          </span>{' '}
          Nuevo
        </span>
      </header>

      <div className="mode-banner">
        <div className="mb-ic">
          <span className="mi material-symbols-rounded s28" aria-hidden>
            directions_car
          </span>
        </div>
        <div>
          <div className="mb-title">Viajes y rides</div>
          <div className="mb-sub">Placa · Conductor · Desvío · &quot;No soy yo&quot;</div>
        </div>
      </div>

      <p className="m3-muted">
        Comprueba vehículo y conductor con calma. Los datos no se envían al servidor en esta versión; sirven como guía
        antes de que exista contrato de viaje con backend.
      </p>

      <div
        role="status"
        aria-live="polite"
        data-testid="transport-status"
        style={statusBox}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Estado del modo transporte</div>
        <p style={{ margin: 0, lineHeight: 1.45 }}>{statusMessage}</p>
      </div>

      {phase === 'empty' ? (
        <section aria-labelledby="transport-empty-heading" style={section}>
          <h2 id="transport-empty-heading" style={h2}>
            Aún sin viaje
          </h2>
          <p className="m3-muted" style={{ marginTop: 0 }}>
            Cuando tengas un viaje reservado o en curso, activa la pantalla de verificación para cotejar placa y
            conductor. No presionamos: es un recordatorio visual.
          </p>
          <button
            type="button"
            className="ibtn"
            style={primaryBtn}
            onClick={() => {
              setPhase('active');
              setPlate('');
              setDriverHint('');
              setDeviationNotice(false);
            }}
          >
            Empezar verificación (demo)
          </button>
        </section>
      ) : (
        <>
          <section aria-labelledby="transport-verify-heading" style={section}>
            <h2 id="transport-verify-heading" style={h2}>
              Verificar vehículo y conductor
            </h2>
            <label htmlFor="transport-plate" style={label}>
              Placa o identificador visible
              <input
                id="transport-plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                autoComplete="off"
                placeholder="Ej. ABC-123"
                style={field}
              />
            </label>
            <label htmlFor="transport-driver" style={label}>
              Nota sobre el conductor (nombre en app, foto, señas)
              <input
                id="transport-driver"
                value={driverHint}
                onChange={(e) => setDriverHint(e.target.value)}
                autoComplete="off"
                placeholder="Lo que recuerdes del perfil o mensajes"
                style={field}
              />
            </label>
            <p className="m3-muted" style={{ marginTop: 12 }}>
              La captura de fotos y la validación con servidor irán en un ticket de ingeniería; aquí solo anotación local.
            </p>
            <div style={btnRow}>
              <button
                type="button"
                className="ibtn"
                style={primaryBtn}
                onClick={() => setPhase('verified')}
                disabled={phase === 'verified'}
              >
                Coincide, es mi viaje
              </button>
              <button type="button" className="ibtn" onClick={() => setShowNotMe(true)}>
                No soy yo / no es mi viaje
              </button>
            </div>
          </section>

          {phase === 'verified' ? (
            <section aria-labelledby="transport-route-heading" style={{ ...section, marginTop: 8 }}>
              <h2 id="transport-route-heading" style={h2}>
                Durante el trayecto
              </h2>
              <p className="m3-muted" style={{ marginTop: 0 }}>
                Si la ruta se aleja de lo acordado, puedes dejar constancia aquí (demo local). En producción esto se
                conectaría con alertas y contactos de confianza.
              </p>
              <button
                type="button"
                className="ibtn"
                onClick={() => setDeviationNotice((v) => !v)}
                aria-expanded={deviationNotice}
              >
                {deviationNotice ? 'Ocultar aviso de desvío' : 'Reportar desvío de ruta (demo)'}
              </button>
              {deviationNotice ? (
                <div
                  role="status"
                  aria-live="polite"
                  data-testid="transport-deviation"
                  style={{ ...noticeBox, marginTop: 12 }}
                >
                  <strong>Desvío anotado (solo en este dispositivo).</strong> Comprueba el mapa, tu destino y, si hace
                  falta, usa SOS o contactos de confianza desde el inicio.
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {showNotMe ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={notMeHeadingId}
          style={sheetOverlay}
        >
          <div style={sheetCard}>
            <h2 id={notMeHeadingId} style={{ ...h2, marginTop: 0 }}>
              Si no es tu viaje
            </h2>
            <p style={{ margin: '0 0 12px', lineHeight: 1.45 }}>
              No subas al vehículo. Aléjate con calma, entra a un lugar con gente si puedes, y usa SOS o tu red de
              confianza si te sientes en riesgo. Este mensaje es local; la escalada automática llegará con backend.
            </p>
            <div style={btnRow}>
              <button type="button" className="ibtn" style={primaryBtn} onClick={dismissNotMe}>
                Entendido
              </button>
              <Link to="/emergency" className="ibtn" style={{ ...primaryBtn, textAlign: 'center', textDecoration: 'none' }}>
                Ir a SOS
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {phase !== 'empty' ? (
        <p className="m3-muted" style={{ marginTop: 16 }}>
          <button type="button" className="ibtn" onClick={() => setPhase('empty')}>
            Volver a estado sin viaje
          </button>
        </p>
      ) : null}
    </div>
  );
}

const section: CSSProperties = { marginTop: 20 };
const h2: CSSProperties = { fontSize: 18, marginBottom: 12 };
const label: CSSProperties = { display: 'block', marginTop: 14, fontWeight: 600 };
const field: CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: '#fff',
  boxSizing: 'border-box',
};
const statusBox: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'rgba(255,255,255,0.55)',
};
const noticeBox: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(180, 120, 40, 0.45)',
  background: 'rgba(255, 248, 220, 0.85)',
  lineHeight: 1.45,
};
const btnRow: CSSProperties = {
  marginTop: 16,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};
const primaryBtn: CSSProperties = { fontWeight: 600 };
const sheetOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: 16,
  zIndex: 50,
};
const sheetCard: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  padding: 20,
  borderRadius: 16,
  background: 'var(--aura-surface, #fff)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};
