import { Link } from 'react-router-dom';

export function ModoCita() {
  return (
    <div>
      <header className="m3-tbar">
        <Link to="/" className="ibtn" aria-label="Volver al inicio">
          <span className="mi material-symbols-rounded" aria-hidden>
            arrow_back
          </span>
        </Link>
        <h1 className="m3-tbar-title" style={{ margin: 0 }}>
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
        alguien. La capa viva (API, alertas) va en un ticket de ingeniería; esta pantalla sirve para validar jerarquía y
        copy con producto.
      </p>
      <p className="m3-muted" style={{ marginTop: 12 }}>
        Siguiente paso técnico: persistir borrador local, temporizadores de check-in y los campos del HTML de referencia
        (nombre, lugar, keyword, foto).
      </p>
    </div>
  );
}
