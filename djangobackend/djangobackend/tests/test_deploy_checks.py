import os
import subprocess
import sys
from pathlib import Path

MANAGE_PY = Path(__file__).resolve().parents[2] / "manage.py"


def test_production_settings_mark_auth_cookies_secure():
    # MGK-24: Files uses Django session auth, so production must keep its session
    # and CSRF cookies off plain HTTP. Settings are read at import, so the
    # production branch is only observable from a fresh process with DEBUG=0.
    result = subprocess.run(
        [sys.executable, str(MANAGE_PY), "check", "--deploy"],
        cwd=MANAGE_PY.parent,
        env={**os.environ, "DEBUG": "0"},
        capture_output=True,
        text=True,
        timeout=120,
    )
    output = result.stdout + result.stderr
    assert result.returncode == 0, output
    assert "security.W012" not in output, output
    assert "security.W016" not in output, output
