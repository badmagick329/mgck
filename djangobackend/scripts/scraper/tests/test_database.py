from dataclasses import replace
from datetime import date
from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from kpopcomebacks.models import Artist, ArtistCreditMatch, Release, ReleaseType
from scripts.scraper.database import Database
from scripts.scraper.release_data import ReleaseData

pytestmark = pytest.mark.django_db(transaction=True)


def snapshot(**changes):
    return replace(
        ReleaseData(
            release_date="2026-10-04",
            artist="IVE",
            title="New title",
            album="Album",
            release_type="Single",
            reddit_urls=["https://www.reddit.com/r/kpop/comments/new"],
            urls=["https://www.youtube.com/watch?v=new"],
        ),
        **changes,
    )


@pytest.fixture
def existing():
    artist = Artist.objects.create(name="IVE")
    release_type = ReleaseType.objects.create(name="Single")
    old = Release.objects.create(
        artist=artist,
        title="Old title",
        album="Album",
        release_type=release_type,
        release_date=date(2026, 10, 4),
        urls=["https://www.youtube.com/watch?v=old"],
    )
    untouched = Release.objects.create(
        artist=artist,
        title="Outside replacement day",
        album="Album",
        release_type=release_type,
        release_date=date(2026, 10, 3),
        urls=["https://www.youtube.com/watch?v=preserved"],
        spotify_urls=["https://open.spotify.com/album/preserved"],
        apple_music_urls=["https://music.apple.com/album/preserved"],
    )
    return old, untouched


def state():
    return {
        "releases": list(Release.objects.order_by("id").values()),
        "artists": list(Artist.objects.order_by("id").values()),
        "types": list(ReleaseType.objects.order_by("id").values()),
        "matches": list(ArtistCreditMatch.objects.order_by("id").values()),
    }


@pytest.mark.parametrize(
    "changes",
    [
        {"title": "x" * 511},
        {"album": "x" * 511},
        {"artist": "x" * 511},
        {"release_type": "x" * 511},
        {"artist": "   "},
        {"release_type": ""},
        {"title": None},
        {"release_date": "2026-02-30"},
        {"release_date": "2026-1-4"},
        {"release_date": []},
        {"urls": "https://www.youtube.com/watch?v=new"},
        {"spotify_urls": [123]},
        {"id": True},
    ],
)
def test_invalid_snapshot_is_rejected_before_deletion(existing, changes):
    before = state()
    # A valid replacement precedes the bad row: validating per batch is too late.
    with patch.object(
        Release.objects, "filter", wraps=Release.objects.filter
    ) as query:
        with pytest.raises(ValidationError):
            Database.save_to_db([snapshot(), snapshot(**changes)])
        query.assert_not_called()
    assert state() == before


def test_duplicate_replacements_are_rejected_before_deletion(existing):
    before = state()
    with pytest.raises(ValidationError, match="Duplicate release"):
        Database.save_to_db([snapshot(), snapshot()])
    assert state() == before


def test_duplicate_updates_are_rejected_without_changes(existing):
    before = state()
    update = ReleaseData.from_release(existing[1])
    with pytest.raises(ValidationError, match="Duplicate release ID"):
        Database.save_to_db([update, replace(update, reddit_urls=["changed"])])
    assert state() == before


def test_empty_import_does_not_remove_existing_records(existing):
    before = state()
    Database.save_to_db([])
    assert state() == before


def test_successful_replacement_preserves_other_days_and_existing_links(existing):
    old, untouched = existing
    update = ReleaseData.from_release(untouched)
    update.reddit_urls = ["https://www.reddit.com/r/kpop/comments/updated"]
    update.urls = []
    update.spotify_urls = []
    update.apple_music_urls = []
    Database.save_to_db([snapshot(), update])
    assert not Release.objects.filter(id=old.id).exists()
    assert Release.objects.count() == 2
    created = Release.objects.get(release_date="2026-10-04")
    assert created.title == "New title"
    untouched.refresh_from_db()
    assert untouched.reddit_urls == update.reddit_urls
    assert untouched.urls == ["https://www.youtube.com/watch?v=preserved"]
    assert untouched.spotify_urls == ["https://open.spotify.com/album/preserved"]
    assert untouched.apple_music_urls == ["https://music.apple.com/album/preserved"]


@pytest.mark.parametrize("target", ["bulk_create", "bulk_update", "refresh"])
def test_late_failure_rolls_back_releases_related_rows_and_matches(
    existing, target
):
    before = state()
    rows = [
        snapshot(artist="Rei (IVE) x DEAN", release_type="New type"),
        replace(ReleaseData.from_release(existing[1]), reddit_urls=["changed"]),
    ]
    if target == "refresh":
        from scripts.scraper import database

        actual = database.refresh_artist_credit_matches
        owner, method = database, "refresh_artist_credit_matches"
    else:
        owner, method = Release.objects, target
        actual = getattr(owner, method)

    def fail_after_write(*args, **kwargs):
        actual(*args, **kwargs)
        raise IntegrityError("Injected late persistence failure")

    with patch.object(owner, method, side_effect=fail_after_write):
        with pytest.raises(IntegrityError):
            Database.save_to_db(rows)
    assert state() == before


def test_second_batch_failure_preserves_the_previous_snapshot(existing):
    before = state()
    rows = [snapshot(title=f"Replacement {i}") for i in range(501)]
    actual = Release.objects.bulk_create
    calls = 0

    def fail_final_batch(*args, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise IntegrityError("Injected second-batch failure")
        return actual(*args, **kwargs)

    with patch.object(Release.objects, "bulk_create", side_effect=fail_final_batch):
        with pytest.raises(IntegrityError):
            Database.save_to_db(rows)
    assert calls == 2
    assert state() == before


def test_model_length_boundaries_and_source_empty_title_are_preserved(existing):
    Database.save_to_db(
        [
            snapshot(
                artist="a" * 510,
                release_type="r" * 510,
                title="t" * 510,
                album="b" * 510,
            ),
            snapshot(title="", album=""),
        ]
    )
    assert Release.objects.filter(title="t" * 510).exists()
    assert Release.objects.filter(title="", album="").exists()


def test_missing_saved_id_rolls_back_a_replacement(existing):
    before = state()
    missing = snapshot(id=999999, release_date="2026-10-03")
    with pytest.raises(Release.DoesNotExist):
        Database.save_to_db([snapshot(), missing])
    assert state() == before
