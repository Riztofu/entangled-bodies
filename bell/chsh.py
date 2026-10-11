"""The Bell test in Qiskit: an entangled pair, measured at the four CHSH dial settings.

Alice and Bob share |Φ+⟩ = (|00⟩ + |11⟩)/√2. A dial angle θ means "rotate by
Ry(−θ), then measure", exactly like the game's simulator. For this state the
correlation is E(a, b) = cos(a − b), and the CHSH score

    S = E(0°, 45°) + E(90°, 45°) + E(90°, 135°) − E(0°, 135°)

reaches 2√2 ≈ 2.83, while any pre-agreed script (local hidden variables) is
capped at 2.

IonQ backends on Qollab accept one job per Run, so `bell_test` puts all four
settings side by side in ONE 8-qubit circuit: setting k uses qubits 2k
(Alice) and 2k + 1 (Bob), and its two measured bits are read back out of the
shared bitstring.

Run it outside Qollab:
    python -m bell.chsh                  # Qiskit's BasicSimulator
    python -m bell.chsh --ionq simulator  # IonQ cloud (needs IONQ_API_KEY and qiskit-ionq)
"""
from __future__ import annotations

import math
import time

from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector

# (Alice's dial, Bob's dial, sign in S) — the same four settings as the game's Bell button.
SETTINGS = ((0, 45, 1), (90, 45, 1), (90, 135, 1), (0, 135, -1))
IONQ_BASIS = ["x", "y", "z", "h", "s", "sdg", "t", "tdg", "rx", "ry", "rz", "cx", "swap"]


def pair_circuit(a_deg: float, b_deg: float) -> QuantumCircuit:
    """Bell pair, then each dancer's dial: qubit 0 = Alice, qubit 1 = Bob (no measurement)."""
    qc = QuantumCircuit(2, name="pose_{}_{}".format(int(a_deg), int(b_deg)))
    qc.h(0)
    qc.cx(0, 1)
    qc.ry(-math.radians(a_deg), 0)
    qc.ry(-math.radians(b_deg), 1)
    return qc


def exact_correlation(a_deg: float, b_deg: float) -> float:
    """⟨Z_A Z_B⟩ from Qiskit's Statevector: +1 means the arms always match, −1 never."""
    probs = Statevector.from_instruction(pair_circuit(a_deg, b_deg)).probabilities()
    return float(probs[0] - probs[1] - probs[2] + probs[3])


def exact_bell_score() -> dict:
    correlations = [exact_correlation(a, b) for a, b, _ in SETTINGS]
    return {"correlations": correlations, "S": sum(sign * e for (_, _, sign), e in zip(SETTINGS, correlations))}


def packed_circuit() -> QuantumCircuit:
    """All four settings in one measured 8-qubit circuit (one job on IonQ)."""
    qc = QuantumCircuit(2 * len(SETTINGS), 2 * len(SETTINGS), name="bell_test")
    for k, (a, b, _) in enumerate(SETTINGS):
        qc.compose(pair_circuit(a, b), qubits=[2 * k, 2 * k + 1], inplace=True)
    qc.measure(range(2 * len(SETTINGS)), range(2 * len(SETTINGS)))
    return qc


def _bits(key, width):
    text = str(key).replace(" ", "")
    if not (text and set(text) <= {"0", "1"} and len(text) <= width):
        text = format(int(text, 0), "b")
    return text.zfill(width)


def correlations_from_counts(counts: dict) -> list:
    """E for each setting from the packed counts. Qiskit keys read highest qubit first."""
    width = 2 * len(SETTINGS)
    totals = [[0, 0] for _ in SETTINGS]  # [matches, total]
    for key, value in counts.items():
        bits = _bits(key, width)
        for k in range(len(SETTINGS)):
            alice, bob = bits[width - 1 - 2 * k], bits[width - 2 - 2 * k]
            totals[k][0] += value if alice == bob else 0
            totals[k][1] += value
    return [(2 * same - n) / n if n else 0.0 for same, n in totals]


def _name(backend) -> str:
    name = getattr(backend, "name", "backend")
    return str(name() if callable(name) else name)


def compile_for(backend, circuit):
    if "ionq" in _name(backend).lower():
        return transpile(circuit, basis_gates=IONQ_BASIS, optimization_level=1)
    try:
        return transpile(circuit, backend=backend, optimization_level=1)
    except Exception:
        return transpile(circuit, basis_gates=["rx", "ry", "rz", "h", "x", "cx"], optimization_level=1)


def bell_test(backend, shots: int = 500) -> dict:
    """Run the four settings as one job and return S, the four correlations, and Qiskit's exact answer."""
    started = time.time()
    job = backend.run(compile_for(backend, packed_circuit()), shots=shots)
    counts = job.result().get_counts()
    if isinstance(counts, list):
        counts = counts[0]
    counts = {k: int(round(v)) for k, v in counts.items()}
    correlations = correlations_from_counts(counts)
    exact = exact_bell_score()
    return {
        "backend": _name(backend),
        "shots": shots,
        "settings": [list(s) for s in SETTINGS],
        "correlations": correlations,
        "S": sum(sign * e for (_, _, sign), e in zip(SETTINGS, correlations)),
        "exact_correlations": exact["correlations"],
        "exact_S": exact["S"],
        "seconds": round(time.time() - started, 2),
    }


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Run the CHSH Bell test on a Qiskit backend.")
    parser.add_argument("--ionq", metavar="TARGET", help="IonQ backend, e.g. simulator or qpu.forte-1 (needs IONQ_API_KEY)")
    parser.add_argument("--noise", help="IonQ simulator noise model, e.g. aria-1 or forte-1")
    parser.add_argument("--shots", type=int, default=1000)
    args = parser.parse_args()
    if args.ionq:
        from qiskit_ionq import IonQProvider

        backend = IonQProvider().get_backend(args.ionq)
        if args.noise:
            backend.set_options(noise_model=args.noise)
    else:
        from qiskit.providers.basic_provider import BasicSimulator

        backend = BasicSimulator()
    result = bell_test(backend, args.shots)
    for (a, b, sign), e, exact in zip(SETTINGS, result["correlations"], result["exact_correlations"]):
        print("Alice {:>3}°  Bob {:>3}°   E = {:+.3f}   (exact {:+.3f})".format(a, b, e, exact))
    print("S = {:.3f} on {} with {} shots   (exact {:.3f}, classical limit 2.000)".format(result["S"], result["backend"], result["shots"], result["exact_S"]))


if __name__ == "__main__":
    main()
