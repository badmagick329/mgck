from io import StringIO

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_every_model_change_has_a_migration():
    # MGK-2: a hand-written migration once missed an AlterField, and every
    # later makemigrations would have swept it into unrelated work.
    out = StringIO()
    try:
        call_command("makemigrations", check=True, dry_run=True, stdout=out)
    except SystemExit:
        pytest.fail(f"Models differ from migrations:\n{out.getvalue()}")
