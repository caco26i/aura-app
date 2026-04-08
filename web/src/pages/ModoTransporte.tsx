import { Link } from 'react-router-dom';

export function ModoTransporte() {
  return (
    <div>
      <header className="m3-tbar">
        <Link to="/" className="ibtn" aria-label="Back to home">
          <span className="mi material-symbols-rounded">arrow_back</span>
        </Link>
        <h1 className="m3-tbar-title" style={{ margin: 0 }}>
          Modo Transporte
        </h1>
        <span className="feat-badge">
          <span className="mi material-symbols-rounded s18">auto_awesome</span> Nuevo
        </span>
      </header>

      <div className="mode-banner">
        <div className="mb-ic">
          <span className="mi material-symbols-rounded s28">directions_car</span>
        </div>
        <div>
          <div className="mb-title">Viajes y rides</div>
          <div className="mb-sub">Placa · Conductor · Desvío · &quot;No soy yo&quot;</div>
        </div>
      </div>

      <p className="m3-muted">
        Prototype sections cover Uber-style connect card, trip state, plate/face capture tiles, and deviation alerts.
        This screen is a UX shell so navigation and hierarchy match the attachment; implement photo capture and backend
        verification in a dedicated engineering ticket.
      </p>
    </div>
  );
}
