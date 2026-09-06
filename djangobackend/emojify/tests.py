from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest
import requests
from django.db import OperationalError
from django.test import Client

from emojify.models import AiControl, AiUsage
from milestones.tests.helpers import INTERNAL_API_KEY, internal_auth_headers


@pytest.fixture(autouse=True)
def configure(settings):
    settings.NEXT_DJANGO_INTERNAL_API_KEY = INTERNAL_API_KEY
    settings.GEMINI_API_KEY = 'test-key'


def client(role='AcceptedUser'):
    return Client(**internal_auth_headers('Alice', 'core-alice'), HTTP_X_MGCK_CORE_ROLE=role)


pytestmark = pytest.mark.django_db


def test_migration_defaults_to_disabled():
    assert AiControl.objects.get(pk=1).enabled is False


@patch('emojify.ai.requests.post')
def test_disabled_never_calls_provider(post):
    response = client().post('/internal/emojify/generate', {'text': 'Hello', 'frequent': False}, content_type='application/json')
    assert response.status_code == 503
    post.assert_not_called()
    assert not AiUsage.objects.exists()


@pytest.mark.parametrize('role', ['NewUser', 'AcceptedUser'])
def test_non_admin_cannot_read_or_change_control(role):
    api = client(role)
    assert api.get('/internal/emojify/usage?start=2026-09-01&end=2026-09-06').status_code == 403
    assert api.patch('/internal/emojify/control', {'enabled': True}, content_type='application/json').status_code == 403


def test_untrusted_request_cannot_assert_admin():
    api = Client()
    response = api.patch('/internal/emojify/control', {'enabled': True}, content_type='application/json', HTTP_X_MGCK_CORE_ROLE='Admin')
    assert response.status_code == 401


def test_admin_switch_records_actor():
    response = client('Admin').patch('/internal/emojify/control', {'enabled': True}, content_type='application/json')
    assert response.status_code == 200
    control = AiControl.objects.get(pk=1)
    assert control.enabled
    assert control.updated_by == 'core-alice'


@patch('emojify.ai.requests.post')
def test_generation_records_identity_and_tokens(post):
    AiControl.objects.filter(pk=1).update(enabled=True)
    post.return_value = Mock(json=lambda: {'candidates': [{'content': {'parts': [{'text': 'Hello ðŸ‘‹'}]}}], 'usageMetadata': {'promptTokenCount': 12, 'candidatesTokenCount': 3, 'totalTokenCount': 15}})
    response = client().post('/internal/emojify/generate', {'text': 'Hello', 'frequent': False, 'username': 'forged'}, content_type='application/json')
    assert response.status_code == 200
    assert response.data['text'] == 'Hello ðŸ‘‹'
    usage = AiUsage.objects.get()
    assert (usage.user_id, usage.username, usage.status, usage.total_tokens) == ('core-alice', 'Alice', 'succeeded', 15)
    assert post.call_args.kwargs['headers'] == {'x-goog-api-key': 'test-key'}


@patch('emojify.ai.requests.post', side_effect=requests.Timeout)
def test_provider_failure_still_counts(post):
    AiControl.objects.filter(pk=1).update(enabled=True)
    assert client().post('/internal/emojify/generate', {'text': 'Hello', 'frequent': False}, content_type='application/json').status_code == 503
    assert AiUsage.objects.get().status == 'failed'


@patch('emojify.ai.requests.post')
def test_database_failure_blocks_provider(post):
    with patch('emojify.ai.AiControl.objects.select_for_update', side_effect=OperationalError):
        response = client().post('/internal/emojify/generate', {'text': 'Hello', 'frequent': False}, content_type='application/json')
    assert response.status_code == 503
    post.assert_not_called()


@patch('emojify.ai.requests.post')
def test_rate_limit_is_enforced_in_django(post):
    AiControl.objects.filter(pk=1).update(enabled=True)
    AiUsage.objects.bulk_create([AiUsage(user_id='core-alice', username='Alice', input_characters=5) for _ in range(20)])
    assert client().post('/internal/emojify/generate', {'text': 'Hello', 'frequent': False}, content_type='application/json').status_code == 429
    post.assert_not_called()


def test_usage_groups_by_utc_day_and_user_id():
    first = AiUsage.objects.create(user_id='core-alice', username='Old name', input_characters=5, status='succeeded', total_tokens=15)
    second = AiUsage.objects.create(user_id='core-alice', username='Alice', input_characters=7, status='failed')
    AiUsage.objects.filter(pk=first.pk).update(started_at=datetime(2026, 9, 5, 1, tzinfo=timezone.utc))
    AiUsage.objects.filter(pk=second.pk).update(started_at=datetime(2026, 9, 5, 23, tzinfo=timezone.utc))
    response = client('Admin').get('/internal/emojify/usage?start=2026-09-05&end=2026-09-05')
    assert response.status_code == 200
    row = response.data['rows'][0]
    assert (row['requests'], row['succeeded'], row['failed'], row['characters'], row['total_tokens']) == (2, 1, 1, 12, 15)
    assert row['username'] == 'Alice'


@pytest.mark.parametrize('data', [{'text': 'x' * 1501, 'frequent': False}, {'text': 'Hello', 'frequent': 'bad'}])
@patch('emojify.ai.requests.post')
def test_invalid_input_never_calls_provider(post, data):
    assert client().post('/internal/emojify/generate', data, content_type='application/json').status_code == 400
    post.assert_not_called()
