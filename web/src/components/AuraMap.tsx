import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapIntelFeature } from '../data/mapIntelSeed';
import { emitTelemetry } from '../observability/auraTelemetry';

/** Default center (NYC) — swap for user geolocation in production */
const DEFAULT_CENTER: [number, number] = [40.7549, -73.984];

function FixResize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const MAP_INTEL_COLOR_FALLBACK: Record<MapIntelFeature['kind'], string> = {
  risk: '#c24757',
  safe: '#3d9a6a',
  activity: '#5468c9',
};

function readMapIntelColors(): Record<MapIntelFeature['kind'], string> {
  if (typeof document === 'undefined') return MAP_INTEL_COLOR_FALLBACK;
  const root = getComputedStyle(document.documentElement);
  return {
    risk: root.getPropertyValue('--aura-status-alert').trim() || MAP_INTEL_COLOR_FALLBACK.risk,
    safe: root.getPropertyValue('--aura-status-ok').trim() || MAP_INTEL_COLOR_FALLBACK.safe,
    activity: root.getPropertyValue('--aura-map-activity').trim() || MAP_INTEL_COLOR_FALLBACK.activity,
  };
}

export type AuraMapProps = {
  features: MapIntelFeature[];
  height?: number;
  onDoubleTapHint?: () => void;
};

let lastTap = 0;

const TILE_LOAD_TIMEOUT_MS = 15_000;

export function AuraMap({ features, height = 280, onDoubleTapHint }: AuraMapProps) {
  const [tilesBusy, setTilesBusy] = useState(true);
  const [markerColors] = useState(readMapIntelColors);
  const fallbackClearTimerRef = useRef<number | null>(null);

  const clearFallbackTimer = () => {
    if (fallbackClearTimerRef.current !== null) {
      window.clearTimeout(fallbackClearTimerRef.current);
      fallbackClearTimerRef.current = null;
    }
  };

  useEffect(() => {
    fallbackClearTimerRef.current = window.setTimeout(() => {
      setTilesBusy(false);
      fallbackClearTimerRef.current = null;
    }, TILE_LOAD_TIMEOUT_MS);
    return () => clearFallbackTimer();
  }, []);

  const handlePointerUp = () => {
    const now = Date.now();
    if (now - lastTap < 350) {
      onDoubleTapHint?.();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  };

  return (
    <div>
      <div
        role="application"
        aria-label="Map"
        aria-busy={tilesBusy}
        onPointerUp={onDoubleTapHint ? handlePointerUp : undefined}
        style={{
          position: 'relative',
          height,
          borderRadius: 'var(--aura-radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--aura-border)',
        }}
      >
        {tilesBusy ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 400,
              background: 'var(--aura-card)',
              pointerEvents: 'none',
            }}
          />
        ) : null}
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <FixResize />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              loading: () => setTilesBusy(true),
              load: () => {
                clearFallbackTimer();
                setTilesBusy(false);
              },
              tileerror: (e) => {
                emitTelemetry({
                  category: 'map',
                  event: 'tile_error',
                  tileUrl: (e.tile as { src?: string } | undefined)?.src,
                });
              },
            }}
          />
          {features.map((f) => (
            <CircleMarker
              key={f.id}
              center={[f.lat, f.lng]}
              radius={10}
              pathOptions={{
                color: markerColors[f.kind],
                fillColor: markerColors[f.kind],
                fillOpacity: 0.55,
              }}
            >
              <Popup>
                <strong>{f.title}</strong>
                <div style={{ marginTop: 6 }}>{f.description}</div>
                {f.curatedNote ? (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{f.curatedNote}</div>
                ) : null}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      {tilesBusy ? (
        <p role="status" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--aura-muted)' }}>
          Loading map…
        </p>
      ) : null}
    </div>
  );
}

// Default marker icon fix for some bundlers (not always needed with CircleMarker)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
