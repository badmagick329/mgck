import pytest
from django.test import Client
from django.urls import reverse

from milestones.tests.helpers import internal_auth_headers


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path,method",
    [
        ("/milestones_api/", "get"),
        ("/milestones_api/", "post"),
        ("/milestones_api/Retired%20event", "patch"),
        ("/milestones_api/Retired%20event", "delete"),
    ],
)
def test_retired_crud_routes_return_404(path, method):
    response = getattr(Client(), method)(
        path, **internal_auth_headers("Alice", "core-alice")
    )
    assert response.status_code == 404
    assert not response.has_header("Location")


@pytest.mark.django_db
def test_sync_route_preserves_empty_snapshot_contract():
    url = reverse("milestones:sync_milestones")
    assert url == "/milestones_api/sync"
    response = Client().post(
        url,
        {"records": []},
        content_type="application/json",
        **internal_auth_headers("Alice", "core-alice"),
    )
    assert response.status_code == 200
    assert response.json() == {"records": []}
