import pytest
from django.db.utils import IntegrityError
from gfys.models import Tag


@pytest.mark.django_db
def test_tag_unique():
    Tag.objects.create(name="test")
    with pytest.raises(IntegrityError):
        Tag.objects.create(name="test")
