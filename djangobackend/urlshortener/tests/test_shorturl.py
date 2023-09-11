import pytest
from urlshortener.models import BASE_URL, MAX_ID, ShortURL, permute


@pytest.mark.django_db
def test_create_id():
    short_id = ShortURL.create_id()
    assert short_id
    assert len(short_id) == ShortURL.ID_SIZE
    assert short_id.isalnum()


def test_permute():
    perms = set(permute("ab", 2))
    assert perms == {"aa", "ab", "ba", "bb"}


def test_space_in_custom_id():
    result = ShortURL.request_custom_id("a b")
    assert isinstance(result, ValueError)


def test_too_long_custom_id():
    result = ShortURL.request_custom_id("a" * (MAX_ID + 1))
    assert isinstance(result, ValueError)


def test_non_alphanumeric_custom_id():
    result = ShortURL.request_custom_id("a!")
    assert isinstance(result, ValueError)


@pytest.mark.django_db
def test_taken_custom_id():
    ShortURL.objects.create(url="https://example.com", short_id="taken")
    result = ShortURL.request_custom_id("taken")
    assert isinstance(result, ValueError)


@pytest.mark.django_db
def test_request_custom_id():
    custom_id = ShortURL.request_custom_id("custom")
    assert custom_id == "custom"


@pytest.mark.django_db
def test_redirect_url():
    short_url = ShortURL.objects.create(
        url="https://example.com", short_id="taken"
    )
    assert short_url.redirect_url == f"{BASE_URL}/{short_url.short_id}"
