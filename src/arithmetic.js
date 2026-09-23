export function buildArithmetic(limit, isPrime) {
  const tau = new Uint16Array(limit + 1);
  const sigma = new Float64Array(limit + 1);
  const phi = new Uint32Array(limit + 1);
  const spf = new Uint32Array(limit + 1);
  const lpf = new Uint32Array(limit + 1);
  const mobius = new Int8Array(limit + 1);
  const liouville = new Int8Array(limit + 1);
  const omega = new Uint8Array(limit + 1);
  const bigOmega = new Uint8Array(limit + 1);
  const squarefree = new Uint8Array(limit + 1);
  const primePower = new Uint8Array(limit + 1);
  const highlyComposite = new Uint8Array(limit + 1);
  const abundantClass = new Int8Array(limit + 1); // -1 deficient, 0 perfect, 1 abundant
  const popcount = new Uint8Array(limit + 1);
  const gray = new Uint32Array(limit + 1);
  const primeGap = new Uint32Array(limit + 1);
  const twin = new Uint8Array(limit + 1);
  const cousin = new Uint8Array(limit + 1);
  const sexy = new Uint8Array(limit + 1);
  const cunningham = new Uint8Array(limit + 1);

  phi[1] = 1;
  mobius[1] = 1;
  liouville[1] = 1;
  squarefree[1] = 1;

  for (let d = 1; d <= limit; d++) {
    for (let m = d; m <= limit; m += d) {
      tau[m]++;
      sigma[m] += d;
    }
  }

  const primes = [];
  for (let n = 2; n <= limit; n++) {
    if (isPrime(n)) {
      primes.push(n);
      spf[n] = n;
      lpf[n] = n;
      phi[n] = n - 1;
    }
  }

  for (const p of primes) {
    for (let m = p; m <= limit; m += p) {
      if (!spf[m]) spf[m] = p;
      lpf[m] = p;
    }
  }

  let recordTau = 0;
  for (let n = 1; n <= limit; n++) {
    popcount[n] = popcount32(n);
    gray[n] = (n ^ (n >>> 1)) >>> 0;
    abundantClass[n] = sigma[n] - n === n ? 0 : sigma[n] - n > n ? 1 : -1;
    if (tau[n] > recordTau) {
      recordTau = tau[n];
      highlyComposite[n] = 1;
    }

    if (n === 1) continue;
    let x = n;
    let distinct = 0;
    let total = 0;
    let square = false;
    let onlyOnePrime = true;
    let firstPrime = 0;
    let totient = n;
    while (x > 1) {
      const p = spf[x] || x;
      if (!firstPrime) firstPrime = p;
      else if (p !== firstPrime) onlyOnePrime = false;
      let exponent = 0;
      while (x % p === 0) {
        x /= p;
        exponent++;
        total++;
      }
      distinct++;
      if (exponent > 1) square = true;
      totient -= Math.floor(totient / p);
    }
    phi[n] = totient;
    omega[n] = distinct;
    bigOmega[n] = total;
    mobius[n] = square ? 0 : (distinct & 1 ? -1 : 1);
    liouville[n] = total & 1 ? -1 : 1;
    squarefree[n] = square ? 0 : 1;
    primePower[n] = onlyOnePrime ? 1 : 0;
  }

  let previous = 2;
  for (const p of primes) {
    primeGap[p] = p - previous;
    previous = p;
    if ((p > 2 && isPrime(p - 2)) || isPrime(p + 2)) twin[p] = 1;
    if ((p > 4 && isPrime(p - 4)) || isPrime(p + 4)) cousin[p] = 1;
    if ((p > 6 && isPrime(p - 6)) || isPrime(p + 6)) sexy[p] = 1;
    if (isPrime(2 * p + 1) || (p > 2 && (p - 1) % 2 === 0 && isPrime((p - 1) / 2))) cunningham[p] = 1;
  }

  return {
    tau, sigma, phi, spf, lpf, mobius, liouville, omega, bigOmega,
    squarefree, primePower, highlyComposite, abundantClass, popcount,
    gray, primeGap, twin, cousin, sexy, cunningham, primes
  };
}

export function factorList(n, spf) {
  const result = [];
  let x = n;
  while (x > 1) {
    const p = spf[x] || x;
    result.push(p);
    x /= p;
  }
  return result;
}

export function popcount32(value) {
  let v = value >>> 0;
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
