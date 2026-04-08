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
        El HTML de referencia incluye tarjeta estilo Uber, estado de viaje, fotos de placa/conductor y alertas por
        desvío. Aquí solo el shell de navegación; captura de fotos y verificación en backend van en otro ticket.
      </p>
    </div>
  );
}
