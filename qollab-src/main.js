// Entangled Bodies on Qollab. The game runs in the page above the console; "Run it on …"
// sends the four Bell-test settings to the backend you picked in Select QPU, as one job.
import './game.js';
import * as bridge from 'bell.bridge';
import { createHost } from './host.js';

console.log('Entangled Bodies is loading Qiskit…');
const info = await window.entangledBodies.attachHost(createHost(bridge, backend));
console.log(`Ready. Backend: ${info.label}. Play above; the "Run it on ${info.short}" button is in the Bell score panel.`);
await new Promise(() => {}); // keep the Run (and Qiskit) alive while you play
