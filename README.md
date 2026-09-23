# Prime Universe 3D v2.1.0

Standalone Three.js visualization laboratory using `@danhouseman/prime-engine`.

## New in v2.1.0

- Entire control panel can collapse to a compact arrow button.
- Every panel control has a hover/focus tooltip explaining its purpose.
- Color modes include a persistent explanation of what the colors encode.
- Palette selector: Golden angle, Tableau, Viridis, Turbo, Spectral, Pastel, Neon, Monochrome, and Custom.
- In **Divisor families τ(n)** mode, click any color square to edit that divisor family's color.
- Custom colors are stored in browser local storage and survive reloads.
- Each τ(n) family can still be shown or hidden independently.
- Reset button clears all custom color overrides.
- Light/dark theme and collapsed-panel state persist across reloads.

## Run

Place this folder beside `prime-engine-ecosystem-v0.10.0`, then:

```bash
cd prime-engine-ecosystem-v0.10.0
npm install
npm run build:core

cd ../prime-universe-3d-v2.1.0
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Continuous integration

`.github/workflows/ci.yml` builds on every push and pull request, and can also
be run manually from GitHub Actions. It uses Node.js 24, installs dependencies
with `npm ci`, builds Prime Engine first, then runs the Vite production build.
Successful runs retain `dist/` as the `prime-universe-dist` artifact for 14 days.

CI checks out `danhouseman/prime-engine` at commit
`54a9a5526197c3b5f20117f25557b51eb0d86001` beside the app to satisfy the local
`file:` dependency. Update that workflow ref when upgrading Prime Engine.
Commit `package-lock.json` along with the app source and workflow so CI can
install the locked dependencies.
