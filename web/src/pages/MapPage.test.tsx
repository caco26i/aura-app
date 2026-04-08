import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { MapLayers } from '../types';
import { MapPage } from './MapPage';

const { mapLayersRef, setMapLayerMock } = vi.hoisted(() => {
  const mapLayersRef: { current: MapLayers } = {
    current: { risk: true, safePoints: false, activity: true },
  };
  const setMapLayerMock = vi.fn((key: keyof MapLayers, value: boolean) => {
    mapLayersRef.current = { ...mapLayersRef.current, [key]: value };
  });
  return { mapLayersRef, setMapLayerMock };
});

vi.mock('../components/AuraMap', () => ({
  AuraMap: () => <div data-testid="aura-map-stub" />,
}));

vi.mock('../context/useAura', () => ({
  useAura: () => ({
    get mapLayers() {
      return mapLayersRef.current;
    },
    setMapLayer: setMapLayerMock,
  }),
}));

function expectSwitchA11y(label: string, on: boolean) {
  const sw = screen.getByRole('switch', { name: new RegExp(`^${label}:`) });
  const checked = String(on);
  expect(sw.getAttribute('aria-checked')).toBe(checked);
  expect(sw.getAttribute('aria-pressed')).toBe(checked);
  expect(sw.getAttribute('aria-label')).toBe(`${label}: ${on ? 'on' : 'off'}`);
  const descId = sw.getAttribute('aria-describedby');
  expect(descId).toBeTruthy();
  const desc = document.getElementById(descId!);
  expect(desc).not.toBeNull();
}

describe('MapPage layer switches', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mapLayersRef.current = { risk: true, safePoints: false, activity: true };
    setMapLayerMock.mockClear();
  });

  it('reflects mocked mapLayers in aria-checked, aria-pressed, and aria-label', () => {
    render(<MapPage />);

    expectSwitchA11y('Risk signals', true);
    expectSwitchA11y('Safe points', false);
    expectSwitchA11y('Activity', true);
  });

  it('calls setMapLayer with the toggled key when a layer switch is clicked', () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole('switch', { name: /^Risk signals:/ }));
    expect(setMapLayerMock).toHaveBeenCalledWith('risk', false);

    fireEvent.click(screen.getByRole('switch', { name: /^Safe points:/ }));
    expect(setMapLayerMock).toHaveBeenCalledWith('safePoints', true);

    fireEvent.click(screen.getByRole('switch', { name: /^Activity:/ }));
    expect(setMapLayerMock).toHaveBeenCalledWith('activity', false);
  });

  it('links each switch to its description via aria-describedby', () => {
    render(<MapPage />);

    const risk = screen.getByRole('switch', { name: /^Risk signals:/ });
    expect(risk.getAttribute('aria-describedby')).toBe('map-layer-risk-desc');

    const safe = screen.getByRole('switch', { name: /^Safe points:/ });
    expect(safe.getAttribute('aria-describedby')).toBe('map-layer-safe-desc');

    const activity = screen.getByRole('switch', { name: /^Activity:/ });
    expect(activity.getAttribute('aria-describedby')).toBe('map-layer-activity-desc');
  });
});
