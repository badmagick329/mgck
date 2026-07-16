from datetime import date, timedelta
import json
from uuid import uuid4

import pytest
from django.test import Client
from django.utils import timezone
from kpopcomebacks.models import Artist, Release, ReleaseType

KPOP_URL = "/api/kpopcomebacks"
WATCHLIST_QUERY_URL = "/api/kpopcomebacks/query"
ARTIST_SEARCH_URL = "/api/kpopcomebacks/artists"


def create_release(
    artist: Artist,
    title: str,
    release_date: date,
) -> Release:
    release_type, _ = ReleaseType.objects.get_or_create(name="Single")
    return Release.objects.create(
        artist=artist,
        title=title,
        album=f"{title} Album",
        release_date=release_date,
        release_type=release_type,
        urls=[],
    )


@pytest.fixture
def api_client():
    return Client()


def post_json(api_client: Client, payload: dict):
    return api_client.post(
        WATCHLIST_QUERY_URL,
        data=json.dumps(payload),
        content_type="application/json",
    )


@pytest.mark.django_db
def test_artist_public_id_is_stable_when_artist_name_changes():
    artist = Artist.objects.create(name="Original Name")
    original_public_id = artist.public_id

    artist.name = "Renamed Artist"
    artist.save()
    artist.refresh_from_db()

    assert artist.public_id == original_public_id


@pytest.mark.django_db
def test_kpop_get_includes_artist_public_id(api_client):
    artist = Artist.objects.create(name="Artist")
    create_release(artist, "Release", date(2026, 7, 16))

    response = api_client.get(KPOP_URL, {"page_size": 10})

    assert response.status_code == 200
    assert response.json()["results"][0]["artist"] == "Artist"
    assert response.json()["results"][0]["artist_public_id"] == str(
        artist.public_id
    )


