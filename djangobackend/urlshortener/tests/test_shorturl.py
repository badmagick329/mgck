import pytest
from urlshortener.models import BASE_URL, MAX_ID, ShortCode, ShortURL


def test_space_in_custom_id():
    result = ShortURL.generate_custom_id("a b")
    assert isinstance(result, ValueError)


def test_too_long_custom_id():
    result = ShortURL.generate_custom_id("a" * (MAX_ID + 1))
    assert isinstance(result, ValueError)


def test_non_alphanumeric_custom_id():
    result = ShortURL.generate_custom_id("a!")
    assert isinstance(result, ValueError)


@pytest.mark.django_db
def test_taken_custom_id():
    ShortURL.objects.create(url="https://example.com", short_id="taken")
    result = ShortURL.generate_custom_id("taken")
    assert isinstance(result, ValueError)


@pytest.mark.django_db
def test_request_custom_id():
    custom_id = ShortURL.generate_custom_id("custom")
    assert custom_id == "custom"


@pytest.mark.django_db
def test_redirect_url():
    short_url = ShortURL.objects.create(
        url="https://example.com", short_id="taken"
    )
    assert short_url.redirect_url == f"{BASE_URL}/{short_url.short_id}"


def test_random_id():
    short_codes = list()
    id_size = 4
    chars = "a1"
    code_generator = ShortCode(chars=chars, size=id_size)
    for _ in range(code_generator.max_ids):
        generated_id = code_generator.available_code(short_codes)
        assert generated_id is not None
        assert generated_id not in short_codes
        assert len(generated_id) == id_size
        short_codes.append(generated_id)

    generated_id = code_generator.available_code(short_codes)
    assert generated_id is None
