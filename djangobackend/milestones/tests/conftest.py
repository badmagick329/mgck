import pytest

from milestones.tests.helpers import INTERNAL_API_KEY


@pytest.fixture(autouse=True)
def configure_internal_authentication(settings):
    settings.NEXT_DJANGO_INTERNAL_API_KEY = INTERNAL_API_KEY
