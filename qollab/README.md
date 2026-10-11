# Entangled Bodies

Two dancers share one entangled pair of qubits. Every time they strike a pose, each arm snaps up or down at random, and somehow the two arms agree. The obvious explanation is that they planned their moves in advance. Your job is to prove they didn't.

This effort is supported by Qollab & IonQ.

🎬 **Demo video:** _add your public video link here_
💻 **Source:** https://github.com/Riztofu/entangled-bodies

We entered **Quantum Unlocked**. The game teaches the Bell test, the experiment behind the 2022 Nobel Prize in Physics. You don't need any background; the guided tour starts from "what is a qubit?".

## Try it

1. Press **Run** and pick **IonQ Forte 1** (or the **Built-in simulator**) in Select QPU. The game loads above the console.
2. Take the **guided tour**, or set both dials to the same angle and press **Strike a pose** a few times. The arms always match.
3. Switch to **Secret script** mode. That's the best fake that pre-planned answers can manage. Turn the dials apart and compare the chart: the real pair follows a curve, the script follows a straight line.
4. Press **Run the Bell test**. Any script tops out at 2.00. The entangled pair scores about 2.83.
5. Then press **Run it on IonQ** (bottom of the Bell score panel). The same test runs with Qiskit on the backend you picked, and you get a real score, noise and all, next to Qiskit's exact answer.

## How it works

- Each pose is a measurement of the Bell state (|00⟩ + |11⟩)/√2. Each dial is a rotation (Ry) before measuring. The game's own simulator and Qiskit use the same math, and `verify.js` checks that the correlation is cos(a − b).
- The Bell score adds up correlations at four dial settings: (0°, 45°), (90°, 45°), (90°, 135°), and (0°, 135°).
- On Qollab, IonQ takes one job per Run. So all four settings go out together as one 8-qubit circuit, with each setting on its own pair of qubits, and the game splits the results back apart. You can run it once per Run on IonQ; press Stop, then Run, to go again.
- **Secret script** mode is a real local hidden-variable model (a shared random direction), not a strawman. It's the best a script can do, and it still can't pass 2.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `main.css`, `game.js` | The game: dancers, dials, chart, Bell meter, tour |
| `main.js`, `host.js` | Load the game and connect it to Qiskit and the selected backend |
| `bell/chsh.py` | The Bell test in Qiskit: builds the circuits, runs them as one job, computes S |
| `bell/bridge.py` | Passes results between the game and Python as JSON |

Dependencies: Qiskit (preinstalled on Qollab). No API keys or secrets.

## Credits

- **Team:** _add names_
- _Say here what existed before the hackathon window, if anything._
- License: MIT (see `LICENSE`).
