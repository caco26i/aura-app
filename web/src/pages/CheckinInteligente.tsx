import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

const TRIGGERS = [
  {
    id: 'late',
    label: 'Voy un poco tarde',
    detail: 'Avisar retraso corto sin dramatizar la situación.',
  },
  {
    id: 'arrived',
    label: 'Ya llegué',
    detail: 'Confirmar llegada a punto seguro.',
  },
  {
    id: 'change_place',
    label: 'Cambio de punto de encuentro',
    detail: 'Coordinar nuevo lugar con calma.',
  },
  {
    id: 'need_space',
    label: 'Necesito pausa / espacio',
    detail: 'Pedir tiempo sin culpas.',
  },
  {
    id: 'check_ok',
    label: 'Todo bien por aquí',
    detail: 'Check-in positivo periódico.',
  },
  {
    id: 'uneasy',
    label: 'Me siento incómoda',
    detail: 'Señal suave; combina con persona de confianza o SOS si escala.',
  },
] as const;

const QUICK_REPLIES: Record<string, readonly string[]> = {
  late: ['Llego en 10', 'Salí tarde, aviso al llegar', '¿Podemos mover 15 min?'],
  arrived: ['Ya estoy en la entrada', 'Te veo en la mesa', 'Llegué, todo bien'],
  change_place: ['¿Te parece la esquina iluminada?', 'Propongo otro café cercano', 'Me muevo al punto acordado'],
  need_space: ['Necesito 20 min sola', 'Hablemos en un rato', 'Prefiero pausa'],
  check_ok: ['Todo tranquilo', 'Sigo bien', 'Sin novedad'],
  uneasy: ['Prefiero irme', '¿Podemos hablar con calma?', 'Quiero que alguien más sepa dónde estoy'],
};

type HistoryItem = { id: string; at: number; trigger: string; reply: string };

export function CheckinInteligente() {
  const [selectedId, setSelectedId] = useState<(typeof TRIGGERS)[number]['id'] | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(
    () => (selectedId ? TRIGGERS.find((t) => t.id === selectedId) ?? null : null),
    [selectedId],
  );

  const statusMessage = useMemo(() => {
    if (!selected) {
      return 'Elige un disparador para ver respuestas rápidas de demostración. Nada se envía por SMS ni push en esta compilación.';
    }
    const last = history.find((h) => h.trigger === selected.label);
    if (last) {
      return `Última respuesta registrada en historial local: «${last.reply}» para «${last.trigger}».`;
    }
    return `Disparador activo: ${selected.label}. Toca una respuesta rápida para añadirla al historial de demostración.`;
  }, [selected, history]);

  const pickReply = (reply: string) => {
    if (!selected) return;
    const triggerLabel = selected.label;
    setHistory((prev) => {
      const now = Date.now();
      const item: HistoryItem = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        at: now,
        trigger: triggerLabel,
        reply,
      };
      return [item, ...prev].slice(0, 12);
    });
  };

  const replies = selectedId ? QUICK_REPLIES[selectedId] ?? [] : [];

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
          <div className="mb-title">Check-in IA</div>
          <div className="mb-sub">Disparadores · Respuestas rápidas · Historial</div>
        </div>
      </div>

      <p className="m3-muted">
        Wireframe local: los disparadores y respuestas son plantillas; la priorización con push/SMS queda para cuando exista contrato de API. Copy calmado y siguiente paso, sin culpar al usuario.
      </p>

      <div
        id="checkin-ia-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby="checkin-ia-status-heading"
        style={statusLine}
      >
        <div id="checkin-ia-status-heading" style={{ fontWeight: 700, marginBottom: 6 }}>
          Estado del check-in IA
        </div>
        <p style={{ margin: 0, lineHeight: 1.45 }}>{statusMessage}</p>
      </div>

      <section aria-labelledby="checkin-triggers-heading" style={section}>
        <h2 id="checkin-triggers-heading" style={h2}>
          Disparadores
        </h2>
        <ul style={triggerList}>
          {TRIGGERS.map((t) => {
            const isSel = t.id === selectedId;
            return (
              <li key={t.id} style={triggerLi}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-pressed={isSel}
                  style={{
                    ...triggerBtn,
                    borderColor: isSel ? 'var(--aura-status-ok, #3d9a6a)' : 'var(--aura-border)',
                    background: isSel ? 'rgba(61, 154, 106, 0.12)' : 'var(--aura-card)',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{t.label}</span>
                  <span className="m3-muted" style={{ display: 'block', fontSize: 13, marginTop: 4, textAlign: 'left' }}>
                    {t.detail}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="checkin-quick-heading" style={section}>
        <h2 id="checkin-quick-heading" style={h2}>
          Respuestas rápidas
        </h2>
        {!selected ? (
          <p className="m3-muted" style={{ marginTop: 0 }}>
            Selecciona un disparador para ver sugerencias tappeables.
          </p>
        ) : (
          <div style={chipRow}>
            {replies.map((r) => (
              <button key={r} type="button" className="ibtn" onClick={() => pickReply(r)} style={chipBtn}>
                {r}
              </button>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="checkin-history-heading" style={section}>
        <h2 id="checkin-history-heading" style={h2}>
          Historial de demostración
        </h2>
        {history.length === 0 ? (
          <p className="m3-muted" role="status" style={{ marginTop: 0 }}>
            Aún no hay entradas. Las respuestas rápidas que pulses aparecerán aquí solo en este dispositivo.
          </p>
        ) : (
          <ol style={historyList}>
            {history.map((h) => (
              <li key={h.id} style={historyLi}>
                <div style={{ fontWeight: 600 }}>{h.trigger}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{h.reply}</div>
                <div className="m3-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {new Date(h.at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

const section: CSSProperties = { marginTop: 20 };
const h2: CSSProperties = { fontSize: 18, marginBottom: 12 };
const statusLine: CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  border: '1px solid var(--aura-border)',
  background: 'rgba(255,255,255,0.55)',
  lineHeight: 1.45,
};
const triggerList: CSSProperties = { listStyle: 'none', padding: 0, margin: 0 };
const triggerLi: CSSProperties = { marginBottom: 10 };
const triggerBtn: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid var(--aura-border)',
  cursor: 'pointer',
  font: 'inherit',
};
const chipRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chipBtn: CSSProperties = { fontWeight: 600, borderRadius: 999, padding: '8px 14px' };
const historyList: CSSProperties = { paddingLeft: 20, margin: '8px 0 0' };
const historyLi: CSSProperties = { marginBottom: 14 };
