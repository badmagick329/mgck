import pytest
from django.db.utils import IntegrityError
from gfys.models import Account


@pytest.mark.django_db
def test_account_unique():
    Account.objects.create(name="test")
    with pytest.raises(IntegrityError):
        Account.objects.create(name="test")
