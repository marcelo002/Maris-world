# Mari's World

A cartoon point-and-click learning game for Mari (ages 2-3), in English and Portuguese, made for the iPad.

Play it at the GitHub Pages address for this repository. On the iPad, open it in Safari, then choose Share and Add to Home Screen to get a full-screen app that works offline.

- `index.html`, `manifest.webmanifest`, `sw.js`, icons: the built game that GitHub Pages serves.
- `source/`: the editable source. `source/src/data.js` holds every word, person and place.
- `voice-scripts/`: recording scripts for each family member.

To rebuild after editing the source: `cd source && node build.js && node scripts.js`, then copy `dist/web/*` to the repository root.
