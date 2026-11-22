// TEMPORARY. Replaced in Phase 3 by real data from the local SQLite library.
const t = (id, title, artist, album, durationSec, hue, addedAt, lastPlayedAt = null, isFavorite = false) => ({
  id, title, artist, album, durationSec, hue, addedAt, lastPlayedAt, isFavorite,
})

export const mockTracks = [
  t('t01', 'Midnight Static',      'Nova Harbor',      'Glass Weather',      214, 265, '2026-11-21T20:10:00Z', '2026-11-22T09:00:00Z', true),
  t('t02', 'Paper Lanterns',       'Mira Okonkwo',     'Small Hours',        187, 330, '2026-11-20T18:30:00Z', '2026-11-21T22:15:00Z'),
  t('t03', 'Low Tide Hymn',        'The Quiet Engines','Salt & Signal',      243, 200, '2026-11-18T11:05:00Z'),
  t('t04', 'Velvet Algorithm',     'Nova Harbor',      'Glass Weather',      201, 265, '2026-11-21T20:10:00Z', '2026-11-20T08:40:00Z', true),
  t('t05', 'Amber Streets',        'Juno Vale',        'City of Slow Light', 256,  30, '2026-10-30T14:00:00Z', '2026-11-19T17:20:00Z'),
  t('t06', 'Static Bloom',         'Kasper Lind',      'Overgrowth',         178, 140, '2026-10-12T09:45:00Z'),
  t('t07', 'Northern Lines',       'The Quiet Engines','Salt & Signal',      232, 200, '2026-11-18T11:05:00Z', '2026-11-18T19:00:00Z', true),
  t('t08', 'Honey & Gasoline',     'Juno Vale',        'City of Slow Light', 209,  30, '2026-10-30T14:00:00Z', null, true),
  t('t09', 'Orbit of Small Things','Mira Okonkwo',     'Small Hours',        295, 330, '2026-11-20T18:30:00Z'),
  t('t10', 'Echo Garden',          'Kasper Lind',      'Overgrowth',         224, 140, '2026-10-12T09:45:00Z', '2026-11-15T12:30:00Z'),
  t('t11', 'Satellite Summer',     'Delphine Rae',     'Polaroid Season',    192, 355, '2026-09-02T16:20:00Z'),
  t('t12', 'Fading Neon',          'Delphine Rae',     'Polaroid Season',    217, 355, '2026-09-02T16:20:00Z', '2026-11-10T21:00:00Z', true),
  t('t13', 'Cathedral of Rain',    'Mira Okonkwo',     'Small Hours',        268, 330, '2026-11-20T18:30:00Z'),
  t('t14', 'Glasshouse',           'Nova Harbor',      'Glass Weather',      183, 265, '2026-11-21T20:10:00Z'),
]

export const mockPlaylists = [
  { id: 'p1', name: 'Late Night Drive', trackIds: ['t01', 't05', 't08'],        createdAt: '2026-11-19T22:00:00Z', hue: 265 },
  { id: 'p2', name: 'Focus',            trackIds: ['t03', 't07', 't10', 't13'], createdAt: '2026-11-02T10:00:00Z', hue: 200 },
  { id: 'p3', name: 'Sunday Slow',      trackIds: ['t02', 't11', 't12'],        createdAt: '2026-10-25T09:00:00Z', hue: 30 },
]
