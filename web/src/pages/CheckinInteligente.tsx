import { Link } from 'react-router-dom';

export function CheckinInteligente() {
  return (
    <div>
      <header className="m3-tbar">
        <Link to="/" className="ibtn" aria-label="Back to home">
          <span className="mi material-symbols-rounded">arrow_back</span>
        </Link>
        <h1 className="m3-tbar-title" style={{ margin: 0 }}>
          Check-in IA
        </h1>
        <span className="feat-badge">
          <span className="mi material-symbols-rounded s18">auto_awesome</span> Nuevo
        </span>
      </header>

      <div className="mode-banner">
        <div className="mb-ic">
          <span className="mi material-symbols-rounded s28">check_circle</span>
        </div>
        <div>
          <div className="mb-title">Check-in inteligente</div>
          <div className="mb-sub">Disparadores · Respuestas rápidas · Historial</div>
        </div>
      </div>

      <p className="m3-muted">
        The reference lists six automatic triggers, quick-reply chips, and history. This route mirrors the prototype
        entry point; product and eng should prioritize which triggers ship first and how they interact with push/SMS when
        available.
      </p>
    </div>
  );
}
