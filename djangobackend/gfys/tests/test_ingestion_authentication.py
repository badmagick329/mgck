from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.urls import reverse


@pytest.mark.parametrize("configured", ["", "   "])
def test_empty_configuration_disables_ingestion(client, settings, configured):
    settings.TOKEN = configured
    with patch("gfys.views.Gfy.create_gfy_from_upload") as create:
        response = client.post(reverse("gfys:gfy-upload"), data={}, content_type="application/json")
    assert response.status_code == 503
    create.assert_not_called()


@pytest.mark.parametrize("body", [{}, {"token": ""}, {"token": "wrong"}, {"token": None}, {"token": 123}, []])
def test_missing_wrong_or_malformed_tokens_never_persist(client, settings, body):
    settings.TOKEN = "ingestion-test-secret"
    with patch("gfys.views.Gfy.create_gfy_from_upload") as create:
        response = client.post(reverse("gfys:gfy-upload"), data=body, content_type="application/json")
    assert response.status_code in (400, 403)
    create.assert_not_called()


def test_valid_token_keeps_machine_ingestion_working(client, settings):
    settings.TOKEN = "ingestion-test-secret"
    with patch("gfys.views.Gfy.create_gfy_from_upload", return_value=SimpleNamespace(object_id="id", imgur_id="img", video_url="video")) as create:
        response = client.post(reverse("gfys:gfy-upload"), data={"token": settings.TOKEN}, content_type="application/json")
    assert response.status_code == 200
    create.assert_called_once()
