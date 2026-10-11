"""JSON bridge between the game's JavaScript (Qollab JS project) and bell/chsh.py.

Every function returns JSON text: {"ok": true, "data": ...} or {"ok": false, "detail": "..."},
so errors show up in the game instead of breaking it.
"""
import json

from qiskit import __version__ as QISKIT_VERSION

from . import chsh


def _respond(function):
    try:
        return json.dumps({"ok": True, "data": function()})
    except Exception as error:  # report, never break the page
        return json.dumps({"ok": False, "detail": "{}: {}".format(type(error).__name__, error)[:400]})


def _describe(backend):
    name = chsh._name(backend)
    lowered = name.lower()
    ionq = "ionq" in lowered
    paid = ionq and "qpu" in lowered and "sim" not in lowered
    noise = None
    if ionq and not paid:
        try:
            noise = getattr(backend.options, "noise_model", None)
        except AttributeError:
            noise = None
    if paid:
        label = "IonQ " + name.split(".", 1)[-1].replace("-", " ").title() + " QPU"
    elif ionq:
        label = "IonQ simulator" + (" ({} noise)".format(noise) if noise and noise != "ideal" else "")
    else:
        label = name.replace("_", " ")
    short = ("IonQ " + name.split(".", 1)[-1].replace("-", " ").title()) if paid else "IonQ" if ionq else "this simulator"
    return {"name": name, "label": label, "short": short, "ionq": ionq, "paid": paid, "qiskit": QISKIT_VERSION}


def describe(backend):
    return _respond(lambda: _describe(backend))


def exact():
    return _respond(chsh.exact_bell_score)


def run(backend, shots):
    shots = int(shots)
    if shots not in (200, 500, 1000):
        return json.dumps({"ok": False, "detail": "Pick 200, 500, or 1000 shots."})
    return _respond(lambda: chsh.bell_test(backend, shots))
