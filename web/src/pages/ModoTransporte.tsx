import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

type RidePhase = 'empty' | 'active';

export function ModoTransporte() {
  const [phase, setPhase] = useState<RidePhase>('empty');
  const [deviationNoted, setDeviationNoted] = useState(false);
  const [mismatchNoted, setMismatchNoted] = useState(false);

  const liveMessage = useMemo(() => {
    if (phase === 'empty') {
      return 'Sin viaje activo en esta demostración. Cuando inicies un viaje de prueba, aquí verás recordatorios de verificación de placa y conductor.';
    }
    if (mismatchNoted) {
      return 'Marcado: vehículo o persona no coinciden. No entres al auto; cancela en la app del proveedor y muévete a un lugar con gente. Para riesgo inmediato usa SOS desde la barra inferior.';
    }
    if (deviationNoted) {
      return 'Registramos una posible desvío de ruta en esta demostración. Revisa el mapa del proveedor, cancela si no te sientes segura, o usa SOS si hay peligro inmediato. No asumimos alerta automática.';
    }
    return 'Viaje de demostración activo. Confirma placa y conductor antes de subir. Las fotos y el backend de verificación llegarán en otro entregable.';
  }, [phase, deviationNoted, mismatchNoted]);

  const resetScenario = () => {
    setPhase('empty');
    setDeviationNoted(false);
    setMismatchNoted(false);
  };

  const startDemoRide = () => {
    setPhase('active');
    setDeviationNoted(false);
    setMismatchNoted(false);
  };

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
        Comprobaciones antes de subir: todo es <strong>local en este navegador</strong> hasta que exista contrato con backend y proveedor. El tono prioriza calma y el siguiente paso concreto (alineado a las guías de Aura para estados vacíos y mensajes al usuario).
      </p>

      <div
        id="transport-live-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={liveRegion}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Estado del modo transporte</div>
        <p style={{ margin: 0, lineHeight: 1.45 }}>{liveMessage}</p>
      </div>

      {phase === 'empty' ? (
        <section aria-labelledby="transport-empty-heading" style={section}>
          <h2 id="transport-empty-heading" style={h2}>
            Aún sin viaje
          </h2>
          <p className="m3-muted" style={{ marginTop: 0, lineHeight: 1.45 }}>
            Cuando llegue tu ride, confirma placa y persona con calma. Si algo no cuadra, puedes marcarlo aquí como recordatorio; la app del proveedor sigue siendo la fuente de verdad.
          </p>
          <button type="button" className="ibtn" onClick={startDemoRide} style={primaryBtn}>
            Iniciar viaje de demostración
          </button>
        </section>
      ) : (
        <section aria-labelledby="transport-ride-heading" style={section}>
          <h2 id="transport-ride-heading" style={h2}>
            Verificación del viaje (wireframe)
          </h2>

          <div style={rideCard}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>ABC-12·34</div>
            <p className="m3-muted" style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.45 }}>
              Placa de ejemplo — en vivo vendrá del proveedor o foto OCR cuando exista API.
            </p>
            <div style={thumbRow}>
              <div style={thumb}>
                <span className="m3-muted" style={{ fontSize: 12 }}>
                  Foto placa
                </span>
              </div>
              <div style={thumb}>
                <span className="m3-muted" style={{ fontSize: 12 }}>
                  Foto conductor
                </span>
              </div>
            </div>
            <label htmlFor="transport-plate-verify" style={{ ...label, marginTop: 14 }}>
              <input id="transport-plate-verify" type="checkbox" style={{ marginRight: 8 }} />
              Confirmo que la placa coincide con lo que veo
            </label>
            <label htmlFor="transport-driver-verify" style={{ ...label, marginTop: 10 }}>
              <input id="transport-driver-verify" type="checkbox" style={{ marginRight: 8 }} />
              Confirmo que la persona coincide con la foto o nombre esperado
            </label>
          </div>

          <div style={actionRow}>
            <button
              type="button"
              className="ibtn"
              onClick={() => {
                setDeviationNoted(true);
                setMismatchNoted(false);
              }}
              aria-pressed={deviationNoted && !mismatchNoted}
            >
              Posible desvío de ruta
            </button>
            <button
              type="button"
              className="ibtn"
              onClick={() => {
                setMismatchNoted(true);
                setDeviationNoted(false);
              }}
              aria-pressed={mismatchNoted}
            >
              No soy yo / no es mi viaje
            </button>
          </div>

          <p className="m3-muted" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.45 }}>
            Estos botones solo actualizan mensajes en pantalla en esta compilación; no envían alertas a Aura ni al proveedor.
          </p>

          <button type="button" className="ibtn" onClick={resetScenario} style={{ marginTop: 8 }}>
            Volver a estado vacío
          </button>
        </section>
      )}
    </div>
  );
}

const section: CSSProperties = { marginTop: 20 };
const h2: CSSProperties = { fontSize: 18, marginBottom: 12 };
const label: CSSProperties = { display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: 14 };
const liveRegion: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'rgba(255,255,255,0.55)',
};
const primaryBtn: CSSProperties = { fontWeight: 600, marginTop: 12 };
const rideCard: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: '1px solid var(--aura-border)',
  background: 'var(--aura-card)',
};
const thumbRow: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const thumb: CSSProperties = {
  flex: '1 1 120px',
  minHeight: 72,
  borderRadius: 12,
  border: '1px dashed var(--aura-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.5)',
};
const actionRow: CSSProperties = {
  marginTop: 16,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};
