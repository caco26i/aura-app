import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAura } from '../context/useAura';

function parseMeetingLocalMs(value: string): number | null {
  if (!value.trim()) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

function formatDurationEs(ms: number): string {
  if (ms <= 0) return '0 min';
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function checkInShellCopy(
  now: number,
  meetingMs: number | null,
  intervalMin: number,
): string {
  if (meetingMs === null) {
    return 'Indica la hora del encuentro para ver la cuenta regresiva y sugerencias de check-in locales.';
  }
  if (meetingMs <= now) {
    return 'Hora del encuentro alcanzada o pasada. Revisa tu entorno y mantén tu palabra de seguridad lista.';
  }
  const untilMeeting = meetingMs - now;
  const intervalMs = intervalMin * 60_000;
  const nextTick = Math.min(intervalMs, untilMeeting);
  const meetingStr = new Date(meetingMs).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return `Encuentro programado: ${meetingStr}. Falta ${formatDurationEs(
    untilMeeting,
  )}. Próximo recordatorio local sugerido en ${formatDurationEs(nextTick)} (sin alertas automáticas aún).`;
}

export function ModoCita() {
  const { encuentroDraft, updateEncuentroDraft } = useAura();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const meetingMs = useMemo(
    () => parseMeetingLocalMs(encuentroDraft.meetingLocalValue),
    [encuentroDraft.meetingLocalValue],
  );

  const liveStatus = useMemo(() => {
    const now = Date.now();
    void tick;
    return checkInShellCopy(now, meetingMs, encuentroDraft.checkInIntervalMinutes);
  }, [meetingMs, encuentroDraft.checkInIntervalMinutes, tick]);

  return (
    <div>
      <header className="m3-tbar" aria-labelledby="modo-cita-title">
        <Link to="/" className="ibtn" aria-label="Volver al inicio">
          <span className="mi material-symbols-rounded" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 id="modo-cita-title" className="m3-tbar-title" style={{ margin: 0 }}>
          Modo Cita
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
            favorite
          </span>
        </div>
        <div>
          <div className="mb-title">Modo Cita / Encuentro</div>
          <div className="mb-sub">Citas · Reuniones · Transacciones · Desconocidos</div>
        </div>
      </div>

      <p className="m3-muted">
        Flujo alineado al prototipo M3: palabra de seguridad, datos del encuentro y check-ins antes de reunirte con
        alguien. Los datos se guardan solo en este navegador; alertas y API vendrán en otro ticket.
      </p>

      <section aria-labelledby="cita-encuentro-heading" style={section}>
        <h2 id="cita-encuentro-heading" style={h2}>
          Datos del encuentro
        </h2>

        <label htmlFor="cita-contact-name" style={label}>
          Nombre o apodo del contacto
          <input
            id="cita-contact-name"
            value={encuentroDraft.contactName}
            onChange={(e) => updateEncuentroDraft({ contactName: e.target.value })}
            autoComplete="off"
            style={field}
          />
        </label>

        <label htmlFor="cita-place" style={label}>
          Lugar
          <input
            id="cita-place"
            value={encuentroDraft.place}
            onChange={(e) => updateEncuentroDraft({ place: e.target.value })}
            autoComplete="off"
            style={field}
          />
        </label>

        <label htmlFor="cita-safety-keyword" style={label}>
          Palabra de seguridad
          <input
            id="cita-safety-keyword"
            value={encuentroDraft.safetyKeyword}
            onChange={(e) => updateEncuentroDraft({ safetyKeyword: e.target.value })}
            autoComplete="off"
            style={field}
          />
        </label>

        <div style={label}>
          <span id="cita-photo-label">Foto de contexto</span>
          <input
            type="file"
            accept="image/*"
            disabled
            aria-labelledby="cita-photo-label"
            aria-describedby="cita-photo-hint"
            style={{ ...field, marginTop: 6, opacity: 0.65, cursor: 'not-allowed' }}
          />
          <p id="cita-photo-hint" className="m3-muted" style={{ marginTop: 6, fontSize: 13 }}>
            La subida de fotos aún no está conectada; este control es un marcador de diseño.
          </p>
        </div>
      </section>

      <section aria-labelledby="cita-checkin-heading" style={{ ...section, marginTop: 8 }}>
        <h2 id="cita-checkin-heading" style={h2}>
          Check-in antes del encuentro
        </h2>
        <p className="m3-muted" style={{ marginTop: 0 }}>
          Recordatorios visuales en pantalla. Sin SMS, push ni backend todavía.
        </p>

        <label htmlFor="cita-meeting-time" style={label}>
          Hora del encuentro
          <input
            id="cita-meeting-time"
            type="datetime-local"
            value={encuentroDraft.meetingLocalValue}
            onChange={(e) => updateEncuentroDraft({ meetingLocalValue: e.target.value })}
            style={field}
          />
        </label>

        <label htmlFor="cita-checkin-interval" style={label}>
          Intervalo sugerido entre check-ins (minutos)
          <input
            id="cita-checkin-interval"
            type="number"
            min={1}
            max={120}
            value={encuentroDraft.checkInIntervalMinutes}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              updateEncuentroDraft({
                checkInIntervalMinutes: Number.isFinite(n) ? Math.min(120, Math.max(1, n)) : 15,
              });
            }}
            style={field}
          />
        </label>

        <div
          role="region"
          aria-labelledby="cita-checkin-live-label"
          aria-live="polite"
          tabIndex={0}
          style={liveRegion}
        >
          <div id="cita-checkin-live-label" style={{ fontWeight: 700, marginBottom: 6 }}>
            Estado del temporizador local
          </div>
          <p style={{ margin: 0, lineHeight: 1.45 }}>{liveStatus}</p>
        </div>
      </section>
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
const liveRegion: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'rgba(255,255,255,0.55)',
  outline: 'none',
};
