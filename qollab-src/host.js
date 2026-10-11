// Connects the game to Qiskit (bell/bridge.py, running in Qollab's in-browser Python)
// and to the backend picked in Qollab's Select QPU dialog.
export function createHost(bridge, backend) {
  const call = async (name, ...args) => {
    const out = JSON.parse(await bridge[name].callPromising(...args));
    if (!out.ok) throw new Error(out.detail);
    return out.data;
  };
  return {
    describe: () => call('describe', backend),
    exact: () => call('exact'),
    run: shots => call('run', backend, shots)
  };
}
