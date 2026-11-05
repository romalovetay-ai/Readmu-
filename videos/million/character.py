"""Shim: the narrator now lives in videos/narrator/narrator.py (shared by all videos)."""
import importlib.util as _u
import os as _os

_p = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "narrator", "narrator.py")
_s = _u.spec_from_file_location("narrator", _p)
_m = _u.module_from_spec(_s)
_s.loader.exec_module(_m)
globals().update({k: v for k, v in vars(_m).items() if not k.startswith("__")})
