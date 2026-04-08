import { useMemo, useEffect, useRef, useState } from 'react';
import { AuraMap } from '../components/AuraMap';
import { useAura } from '../context/useAura';
import { MAP_INTEL_SEED } from '../data/mapIntelSeed';

export function MapPage() {
  const { mapLayers, setMapLayer } = useAura();
  const [demoRouteMsg, setDemoRouteMsg] = useState<string | null>(null);
  const demoMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (demoMsgTimer.current) clearTimeout(demoMsgTimer.current);
    };
  }, []);

  const visible = useMemo(
    () =>
      MAP_INTEL_SEED.filter((f) => {
        if (f.kind === 'risk') return mapLayers.risk;
        if (f.kind === 'safe') return mapLayers.safePoints;
        return mapLayers.activity;
      }),
    [mapLayers],
  );

  const toggleRow = (idPrefix: string, label: string, key: keyof typeof mapLayers, description: string) => (
    <div
      key={key}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid var(--aura-border)',
        background: 'var(--aura-card)',
        marginBottom: 10,
      }}
    >
      <div>
        <div id={`${idPrefix}-label`} style={{ fontWeight: 700 }}>
          {label}
        </div>
        <div id={`${idPrefix}-desc`} style={{ fontSize: 13, color: 'var(--aura-muted)' }}>
          {description}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={mapLayers[key]}
        aria-pressed={mapLayers[key]}
        aria-label={`${label}: ${mapLayers[key] ? 'on' : 'off'}`}
        aria-describedby={`${idPrefix}-desc`}
        onClick={() => setMapLayer(key, !mapLayers[key])}
        style={{
          width: 52,
          height: 30,
          borderRadius: 999,
          border: 'none',
          background: mapLayers[key] ? '#3d9a6a' : '#d7d2e6',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: mapLayers[key] ? 26 : 4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s ease',
          }}
        />
      </button>
    </div>
  );

  return (
    <div>
      <h1 id="map-intel-heading" style={{ marginTop: 0 }}>
        Map intel
      </h1>
      <p id="map-intel-lede" style={{ color: 'var(--aura-muted)' }}>
        Layers and POIs persist across reloads (local device).
      </p>

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            setDemoRouteMsg('Demo only — live routing is not connected in this build.');
            if (demoMsgTimer.current) clearTimeout(demoMsgTimer.current);
            demoMsgTimer.current = setTimeout(() => setDemoRouteMsg(null), 5000);
          }}
          aria-label="Find safest route — demo only; shows a placeholder message and does not compute a real route"
          style={{
            padding: '12px 18px',
            borderRadius: 14,
            border: 'none',
            background: 'var(--aura-status-ok)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 320,
          }}
        >
          Find safest route (demo)
        </button>
        {demoRouteMsg ? (
          <p
            id="map-demo-route-status"
            role="status"
            aria-live="polite"
            style={{ marginTop: 10, fontSize: 14, color: 'var(--aura-muted)' }}
          >
            {demoRouteMsg}
          </p>
        ) : null}
      </div>

      <section aria-labelledby="map-intel-heading" aria-describedby="map-intel-lede">
        {toggleRow('map-layer-risk', 'Risk signals', 'risk', 'Areas to stay aware near')}
        {toggleRow('map-layer-safe', 'Safe points', 'safePoints', 'Lit checkpoints and safer zones')}
        {toggleRow('map-layer-activity', 'Activity', 'activity', 'Events and crowd context')}

        <AuraMap features={visible} height={340} />

        {visible.length === 0 ? (
          <p role="status" style={{ marginTop: 12, color: 'var(--aura-muted)' }}>
            All layers are off — enable at least one to see curated POIs.
          </p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {visible.map((f) => (
              <li key={f.id} style={{ marginBottom: 8 }}>
                <strong>{f.title}</strong>
                <div style={{ fontSize: 13, color: 'var(--aura-muted)' }}>{f.description}</div>
                {f.curatedNote ? (
                  <div style={{ fontSize: 12, color: 'var(--aura-muted)' }}>{f.curatedNote}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
