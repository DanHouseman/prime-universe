/**
 * Enumerates integer lattice points on expanding cubic shells.
 * Shell r contains every point where max(|x|, |y|, |z|) === r.
 * The deterministic face-snake order assigns each positive integer exactly once.
 */
export function generateCubicShellCoordinates(limit) {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError("limit must be a positive safe integer");
  }

  const coordinates = new Int32Array(limit * 3);
  let index = 0;

  const push = (x, y, z) => {
    if (index >= limit) return false;
    const offset = index * 3;
    coordinates[offset] = x;
    coordinates[offset + 1] = y;
    coordinates[offset + 2] = z;
    index++;
    return index < limit;
  };

  push(0, 0, 0); // n = 1

  for (let r = 1; index < limit; r++) {
    const min = -r;
    const max = r;

    // Bottom and top faces. Snake rows to keep local continuity.
    for (const y of [min, max]) {
      for (let z = min; z <= max && index < limit; z++) {
        if ((z - min) % 2 === 0) {
          for (let x = min; x <= max && index < limit; x++) push(x, y, z);
        } else {
          for (let x = max; x >= min && index < limit; x--) push(x, y, z);
        }
      }
    }

    // Front and back faces, excluding rows already used by top/bottom.
    for (const z of [min, max]) {
      for (let y = min + 1; y <= max - 1 && index < limit; y++) {
        if ((y - min) % 2 === 0) {
          for (let x = min; x <= max && index < limit; x++) push(x, y, z);
        } else {
          for (let x = max; x >= min && index < limit; x--) push(x, y, z);
        }
      }
    }

    // Left and right faces, excluding all previously used edges.
    for (const x of [min, max]) {
      for (let y = min + 1; y <= max - 1 && index < limit; y++) {
        if ((y - min) % 2 === 0) {
          for (let z = min + 1; z <= max - 1 && index < limit; z++) push(x, y, z);
        } else {
          for (let z = max - 1; z >= min + 1 && index < limit; z--) push(x, y, z);
        }
      }
    }
  }

  return coordinates;
}

/** Computes τ(n), the number of positive divisors of n, for 1..limit. */
export function divisorCounts(limit) {
  const counts = new Uint16Array(limit + 1);
  for (let divisor = 1; divisor <= limit; divisor++) {
    for (let multiple = divisor; multiple <= limit; multiple += divisor) {
      counts[multiple]++;
    }
  }
  return counts;
}

/**
 * Builds axis-aligned prime-pair segments.
 * Groups share the two coordinates orthogonal to the selected axis.
 */
export function buildPrimeAlignmentSegments({
  primeNumbers,
  coordinates,
  spacing = 1,
  mode = "adjacent",
  axes = { x: true, y: true, z: true }
}) {
  const positions = [];

  const coordinateOf = (n) => {
    const offset = (n - 1) * 3;
    return [
      coordinates[offset],
      coordinates[offset + 1],
      coordinates[offset + 2]
    ];
  };

  const emitAxis = (axis) => {
    const varying = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    const fixedA = (varying + 1) % 3;
    const fixedB = (varying + 2) % 3;
    const groups = new Map();

    for (const n of primeNumbers) {
      const point = coordinateOf(n);
      const key = `${point[fixedA]},${point[fixedB]}`;
      let group = groups.get(key);
      if (!group) groups.set(key, (group = []));
      group.push(point);
    }

    for (const group of groups.values()) {
      if (group.length < 2) continue;
      group.sort((a, b) => a[varying] - b[varying]);

      if (mode === "all") {
        for (let i = 0; i < group.length - 1; i++) {
          for (let j = i + 1; j < group.length; j++) {
            addSegment(group[i], group[j]);
          }
        }
      } else {
        for (let i = 0; i < group.length - 1; i++) {
          addSegment(group[i], group[i + 1]);
        }
      }
    }
  };

  const addSegment = (a, b) => {
    positions.push(
      a[0] * spacing, a[1] * spacing, a[2] * spacing,
      b[0] * spacing, b[1] * spacing, b[2] * spacing
    );
  };

  if (axes.x) emitAxis("x");
  if (axes.y) emitAxis("y");
  if (axes.z) emitAxis("z");

  return new Float32Array(positions);
}
