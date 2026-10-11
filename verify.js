// Verify the 2-qubit statevector sim gives E(a,b)=cos(a-b) for |Phi+>,
// and that CHSH hits 2.83 (quantum) vs 2.0 (classical script).

// complex numbers as [re, im]
const c = (re, im = 0) => [re, im];
const cmul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
const cadd = (x, y) => [x[0] + y[0], x[1] + y[1]];
const cabs2 = (x) => x[0] * x[0] + x[1] * x[1];

// Ry(theta) = [[cos t/2, -sin t/2],[sin t/2, cos t/2]]
function ry(theta) {
  const ct = Math.cos(theta / 2), st = Math.sin(theta / 2);
  return [[c(ct), c(-st)], [c(st), c(ct)]];
}

// apply single-qubit gate U to qubit q (0 = first/Alice, 1 = second/Bob)
// state order |00>,|01>,|10>,|11>, qubit A is the left bit
function applyGate(state, U, q) {
  const out = [c(0), c(0), c(0), c(0)];
  for (let i = 0; i < 4; i++) {
    const bit = q === 0 ? (i >> 1) & 1 : i & 1;
    for (let b = 0; b < 2; b++) {
      const j = q === 0 ? (b << 1) | (i & 1) : (i & 2) | b;
      out[i] = cadd(out[i], cmul(U[bit][b], state[j]));
    }
  }
  return out;
}

const s = Math.SQRT1_2;
const phiPlus = () => [c(s), c(0), c(0), c(s)];

// measure A along angle a, B along angle b (degrees): rotate by Ry(-a), Ry(-b), probs in Z basis
function probs(aDeg, bDeg) {
  const a = (aDeg * Math.PI) / 180, b = (bDeg * Math.PI) / 180;
  let st = phiPlus();
  st = applyGate(st, ry(-a), 0);
  st = applyGate(st, ry(-b), 1);
  return st.map(cabs2);
}

function exactE(aDeg, bDeg) {
  const p = probs(aDeg, bDeg);
  // outcome +1 for bit 0, -1 for bit 1; product = +1 for 00,11, -1 for 01,10
  return p[0] - p[1] - p[2] + p[3];
}

// check E = cos(a-b)
let maxErr = 0;
for (let a = 0; a <= 180; a += 15)
  for (let b = 0; b <= 180; b += 15) {
    const err = Math.abs(exactE(a, b) - Math.cos(((a - b) * Math.PI) / 180));
    maxErr = Math.max(maxErr, err);
  }
console.log('max |E - cos(a-b)| =', maxErr.toExponential(2));

// CHSH exact: a=0, a'=90, b=45, b'=135; S = E(a,b)+E(a',b)+E(a',b')-E(a,b')
const S = exactE(0, 45) + exactE(90, 45) + exactE(90, 135) - exactE(0, 135);
console.log('quantum S =', S.toFixed(4), '(expect 2.8284)');

// sampled CHSH
function sampleOutcome(aDeg, bDeg) {
  const p = probs(aDeg, bDeg);
  let r = Math.random(), i = 0;
  while (i < 3 && r > p[i]) { r -= p[i]; i++; }
  return [(i >> 1) & 1 ? -1 : 1, i & 1 ? -1 : 1];
}
function sampledE(a, b, n) {
  let sum = 0;
  for (let k = 0; k < n; k++) { const [x, y] = sampleOutcome(a, b); sum += x * y; }
  return sum / n;
}
const N = 2000;
const Ss = sampledE(0, 45, N) + sampledE(90, 45, N) + sampledE(90, 135, N) - sampledE(0, 135, N);
console.log('sampled quantum S =', Ss.toFixed(3));

// classical script: shared lambda, A=sign(cos(a-lambda)), B=sign(cos(b-lambda))
function classicalOutcome(aDeg, bDeg) {
  const lam = Math.random() * 360;
  const sgn = (x) => (Math.cos((x * Math.PI) / 180) >= 0 ? 1 : -1);
  return [sgn(aDeg - lam), sgn(bDeg - lam)];
}
function classicalE(a, b, n) {
  let sum = 0;
  for (let k = 0; k < n; k++) { const [x, y] = classicalOutcome(a, b); sum += x * y; }
  return sum / n;
}
const Sc = classicalE(0, 45, N) + classicalE(90, 45, N) + classicalE(90, 135, N) - classicalE(0, 135, N);
console.log('classical S =', Sc.toFixed(3), '(expect ~2.0, never above)');
// classical E vs triangle 1-2*delta/180
let maxErrC = 0;
for (let d = 0; d <= 180; d += 30) {
  const e = classicalE(d, 0, 20000);
  maxErrC = Math.max(maxErrC, Math.abs(e - (1 - (2 * d) / 180)));
}
console.log('classical E matches triangle within', maxErrC.toFixed(3));
