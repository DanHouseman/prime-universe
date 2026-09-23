# Prime Universe 3D v2.1.0

Explore prime numbers, divisibility, and arithmetic patterns as an interactive
3D landscape. Each sphere represents an integer from 1 to **Maximum N**. Its
position comes from the selected layout, while its size and color can encode
different properties of that integer.

Prime Universe runs in your browser using Three.js and
`@danhouseman/prime-engine`. Use it to compare number patterns across layouts,
inspect individual values, illustrate number-theory concepts, and export data
for further analysis.

## What you can explore

| Exploration | Controls and possibilities |
| --- | --- |
| Prime distribution | Hide composites to isolate primes and the number 1. Compare expanding cubic shells with the classic 2D Ulam spiral, a helix, a spherical distribution, or a space-filling cube. |
| Divisor families | Color by **Divisor families τ(n)** to group integers by their number of positive divisors. Use the legend checkboxes to hide families and the color squares to customize composite-family colors. Primes and 1 stay white in this mode. |
| Arithmetic structure | Color by prime powers, deficient/perfect/abundant classification, Möbius μ(n), Liouville λ(n), Euler's totient φ(n), or smallest/largest prime factor. |
| Prime relationships | Explore gaps between consecutive primes and membership in twin, cousin, sexy-prime, and Cunningham-chain categories. |
| Modular and binary patterns | Change **Modulus m** in residue or quadratic-residue mode. Compare these patterns with binary popcount and Gray-code coloring. |
| Coordinate-based patterns | Explore Gaussian-prime classification on rounded x/z coordinates, an Eisenstein-prime norm proxy, and a local shell-density estimate. |
| Number size | Map sphere radius to divisor count, binary popcount, totient, integer value, or a fixed size. Enlarge highly composite numbers, which set new records for divisor count. |

**Morph from cubic** blends cubic-shell positions with the selected layout:
0 uses cubic coordinates and 1 uses the target layout. Set the blend and click
**Rebuild**. The space-filling cube uses Morton/Z-order coordinates.

## Navigate and inspect

- Drag to orbit, scroll to zoom, and right-drag to pan. **Reset camera** fits the current universe into view.
- Hover over a sphere to see its integer, prime/composite/unit classification, prime factorization, coordinates, and arithmetic values: τ (divisor count), σ (divisor sum), φ (totient), μ (Möbius), λ (Liouville), and Ω (prime-factor count with multiplicity).
- Use **Clip X**, **Clip Y**, and **Clip Z** to cut away geometry and inspect the interior. Adjust **Density fog** to reduce distant clutter.
- Choose a palette, adjust luminance, switch light/dark theme, or collapse the control panel. Hover or focus controls to read their help text.
- Custom divisor-family colors, theme, and panel collapse state persist in this browser. **Reset custom colors** clears the saved color overrides.

Changing **Maximum N**, **Morph from cubic**, or **Spacing** requires
**Rebuild**. Use **Rebuild** after setting **Sphere scale** as well. Layout and
graph selections rebuild automatically; color and visibility controls update
the spheres directly. Rebuilding resets the camera and visible progression.

## Draw connections

Enable overlays under **Connections and graphs** to compare spatial patterns
with arithmetic relationships. Start with one overlay at a time.

| Overlay | What it draws |
| --- | --- |
| Prime axis alignments | Connects primes sharing two coordinates along selected X, Y, or Z axes. Choose adjacent pairs, all pairs, or extended, finite rays. |
| Composite → distinct prime factors | Links integers to their distinct prime factors, with source integers limited to the first 5,000 values. |
| Divisibility lattice | Samples links from n to 2n, 3n, and 4n, with source integers limited to 1,800 and destinations within Maximum N. |
| Collatz edges | Links n to n/2 when even or 3n+1 when odd, for source integers up to 5,000 and destinations within range. |
| Cunningham-chain edges | Links primes p and 2p+1 when both are within range. |
| Goldbach decompositions | Draws one prime-pair connection for each even integer up to min(Maximum N, 1,000). |

Graph overlays remain drawn when spheres are hidden by composite filters,
divisor-family filters, or visible progression. Clipping planes affect both
spheres and lines.

## Animate and export

Move **Visible progression** to a smaller value, then press **Play** to reveal
integers up to Maximum N. **Animation speed** controls the reveal rate;
**Pause** stops it. **Auto rotate** moves the camera, and **Force-universe
pulse** animates sphere radii.

- **Screenshot** downloads the rendered scene as `prime-universe.png`, without the HTML control panel or hover tooltip.
- **Export CSV** downloads `prime-universe.csv` with every integer in the built universe, including hidden ones. Columns are `n,x,y,z,prime,tau,sigma,phi,mobius,liouville,spf,lpf`. Coordinates include the selected layout and morph, before the display spacing multiplier.

## Try these explorations

1. **Compare prime arrangements.** Disable prime axis lines, hide composites, and compare **Cubic shells** with **Classic Ulam plane**. Leave morph at 1 to see each target layout fully.
2. **Isolate divisor families.** Show composites, select **Divisor families τ(n)**, and leave only a few families checked. Hover over spheres to compare their factorizations, then assign custom colors to the composite families.
3. **Explore modular patterns.** Select **Residue class n mod m** and compare moduli such as 3, 6, and 7. Switch to **Quadratic residues mod m** to see how the classification changes.
4. **Follow arithmetic links.** Use a modest Maximum N, click **Rebuild**, and enable factor, Collatz, or Cunningham edges individually. Export the CSV to inspect the underlying values separately.

## Interpreting the view

The visualization supports exploration; a visible alignment is not a proof of
a general mathematical relationship. Positions depend on the chosen layout,
and finite palettes reuse colors. Totient and Gray-code coloring also reduce
values to repeating color keys, so matching colors need not mean equal values.

The Eisenstein mode is a norm-based proxy. Coordinate modes round the current
x/z coordinates and use primality lookups limited to Maximum N; values beyond
that lookup range are not recognized as prime. Shell density samples nearby
integer values at the same coordinate radius, rather than measuring the whole
shell. Prime-constellation coloring shows one category per prime, with twin,
cousin, sexy, then Cunningham precedence when categories overlap.

Maximum N supports 8 to 250,000 integers and starts at 12,000. Higher counts,
**All pairs** connections, and animated radius updates increase rendering
work. If interaction slows down, reduce Maximum N, turn off graph overlays or
pulse animation, and rebuild.

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

cd ../prime-universe
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
The pinned upstream lockfile contains internal registry URLs. CI rewrites those
tarball URLs to `registry.npmjs.org` before installation, preserving the locked
versions and integrity hashes.

Commit `package-lock.json` along with the app source and workflow so CI can
install the locked dependencies.
