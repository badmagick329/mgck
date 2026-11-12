import os
import subprocess
import sys
from pathlib import Path

MANAGE_PY = Path(__file__).resolve().parents[2] / "manage.py"


def run_deploy_check(**env_overrides):
    # Settings are read at import, so each environment needs a fresh process.
    # The cookie flag must come only from the case itself: drop whatever the
    # caller's shell (or this process's own dotenv load) set, and disable
    # python-dotenv in the child so a developer's ignored .env cannot supply it.
    env = {k: v for k, v in os.environ.items() if k != "AUTH_COOKIES_SECURE"}
    env["PYTHON_DOTENV_DISABLED"] = "1"
    env.update(env_overrides)
    result = subprocess.run(
        [sys.executable, str(MANAGE_PY), "check", "--deploy"],
        cwd=MANAGE_PY.parent,
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )
    output = result.stdout + result.stderr
    assert result.returncode == 0, output
    return output


def test_production_settings_mark_auth_cookies_secure():
    # MGK-24: Files uses Django session auth, so production must keep its
    # session and CSRF cookies off plain HTTP when the flag is unset. The flag
    # stays unset here on purpose: setting it would stop testing the default.
    output = run_deploy_check(DEBUG="0")
    assert "security.W012" not in output, output
    assert "security.W016" not in output, output


def test_auth_cookies_secure_opt_out_allows_plain_http_stack():
    # MGK-27: the local_prod stack runs DEBUG=0 over plain HTTP, where browsers
    # drop Secure cookies, so it must be able to turn both flags off.
    output = run_deploy_check(DEBUG="0", AUTH_COOKIES_SECURE="0")
    assert "security.W012" in output, output
    assert "security.W016" in output, output
