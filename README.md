# Entangled Bodies

A playable **Bell test** — two dancers share one entangled pair of qubits, and your job is to prove that no secret script could fake the correlations you're seeing.

Built for the **Qollab × IonQ quantum hackathon** (October 2026).

## Play it

No install, no server, no build step. Either:

- **Download** this repo (green "Code" button → "Download ZIP"), unzip it, and double-click `index.html` — it opens in your browser and runs entirely offline except for two Google Fonts.
- Or clone it: `git clone` this repo and open `index.html`.

Everything is a single self-contained HTML file: the quantum simulator, the dancers, the charts, and the explanations.

## What it teaches

Alice and Bob each have a dial — the angle you measure their qubit along. Strike a pose and each dancer's arm snaps **up (+1)** or **down (−1)**.

1. **Same angle → arms always match**, even though each arm alone is a perfect 50/50 coin flip. That's entanglement: the randomness itself is shared.
2. **"Couldn't they just have agreed on answers beforehand?"** The game takes this skeptic's objection seriously — "secret script" mode replaces the entangled pair with the best classical fake (local hidden variables). The two are indistinguishable at equal angles.
3. **Turn the dials apart** and the correlation chart separates them: entanglement fades as a cosine curve, a script can only fade as a straight line. The gap is widest at Δ = 45°.
4. **The Bell score (CHSH)** settles it with one number. John Bell proved in 1964 that any pre-agreed script scores at most **2.00**; entangled qubits reach **2√2 ≈ 2.83**. The in-game meter visibly breaks the classical ceiling — the same result that won the 2022 Nobel Prize in Physics.
5. **Mystery box mode** hides which source you've got — gather evidence from the chart and the meter, then reveal.

## It's a real simulation, not an animation

The page holds the actual 2-qubit statevector of the Bell state |Φ⁺⟩ — four amplitudes — rotates it into whatever measurement bases the dials select (Ry rotations), and samples every pose from |amplitude|² (the Born rule), exactly as a quantum computer's readout would. The "under the hood" panel shows the live amplitudes at all times.

To check the physics yourself:

```
node verify.js
```

This runs the same simulator the game uses and confirms that the correlation equals cos(a−b) to machine precision, that the quantum CHSH score is 2.8284, and that the classical script caps at 2.0.

## Run it on Qollab (Qiskit + IonQ)

`qollab/` is the same game packaged as a Qollab JS / Qiskit project. Upload that folder (or a zip of it) at qollab.xyz → New Project → Upload your own files. Press **Run** and pick a backend in Select QPU. A **Run it on …** button appears under the Bell score. It runs the four CHSH settings with Qiskit on that backend and shows the measured S (with its statistical error) next to Qiskit's exact 2√2.

IonQ accepts one job per Run on Qollab, so all four settings go out as one 8-qubit circuit, each setting on its own pair of qubits.

Rebuild the folder after changing `index.html` or `bell/`: `node build-qollab.cjs`.

## Run the Bell test with Qiskit outside Qollab

```
pip install -r requirements.txt
python -m bell.chsh                                   # Qiskit's BasicSimulator
pip install qiskit-ionq && export IONQ_API_KEY=...    # optional: IonQ
python -m bell.chsh --ionq simulator --noise aria-1   # IonQ cloud simulator with Aria noise
```

Tests: `python -m pytest tests` (Qiskit values, one-job packing, the bridge) and `node verify.js` (the game's own simulator).

## Files

- `index.html`: the whole standalone game (HTML + CSS + JS)
- `verify.js`: standalone physics check for the game's simulator
- `bell/chsh.py`: the Bell test in Qiskit (circuits, one-job packing, S)
- `bell/bridge.py`: JSON bridge used by the Qollab build
- `qollab-src/`: Qollab entry point, host, and project-page text; `build-qollab.cjs` assembles `qollab/`
- `qollab/`: the built Qollab project (upload this)
- `LICENSE`: MIT
