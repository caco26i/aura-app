export type MapIntelKind = 'risk' | 'safe' | 'activity';

export type MapIntelFeature = {
  id: string;
  kind: MapIntelKind;
  title: string;
  description: string;
  lat: number;
  lng: number;
  /** Curated / demo data marker for QA */
  curatedNote?: string;
};

export const MAP_INTEL_SEED: MapIntelFeature[] = [
  {
    id: 'intel-1',
    kind: 'risk',
    title: 'Higher foot traffic (evening)',
    description: 'Busy corridor; stay aware when solo.',
    lat: 40.758,
    lng: -73.9855,
    curatedNote: 'Curated demo POI',
  },
  {
    id: 'intel-2',
    kind: 'safe',
    title: 'Lit checkpoint',
    description: 'Well-lit area with regular patrol presence.',
    lat: 40.761,
    lng: -73.977,
    curatedNote: 'Curated demo POI',
  },
  {
    id: 'intel-3',
    kind: 'activity',
    title: 'Community event',
    description: 'Street fair this weekend — expect crowds.',
    lat: 40.7484,
    lng: -73.9857,
    curatedNote: 'Curated demo POI',
  },
];
