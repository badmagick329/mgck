import pytest

from milestones.tests.helpers import JWT_AUDIENCE, JWT_ISSUER, JWT_SIGNING_KEY


@pytest.fixture(autouse=True)
def configure_core_jwt(settings):
    settings.CORE_JWT_SIGNING_KEY = JWT_SIGNING_KEY
    settings.CORE_JWT_ISSUER = JWT_ISSUER
    settings.CORE_JWT_AUDIENCE = JWT_AUDIENCE
