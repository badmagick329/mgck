from unittest.mock import Mock, patch

import pytest
from django.test import Client, RequestFactory
from django.urls import reverse
from redis.exceptions import ConnectionError

from fileuploader.login_admission import admit_login


def attempt(peer="198.51.100.1", username="Alice"):
    request = RequestFactory().post("/files/login/", HTTP_X_FORWARDED_FOR=peer)
    return admit_login(request, username)


def test_admission_uses_final_peer_and_normalizes_pair(settings):
    settings.REDIS_URL = "redis://localhost:6379"
    redis = Mock()
    redis.eval.return_value = 1
    with patch("fileuploader.login_admission.redis_client", return_value=redis):
        assert attempt("192.0.2.1, 198.51.100.1", "Alice") is None
        first = redis.eval.call_args
        assert attempt("192.0.2.99, 198.51.100.1", "ALICE") is None
        assert redis.eval.call_args == first
        assert attempt("2001:db8::1") is None
        ipv6 = redis.eval.call_args
        assert attempt("2001:0db8:0:0:0:0:0:1") is None
        assert redis.eval.call_args == ipv6
    assert first.args[-3:] == (10, 5, 60)


@pytest.mark.parametrize("peer", ["", "bad", "198.51.100.1, bad", "fe80::1%eth0"])
def test_invalid_peer_never_contacts_redis(settings, peer):
    settings.REDIS_URL = "redis://localhost:6379"
    with patch("fileuploader.login_admission.redis_client") as redis:
        assert attempt(peer) == 503
        redis.assert_not_called()


def test_missing_redis_and_redis_failure_fail_closed(settings):
    settings.REDIS_URL = ""
    assert attempt() == 503
    settings.REDIS_URL = "redis://localhost:6379"
    with patch("fileuploader.login_admission.redis_client") as client:
        client.return_value.eval.side_effect = ConnectionError("unavailable")
        assert attempt() == 503


@pytest.mark.django_db
@pytest.mark.parametrize("admission_status", [429, 503])
def test_denial_never_checks_password_or_creates_session(admission_status):
    client = Client()
    with patch("fileuploader.views.admit_login", return_value=admission_status), patch("fileuploader.views.authenticate") as authenticate:
        response = client.post(reverse("fileuploader:login"), {"username": "Alice", "password": "password"})
        assert response.status_code == admission_status
        assert response["Retry-After"] == "60"
        authenticate.assert_not_called()
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
def test_allowed_login_preserves_real_django_authentication_and_csrf(django_user_model):
    user = django_user_model.objects.create_user(username="Alice", password="password123")
    client = Client(enforce_csrf_checks=True)
    url = reverse("fileuploader:login")
    with patch("fileuploader.views.admit_login", return_value=None) as admission:
        assert client.post(url, {"username": "Alice", "password": "password123"}).status_code == 403
        admission.assert_not_called()
        assert client.get(url).status_code == 200
        response = client.post(url, {
            "username": "Alice", "password": "password123",
            "csrfmiddlewaretoken": client.cookies["csrftoken"].value,
        }, HTTP_X_FORWARDED_FOR="198.51.100.1")
        assert response.status_code == 302
        assert client.session["_auth_user_id"] == str(user.pk)


@pytest.mark.parametrize("payload", [{}, {"username": "Alice"}, {"username": "x" * 151, "password": "secret"}, {"username": "Alice", "password": "x" * 1025}])
def test_invalid_credentials_do_not_reach_admission_or_hashing(payload):
    with patch("fileuploader.views.admit_login") as admission, patch("fileuploader.views.authenticate") as authenticate:
        assert Client().post(reverse("fileuploader:login"), payload).status_code == 400
        admission.assert_not_called()
        authenticate.assert_not_called()