@pytest.mark.django_db
def test_watchlist_query_returns_matching_artists_in_stable_order(api_client):
    first_artist = Artist.objects.create(name="First")
    second_artist = Artist.objects.create(name="Second")
    ignored_artist = Artist.objects.create(name="Ignored")
    first_release = create_release(first_artist, "First Release", date(2026, 7, 16))
    second_release = create_release(
        second_artist,
        "Second Release",
        date(2026, 7, 16),
    )
    create_release(ignored_artist, "Ignored Release", date(2026, 7, 16))

    response = post_json(
        api_client,
        {
            "artist_public_ids": [
                str(second_artist.public_id),
                str(first_artist.public_id),
                str(second_artist.public_id),
            ],
            "page_size": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["count"] == 2
    assert response.json()["total_pages"] == 2
    assert response.json()["previous"] is None
    assert response.json()["next"] is None
    assert response.json()["results"][0]["id"] == first_release.id

    second_page = post_json(
        api_client,
        {
            "artist_public_ids": [str(first_artist.public_id), str(second_artist.public_id)],
            "page": 2,
            "page_size": 1,
        },
    )

    assert second_page.status_code == 200
    assert second_page.json()["results"][0]["id"] == second_release.id


@pytest.mark.django_db
def test_watchlist_query_supports_empty_unknown_and_date_filtered_lists(api_client):
    artist = Artist.objects.create(name="Artist")
    create_release(artist, "Earlier", date(2026, 7, 15))
    later_release = create_release(artist, "Later", date(2026, 7, 17))

    empty_response = post_json(api_client, {"artist_public_ids": []})
    assert empty_response.status_code == 200
    assert empty_response.json()["count"] == 0
    assert empty_response.json()["results"] == []

    response = post_json(
        api_client,
        {
            "artist_public_ids": [str(artist.public_id), str(uuid4())],
            "start_date": "2026-07-16",
            "end_date": "2026-07-17",
        },
    )

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["id"] == later_release.id


@pytest.mark.django_db
def test_watchlist_query_includes_case_equivalent_artist_records(api_client):
    canonical_artist = Artist.objects.create(name="ITZY")
    duplicate_artist = Artist.objects.create(name="itzy")
    canonical_release = create_release(
        canonical_artist,
        "Canonical Release",
        date(2026, 7, 16),
    )
    duplicate_release = create_release(
        duplicate_artist,
        "Duplicate Release",
        date(2026, 7, 17),
    )

    response = post_json(
        api_client,
        {"artist_public_ids": [str(canonical_artist.public_id)]},
    )

    assert response.status_code == 200
    assert [release["id"] for release in response.json()["results"]] == [
        canonical_release.id,
        duplicate_release.id,
    ]


@pytest.mark.django_db
def test_watchlist_query_includes_phrase_matches_but_not_substrings(api_client):
    followed_artist = Artist.objects.create(name="IVE")
    collaboration_artist = Artist.objects.create(name="Rei (IVE) x DEAN")
    possessive_artist = Artist.objects.create(name="IVE's Liz")
    unrelated_artist = Artist.objects.create(name="DIVE")
    another_unrelated_artist = Artist.objects.create(name="FIVE")

    followed_release = create_release(
        followed_artist,
        "IVE Release",
        date(2026, 7, 16),
    )
    collaboration_release = create_release(
        collaboration_artist,
        "Collaboration",
        date(2026, 7, 17),
    )
    possessive_release = create_release(
        possessive_artist,
        "Possessive",
        date(2026, 7, 18),
    )
    create_release(unrelated_artist, "DIVE Release", date(2026, 7, 19))
    create_release(
        another_unrelated_artist,
        "FIVE Release",
        date(2026, 7, 20),
    )

    response = post_json(
        api_client,
        {
            "artist_public_ids": [str(followed_artist.public_id)],
            "page_size": 10,
        },
    )

    assert response.status_code == 200
    assert [release["id"] for release in response.json()["results"]] == [
        followed_release.id,
        collaboration_release.id,
        possessive_release.id,
    ]


@pytest.mark.django_db
def test_watchlist_query_orders_upcoming_before_newest_recent(api_client):
    artist = Artist.objects.create(name="Artist")
    today = timezone.localdate()
    past_release = create_release(artist, "Past", today - timedelta(days=5))
    recent_release = create_release(
        artist,
        "Recent",
        today - timedelta(days=1),
    )
    today_release = create_release(artist, "Today", today)
    future_release = create_release(
        artist,
        "Future",
        today + timedelta(days=3),
    )

    response = post_json(
        api_client,
        {
            "artist_public_ids": [str(artist.public_id)],
            "ordering": "upcoming_first",
            "page_size": 10,
        },
    )

    assert response.status_code == 200
    assert [release["id"] for release in response.json()["results"]] == [
        today_release.id,
        future_release.id,
        recent_release.id,
        past_release.id,
    ]


@pytest.mark.django_db
def test_watchlist_query_orders_newest_recent_before_upcoming_with_pagination(
    api_client,
):
    artist = Artist.objects.create(name="Artist")
    today = timezone.localdate()
    older_release = create_release(artist, "Older", today - timedelta(days=5))
    first_recent_release = create_release(
        artist,
        "First Recent",
        today - timedelta(days=1),
    )
    second_recent_release = create_release(
        artist,
        "Second Recent",
        today - timedelta(days=1),
    )
    today_release = create_release(artist, "Today", today)
    future_release = create_release(
        artist,
        "Future",
        today + timedelta(days=3),
    )

    first_page = post_json(
        api_client,
        {
            "artist_public_ids": [str(artist.public_id)],
            "ordering": "recent_first",
            "page_size": 2,
        },
    )
    second_page = post_json(
        api_client,
        {
            "artist_public_ids": [str(artist.public_id)],
            "ordering": "recent_first",
            "page": 2,
            "page_size": 2,
        },
    )
    third_page = post_json(
        api_client,
        {
            "artist_public_ids": [str(artist.public_id)],
            "ordering": "recent_first",
            "page": 3,
            "page_size": 2,
        },
    )

    assert first_page.status_code == 200
    assert first_page.json()["count"] == 5
    assert [release["id"] for release in first_page.json()["results"]] == [
        first_recent_release.id,
        second_recent_release.id,
    ]
    assert [release["id"] for release in second_page.json()["results"]] == [
        older_release.id,
        today_release.id,
    ]
    assert [release["id"] for release in third_page.json()["results"]] == [
        future_release.id,
    ]


@pytest.mark.django_db
def test_artist_search_is_case_insensitive_limited_and_requires_query(api_client):
    matching_artists = [
        Artist.objects.create(name=f"Red Artist {index:02d}") for index in range(21)
    ]
    Artist.objects.create(name="Unrelated Artist")

    response = api_client.get(ARTIST_SEARCH_URL, {"q": "rEd aRtIsT"})

    assert response.status_code == 200
    assert len(response.json()) == 20
    assert response.json()[0] == {
        "public_id": str(matching_artists[0].public_id),
        "name": "Red Artist 00",
    }

    missing_query_response = api_client.get(ARTIST_SEARCH_URL, {"q": " "})
    assert missing_query_response.status_code == 400


@pytest.mark.django_db
def test_artist_search_collapses_case_equivalent_names(api_client):
    Artist.objects.create(name="ITZY")
    Artist.objects.create(name="itzy")
    Artist.objects.create(name=" ITZY ")

    response = api_client.get(ARTIST_SEARCH_URL, {"q": "itzy"})

    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.django_db
def test_artist_search_ranks_exact_match_and_excludes_substrings(api_client):
    compound_artist = Artist.objects.create(name="Bebe Rexha feat. ITZY")
    Artist.objects.create(name="BLITZY")
    exact_artist = Artist.objects.create(name="ITZY")

    response = api_client.get(ARTIST_SEARCH_URL, {"q": "itzy"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "public_id": str(exact_artist.public_id),
            "name": exact_artist.name,
        },
        {
            "public_id": str(compound_artist.public_id),
            "name": compound_artist.name,
        },
    ]


@pytest.mark.django_db
def test_artist_search_keeps_partial_search_as_a_fallback(api_client):
    artist = Artist.objects.create(name="Red Velvet")

    response = api_client.get(ARTIST_SEARCH_URL, {"q": "red vel"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "public_id": str(artist.public_id),
            "name": artist.name,
        }
    ]



@pytest.mark.django_db
@pytest.mark.parametrize(
    "payload",
    [
        {"artist_public_ids": ["not-a-uuid"]},
        {"artist_public_ids": [str(uuid4()) for _ in range(251)]},
        {"artist_public_ids": [], "page": 0},
        {"artist_public_ids": [], "page": 2},
        {"artist_public_ids": [], "page_size": 101},
        {"artist_public_ids": [], "ordering": "invalid"},
        {
            "artist_public_ids": [],
            "start_date": "2026-07-17",
            "end_date": "2026-07-16",
        },
    ],
)
def test_watchlist_query_rejects_invalid_payloads(api_client, payload):
    response = post_json(api_client, payload)

    assert response.status_code == 400
