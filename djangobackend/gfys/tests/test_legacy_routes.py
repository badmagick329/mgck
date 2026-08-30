from django.urls import reverse


def test_gfy_ingestion_route_is_preserved(client):
    assert reverse("gfys:gfy-upload") == "/v0gfys/gfy-upload"
    assert client.get("/v0gfys/gfy-upload").status_code == 400


def test_removed_gfy_pages_return_not_found(client):
    for path in (
        "/v0gfys/",
        "/v0gfys/login/",
        "/v0gfys/gfy-list",
        "/v0gfys/imgur-form",
        "/v0gfys/imgur-upload",
        "/v0gfys/fetch-title",
        "/v0gfys/video/example",
    ):
        assert client.get(path).status_code == 404


def test_removed_django_kpop_page_returns_not_found(client):
    assert client.get("/kpop/").status_code == 404
    assert client.post("/kpop/search/").status_code == 404
