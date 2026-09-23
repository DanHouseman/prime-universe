import { generateCubicShellCoordinates } from './cubic-ulam.js';

export function generateLayout(limit, mode) {
  if (mode === 'cubic') return generateCubicShellCoordinates(limit);
  const out = new Float32Array(limit * 3);
  switch (mode) {
    case 'helix':
      for (let n = 1; n <= limit; n++) {
        const t = n * 0.16;
        const r = Math.sqrt(n) * 0.055;
        set(out, n, Math.cos(t) * r, n * 0.0025, Math.sin(t) * r);
      }
      break;
    case 'sphere':
      for (let n = 1; n <= limit; n++) {
        const u = n / limit;
        const theta = n * Math.PI * (3 - Math.sqrt(5));
        const y = 1 - 2 * u;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const scale = Math.cbrt(n) * 0.35;
        set(out, n, Math.cos(theta) * r * scale, y * scale, Math.sin(theta) * r * scale);
      }
      break;
    case 'ulam2d': {
      let x = 0, z = 0, dx = 1, dz = 0, segment = 1, used = 0, turns = 0;
      for (let n = 1; n <= limit; n++) {
        set(out, n, x, 0, z);
        x += dx; z += dz; used++;
        if (used === segment) {
          used = 0;
          [dx, dz] = [-dz, dx];
          turns++;
          if ((turns & 1) === 0) segment++;
        }
      }
      break;
    }
    case 'hilbert':
      // A compact Morton/Z-order surrogate; visually similar space-filling behavior.
      for (let n = 1; n <= limit; n++) {
        const v = n - 1;
        set(out, n, compactBits(v), compactBits(v >>> 1), compactBits(v >>> 2));
      }
      center(out, limit);
      break;
    default:
      return generateCubicShellCoordinates(limit);
  }
  return out;
}

function set(out, n, x, y, z) {
  const i = (n - 1) * 3;
  out[i] = x; out[i + 1] = y; out[i + 2] = z;
}
function compactBits(value) {
  let x = value & 0x09249249;
  x = (x ^ (x >>> 2)) & 0x030c30c3;
  x = (x ^ (x >>> 4)) & 0x0300f00f;
  x = (x ^ (x >>> 8)) & 0xff0000ff;
  x = (x ^ (x >>> 16)) & 0x000003ff;
  return x;
}
function center(out, limit) {
  let sx=0,sy=0,sz=0;
  for(let i=0;i<limit;i++){sx+=out[i*3];sy+=out[i*3+1];sz+=out[i*3+2];}
  sx/=limit;sy/=limit;sz/=limit;
  for(let i=0;i<limit;i++){out[i*3]-=sx;out[i*3+1]-=sy;out[i*3+2]-=sz;}
}
