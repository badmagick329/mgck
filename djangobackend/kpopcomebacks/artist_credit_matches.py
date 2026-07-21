"""Maintain precomputed followed-artist to raw-credit matches."""

from collections.abc import Iterable
from contextlib import contextmanager
from contextvars import ContextVar

from django.db.models import Q

from kpopcomebacks.models import Artist, ArtistCreditMatch

from .utils import artist_name_phrase_regex


_refresh_suspended: ContextVar[bool] = ContextVar(
    "kpop_artist_credit_match_refresh_suspended",
    default=False,
)


@contextmanager
def suspend_artist_credit_match_refresh():
    """Batch scraper-created artists before refreshing their relationships."""

    token = _refresh_suspended.set(True)
    try:
        yield
    finally:
        _refresh_suspended.reset(token)


def artist_credit_match_refresh_is_suspended() -> bool:
    return _refresh_suspended.get()


def refresh_artist_credit_matches(artist_ids: Iterable[int]) -> int:
    """Refresh every relationship that involves one or more changed artists.

    The query used for each followed artist deliberately reuses the existing
    PostgreSQL complete-phrase lookup. This makes materialized rows behave the
    same way as the former request-time query, including case-equivalent and
    possessive/collaboration credits.
    """

    changed_ids = set(artist_ids)
    if not changed_ids:
        return 0

    all_artists = list(Artist.objects.only("id", "name").order_by("id"))
    if not all_artists:
        return 0

    ArtistCreditMatch.objects.filter(
        Q(followed_artist_id__in=changed_ids)
        | Q(credited_artist_id__in=changed_ids)
    ).delete()

    matches: list[ArtistCreditMatch] = []
    created = 0

    def save_matches():
        nonlocal created, matches
        if not matches:
            return
        ArtistCreditMatch.objects.bulk_create(matches, ignore_conflicts=True)
        created += len(matches)
        matches = []

    for followed_artist in all_artists:
        if not followed_artist.name.strip():
            continue
        credits = Artist.objects.filter(
            name__iregex=artist_name_phrase_regex(followed_artist.name)
        ).only("id")
        if followed_artist.id not in changed_ids:
            credits = credits.filter(id__in=changed_ids)

        matches.extend(
            ArtistCreditMatch(
                followed_artist_id=followed_artist.id,
                credited_artist_id=credited_artist.id,
            )
            for credited_artist in credits.iterator()
        )
        if len(matches) >= 1_000:
            save_matches()

    save_matches()
    return created
