"""Bell test in Qiskit: exact values, packing into one job, and the JSON bridge."""
import json
import math
import unittest

from qiskit.providers.basic_provider import BasicSimulator

from bell import bridge, chsh


class Options:
    noise_model = "aria-1"


class FakeIonQSimulator:
    """Named like Qollab's IonQ simulator; runs on BasicSimulator and records each job."""
    name, options = "ionq_simulator", Options()

    def __init__(self):
        self.jobs = []

    def run(self, circuit, **options):
        self.jobs.append((circuit, options))
        return BasicSimulator().run(circuit, shots=options["shots"], seed_simulator=7)


class BellTests(unittest.TestCase):
    def test_exact_correlations_are_cos_a_minus_b_and_s_is_2_root_2(self):
        for a, b, _ in chsh.SETTINGS:
            self.assertAlmostEqual(chsh.exact_correlation(a, b), math.cos(math.radians(a - b)), places=12)
        self.assertAlmostEqual(chsh.exact_bell_score()["S"], 2 * math.sqrt(2), places=12)

    def test_same_angle_always_matches(self):
        for angle in (0, 35, 90, 160):
            self.assertAlmostEqual(chsh.exact_correlation(angle, angle), 1.0, places=12)

    def test_sampled_bell_test_beats_the_classical_limit(self):
        result = chsh.bell_test(BasicSimulator(), shots=4000)
        self.assertGreater(result["S"], 2.6)
        self.assertLess(result["S"], 3.0)

    def test_all_four_settings_go_out_as_one_eight_qubit_job_in_ionq_gates(self):
        backend = FakeIonQSimulator()
        result = chsh.bell_test(backend, shots=1000)
        self.assertEqual(len(backend.jobs), 1)
        circuit, options = backend.jobs[0]
        self.assertEqual((circuit.num_qubits, options), (8, {"shots": 1000}))
        for item in circuit.data:
            self.assertIn(item.operation.name, chsh.IONQ_BASIS + ["measure", "barrier"])
        self.assertGreater(result["S"], 2.4)

    def test_counts_are_split_per_setting(self):
        # Keys read q7 … q0. Setting 0 (q0, q1) always matches; setting 1 (q2, q3) never does.
        counts = {"00000100": 50, "00001011": 50}
        e = chsh.correlations_from_counts(counts)
        self.assertEqual(e[0], 1.0)
        self.assertEqual(e[1], -1.0)


class BridgeTests(unittest.TestCase):
    def test_describe_labels_ionq_and_local_backends(self):
        info = json.loads(bridge.describe(FakeIonQSimulator()))["data"]
        self.assertEqual((info["label"], info["short"], info["ionq"], info["paid"]), ("IonQ simulator (aria-1 noise)", "IonQ", True, False))
        self.assertFalse(json.loads(bridge.describe(BasicSimulator()))["data"]["ionq"])

    def test_run_and_errors_come_back_as_json(self):
        out = json.loads(bridge.run(BasicSimulator(), 500))
        self.assertTrue(out["ok"])
        self.assertEqual(len(out["data"]["correlations"]), 4)
        self.assertFalse(json.loads(bridge.run(BasicSimulator(), 7))["ok"])


if __name__ == "__main__":
    unittest.main()
