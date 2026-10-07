"""Exercise the actual Dokploy nginx config; opt in with MGCK_TEST_DOCKER=1."""
import json
import os
from pathlib import Path
import subprocess
import time
from urllib.request import Request, urlopen

import pytest


@pytest.mark.skipif(os.environ.get("MGCK_TEST_DOCKER") != "1", reason="requires local Docker")
def test_uploads_are_downloads_including_legacy_and_normalized_paths(tmp_path):
    compose = Path(__file__).resolve().parents[2] / ".ignore/deployment/dokploy/docker-compose.yaml"

    def docker(*args):
        return subprocess.run(["docker", *args], check=True, capture_output=True, text=True).stdout.strip()

    config = json.loads(docker("compose", "-f", str(compose), "config", "--no-interpolate", "--no-normalize", "--no-consistency", "--format", "json"))
    nginx_service = config["services"]["staticfilesvc"]
    assert {"source": "static_nginx", "target": "/etc/nginx/conf.d/default.conf"} in nginx_service["configs"]
    assert "TOKEN:?" in config["services"]["djangobackend"]["environment"]["TOKEN"]
    nginx_config = tmp_path / "default.conf"
    nginx_config.write_text(config["configs"]["static_nginx"]["content"].replace("$$", "$"), encoding="utf-8")
    media = tmp_path / "html"
    for path in ("uploads/legacy.html", "uploads/fileuploader/owner/script.svg", "uploads/disguised.png", "static/site.css", "gfy-videos/clip.mp4"):
        target = media / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(b"<script>alert(document.domain)</script>")

    container = docker("run", "--detach", "--rm", "--publish", "127.0.0.1::80", "--mount", f"type=bind,source={nginx_config},target=/etc/nginx/conf.d/default.conf,readonly", "--mount", f"type=bind,source={media},target=/usr/share/nginx/html,readonly", nginx_service["image"])
    try:
        port = docker("port", container, "80/tcp").split(":")[-1]
        origin = f"http://127.0.0.1:{port}"
        for _ in range(50):
            try:
                with urlopen(origin + "/static/site.css", timeout=1):
                    break
            except OSError:
                time.sleep(0.1)
        paths = ("/uploads/legacy.html", "/uploads/fileuploader/owner/script.svg", "/uploads/disguised.png", "/static/../uploads/legacy.html", "/uploads/%6cegacy.html", "/%75ploads/legacy.html", "/uploads//legacy.html")
        for path in paths:
            for method in ("GET", "HEAD"):
                with urlopen(Request(origin + path, method=method), timeout=5) as response:
                    assert response.status == 200
                    assert response.headers["Content-Type"] == "application/octet-stream"
                    assert response.headers["Content-Disposition"] == "attachment"
                    assert response.headers["X-Content-Type-Options"] == "nosniff"
                    assert response.headers["Content-Security-Policy"] == "sandbox; default-src 'none'"
        for path, content_type in (("/static/site.css", "text/css"), ("/gfy-videos/clip.mp4", "video/mp4")):
            with urlopen(origin + path, timeout=5) as response:
                assert response.headers["Content-Type"] == content_type
                assert response.headers.get("Content-Disposition") is None
    finally:
        # Remove only the exact disposable container created by this test.
        docker("rm", "--force", container)
