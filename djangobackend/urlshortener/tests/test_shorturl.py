import pytest
from urlshortener.models import ShortURL, permute


@pytest.mark.django_db
def test_create_id():
    short_id = ShortURL.create_id()
    assert short_id
    assert len(short_id) == ShortURL.ID_SIZE
    assert short_id.isalnum()


def test_permute():
    perms = set(permute("ab", 2))
    assert perms == {"aa", "ab", "ba", "bb"}
