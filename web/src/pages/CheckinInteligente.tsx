import { Link } from 'react-router-dom';

export function CheckinInteligente() {
  return (
    <div>
      <header className="m3-tbar">
        <Link to="/" className="ibtn" aria-label="Volver al inicio">
          <span className="mi material-symbols-rounded" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 className="m3-tbar-title" style={{ margin: 0 }}>
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
        El prototipo lista seis disparadores, respuestas rápidas e historial. Esta ruta copia el punto de entrada; producto
        e ingeniería priorizan qué disparadores van primero y cómo se integran con push/SMS cuando existan.
      </p>
    </div>
  );
}
