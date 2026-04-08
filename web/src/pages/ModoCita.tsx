import { Link } from 'react-router-dom';

export function ModoCita() {
  return (
    <div>
      <header className="m3-tbar">
        <Link to="/" className="ibtn" aria-label="Back to home">
          <span className="mi material-symbols-rounded">arrow_back</span>
        </Link>
        <h1 className="m3-tbar-title" style={{ margin: 0 }}>
          Modo Cita
        </h1>
        <span className="feat-badge">
          <span className="mi material-symbols-rounded s18">auto_awesome</span> Nuevo
        </span>
      </header>

      <div className="mode-banner">
        <div className="mb-ic">
          <span className="mi material-symbols-rounded s28">favorite</span>
        </div>
        <div>
          <div className="mb-title">Modo Cita / Encuentro</div>
          <div className="mb-sub">Citas · Reuniones · Transacciones · Desconocidos</div>
        </div>
      </div>

      <p className="m3-muted">
        This flow matches the M3 prototype: safety word, encounter details, and timed check-ins before you meet
        someone. Backend wiring and live alerts will ship in a follow-up; here you can validate layout and copy with
        stakeholders.
      </p>
      <p className="m3-muted" style={{ marginTop: 12 }}>
        Next engineering steps: persist encounter draft locally, hook check-in timers, and align with the form fields in
        the reference HTML (name, place, keyword, photo slot).
      </p>
    </div>
  );
}
