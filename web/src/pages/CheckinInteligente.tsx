import { useCallback, useId, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

const TRIGGER_ROWS: { id: string; label: string; hint: string }[] = [
  { id: 't1', label: 'Salida de zona segura', hint: 'Cuando sales de un área que marcaste como habitual.' },
  { id: 't2', label: 'Cita / encuentro', hint: 'Recordatorio ligado a Modo Cita cuando exista integración.' },
  { id: 't3', label: 'Fin de temporizador', hint: 'Ping cuando se cumple un intervalo que configuraste.' },
  { id: 't4', label: 'Viaje en curso', hint: 'Chequeo durante Modo Transporte con backend de viaje.' },
  { id: 't5', label: 'Silencio prolongado', hint: 'Si dejaste activa la detección y no hubo señal (futuro).' },
  { id: 't6', label: 'Palabra o gesto de alerta', hint: 'Disparadores de emergencia suaves, sin alarmismo.' },
];

const QUICK_REPLIES = ['Todo bien', 'Llegué bien', 'Demoro 10 min', 'Necesito ayuda'] as const;

type HistoryItem = { id: string; at: string; text: string };

function formatNowEs(): string {
  return new Date().toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function CheckinInteligente() {
  const triggersHeadingId = useId();
  const [announcement, setAnnouncement] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(() => [
    { id: 'seed-1', at: '—', text: 'Ejemplo: «Todo bien» (demo anterior)' },
  ]);

  const pushHistory = useCallback((text: string) => {
    const line = `${text} · ${formatNowEs()}`;
    setHistory((h) => [{ id: `${Date.now()}`, at: formatNowEs(), text: line }, ...h]);
    setAnnouncement(`Respuesta registrada solo en este dispositivo: ${text}.`);
  }, []);

  return (
    <div>
      <header className="m3-tbar" aria-labelledby="checkin-ia-title">
        <Link to="/" className="ibtn" aria-label="Volver al inicio">
          <span className="mi material-symbols-rounded" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 id="checkin-ia-title" className="m3-tbar-title" style={{ margin: 0 }}>
          Check-in IA
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
            check_circle
          </span>
        </div>
        <div>
          <div className="mb-title">Check-in inteligente</div>
          <div className="mb-sub">Disparadores · Respuestas rápidas · Historial</div>
        </div>
      </div>

      <p className="m3-muted">
        Lista de disparadores y respuestas como en el prototipo. Priorización, push y SMS quedan para ingeniería; aquí
        todo es local y sirve para revisar flujo y accesibilidad.
      </p>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="checkin-ia-announce"
        style={announceRegion}
      >
        {announcement ? (
          announcement
        ) : (
          <span className="m3-muted" style={{ fontStyle: 'italic' }}>
            Las respuestas rápidas anunciarán aquí un resumen breve al pulsarlas.
          </span>
        )}
      </div>

      <section aria-labelledby={triggersHeadingId} style={section}>
        <h2 id={triggersHeadingId} style={h2}>
          Disparadores (wireframe)
        </h2>
        <ul style={listReset}>
          {TRIGGER_ROWS.map((row) => (
            <li key={row.id} style={listItem}>
              <div style={{ fontWeight: 600 }}>{row.label}</div>
              <p className="m3-muted" style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.4 }}>
                {row.hint}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="checkin-quick-heading" style={{ ...section, marginTop: 8 }}>
        <h2 id="checkin-quick-heading" style={h2}>
          Respuestas rápidas
        </h2>
        <p className="m3-muted" style={{ marginTop: 0 }}>
          Toques únicos para contestar un check-in sugerido. Sin red en esta compilación.
        </p>
        <div style={chipRow}>
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              className="ibtn"
              style={chipBtn}
              onClick={() => pushHistory(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="checkin-history-heading" style={{ ...section, marginTop: 8 }}>
        <h2 id="checkin-history-heading" style={h2}>
          Historial en este dispositivo
        </h2>
        <ul style={listReset} data-testid="checkin-history">
          {history.map((item) => (
            <li key={item.id} style={historyRow}>
              {item.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const section: CSSProperties = { marginTop: 20 };
const h2: CSSProperties = { fontSize: 18, marginBottom: 12 };
const listReset: CSSProperties = { listStyle: 'none', padding: 0, margin: 0 };
const listItem: CSSProperties = {
  padding: '12px 0',
  borderBottom: '1px solid var(--aura-border)',
};
const chipRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chipBtn: CSSProperties = { fontWeight: 600 };
const historyRow: CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid var(--aura-border)',
  lineHeight: 1.45,
};
const announceRegion: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'rgba(255,255,255,0.55)',
  minHeight: 48,
};
