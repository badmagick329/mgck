import pytest

NOINDEX = "noindex, nofollow"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path",
    [
        "/files/login/?next=/files/",
        "/files/",
        "/files/does-not-exist/",
        "/files",
    ],
)
def test_files_responses_are_noindex(client, path):
    response = client.get(path)

    assert response["X-Robots-Tag"] == NOINDEX


@pytest.mark.django_db
@pytest.mark.parametrize("path", ["/health/", "/filesystem/"])
def test_other_responses_are_not_noindex(client, path):
    response = client.get(path)

    assert "X-Robots-Tag" not in response
