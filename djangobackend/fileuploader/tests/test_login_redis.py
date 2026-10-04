"""Exercise real atomic Redis admission; opt in with MGCK_TEST_DOCKER=1."""
from concurrent.futures import ThreadPoolExecutor
import os
from pathlib import Path
import subprocess
import time
from unittest.mock import patch

import pytest
from django.test import Client, RequestFactory
from django.urls import reverse
from redis import Redis

from fileuploader.login_admission import admit_login, redis_client

pytestmark = pytest.mark.skipif(
    os.environ.get("MGCK_TEST_DOCKER") != "1", reason="requires local Docker"
)


@pytest.fixture
def shared_redis(settings):
    def docker(*args):
        return subprocess.run(["docker", *args], check=True, capture_output=True, text=True).stdout.strip()

    container = docker("run", "--detach", "--rm", "--publish", "127.0.0.1::6379", "redis:6-alpine")
    try:
        port = docker("port", container, "6379/tcp").split(":")[-1]
        settings.REDIS_URL = f"redis://127.0.0.1:{port}"
        client = Redis.from_url(settings.REDIS_URL, socket_timeout=1)
        for _ in range(50):
            try:
                if client.ping():
                    break
            except OSError:
                time.sleep(0.1)
        yield client
    finally:
        redis_client.cache_clear()
        docker("rm", "--force", container)


def attempt(username="Alice", peer="198.51.100.1"):
    request = RequestFactory().post("/files/login/", HTTP_X_FORWARDED_FOR=peer)
    return admit_login(request, username)


def test_atomic_parallel_attempts_and_victim_isolation(shared_redis):
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda _: attempt(), range(20)))
    assert results.count(None) == 5
    assert results.count(429) == 15
    assert attempt(peer="198.51.100.2") is None
    assert attempt("ALICE", "192.0.2.99, 198.51.100.1") == 429
    # Rejected attempts cannot grow username keys or extend the fixed window.
    for key in shared_redis.scan_iter():
        assert 0 < shared_redis.ttl(key) <= 60


def test_username_rotation_and_global_budget(shared_redis):
    for index in range(10):
        assert attempt(username=f"User {index}") is None
    assert attempt(username="Fresh username") == 429
    for index in range(50):
        assert attempt(username="Alice", peer=f"198.51.100.{index + 2}") is None
    assert attempt(username="Alice", peer="198.51.100.99") == 429
    assert int(shared_redis.get("files:login:aggregate")) == 60


def test_real_login_view_never_hashes_denied_attempts_and_window_expires(shared_redis):
    client = Client()
    with patch("fileuploader.views.authenticate", return_value=None) as authenticate:
        for index in range(6):
            response = client.post(reverse("fileuploader:login"), {
                "username": "Alice", "password": "invalid",
            }, HTTP_X_FORWARDED_FOR="198.51.100.1")
            assert response.status_code == (200 if index < 5 else 429)
        assert authenticate.call_count == 5
        # Expire only the disposable test keys, without a long wall-clock wait.
        for key in shared_redis.scan_iter():
            shared_redis.pexpire(key, 1)
        time.sleep(0.02)
        assert client.post(reverse("fileuploader:login"), {
            "username": "Alice", "password": "invalid",
        }, HTTP_X_FORWARDED_FOR="198.51.100.1").status_code == 200
        assert authenticate.call_count == 6


def test_active_dokploy_compose_supplies_django_redis():
    compose = Path(__file__).resolve().parents[3] / "notes/dokploy/docker-compose.yaml"
    import json
    result = subprocess.run([
        "docker", "compose", "-f", str(compose), "config", "--no-interpolate",
        "--no-normalize", "--no-consistency", "--format", "json",
    ], check=True, capture_output=True, text=True)
    services = json.loads(result.stdout)["services"]
    assert services["djangobackend"]["environment"]["REDIS_URL"] == "redis://redis:6379"
    assert "appnet" in services["redis"]["networks"]
