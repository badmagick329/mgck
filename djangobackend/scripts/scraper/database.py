from datetime import datetime as dt
from typing import Protocol

import pendulum
from django.core.exceptions import ValidationError
from django.db import transaction
from kpopcomebacks.artist_credit_matches import (
    refresh_artist_credit_matches,
    suspend_artist_credit_match_refresh,
)
from kpopcomebacks.models import Artist, Release, ReleaseType

from .release_data import ReleaseData


class DatabaseReader(Protocol):
    def get_saved_releases(self) -> list[ReleaseData]:
        raise NotImplementedError

    def get_recent_saved_releases(self) -> list[ReleaseData]:
        raise NotImplementedError


class DatabaseWriter(Protocol):
    def save_to_db(self, releases: list[ReleaseData]):
        raise NotImplementedError


class Database:
    @staticmethod
    def get_saved_releases() -> list[ReleaseData]:
        releases = Release.objects.all().prefetch_related(
            "release_type", "artist"
        )
        return [ReleaseData.from_release(release) for release in releases]

    @staticmethod
    def get_recent_saved_releases() -> list[ReleaseData]:
        start_date = pendulum.now().subtract(months=2).date()
        releases = Release.objects.filter(
            release_date__gte=start_date
        ).prefetch_related("release_type", "artist")
        return [ReleaseData.from_release(release) for release in releases]

    @staticmethod
    @transaction.atomic
    def save_to_db(releases: list[ReleaseData]):
        # Bulk writes bypass model validation. Reject the whole external snapshot
        # before deleting anything, including conflicts within a replacement day.
        _validate_releases(releases)
        update_releases = list()
        create_releases = list()
        BATCH = 500
        remove_dates = [
            release.release_date for release in releases if release.id is None
        ]
        remove_dates_as_string = list(set(remove_dates))
        remove_dates = [
            dt.strptime(date, "%Y-%m-%d").date()
            for date in remove_dates_as_string
        ]
        Release.objects.filter(release_date__in=remove_dates).delete()
        artist_names = list(set([release.artist for release in releases]))
        release_types_names = list(
            set([release.release_type for release in releases])
        )
        saved_artists = Artist.objects.filter(name__in=artist_names)
        saved_release_types = ReleaseType.objects.filter(
            name__in=release_types_names
        )
        artist_name_to_artist_map = {
            artist.name: artist for artist in saved_artists
        }
        release_type_name_to_release_type_map = {
            release_type.name: release_type
            for release_type in saved_release_types
        }
        created_artist_ids: list[int] = []
        with suspend_artist_credit_match_refresh():
            for release in releases:
                release_exists = Release.objects.filter(id=release.id).exists()
                if not release_exists:
                    release_exists = (
                        release.release_date not in remove_dates_as_string
                    )
                if release_exists:
                    release_from_db = Release.objects.get(id=release.id)
                    release_from_db.reddit_urls = release.reddit_urls  # type: ignore
                    release_from_db.urls = (  # type: ignore
                        release.urls if release.urls else release_from_db.urls
                    )
                    release_from_db.spotify_urls = (  # type: ignore
                        release.spotify_urls
                        if release.spotify_urls
                        else release_from_db.spotify_urls
                    )
                    release_from_db.apple_music_urls = (  # type: ignore
                        release.apple_music_urls
                        if release.apple_music_urls
                        else release_from_db.apple_music_urls
                    )
                    update_releases.append(release_from_db)
                    if len(update_releases) == BATCH:
                        Release.objects.bulk_update(
                            update_releases,
                            fields=[
                                "reddit_urls",
                                "urls",
                                "spotify_urls",
                                "apple_music_urls",
                            ],
                        )
                        update_releases = list()
                else:
                    if release.artist not in artist_name_to_artist_map:
                        artist = Artist(name=release.artist)
                        artist_name_to_artist_map[release.artist] = artist
                        artist.save()
                        created_artist_ids.append(artist.id)
                    else:
                        artist = artist_name_to_artist_map[release.artist]
                    if (
                        release.release_type
                        not in release_type_name_to_release_type_map
                    ):
                        release_type = ReleaseType(name=release.release_type)
                        release_type_name_to_release_type_map[
                            release.release_type
                        ] = release_type
                        release_type.save()
                    else:
                        release_type = release_type_name_to_release_type_map[
                            release.release_type
                        ]
                    release = Release(
                        artist=artist,
                        title=release.title,
                        album=release.album,
                        release_type=release_type,
                        release_date=release.release_date,
                        reddit_urls=release.reddit_urls,
                        urls=release.urls,
                        spotify_urls=release.spotify_urls,
                        apple_music_urls=release.apple_music_urls,
                    )
                    create_releases.append(release)
                    if len(create_releases) == BATCH:
                        Release.objects.bulk_create(create_releases)
                        create_releases = list()

        if len(create_releases) > 0:
            Release.objects.bulk_create(create_releases)
        if len(update_releases) > 0:
            Release.objects.bulk_update(
                update_releases,
                fields=[
                    "reddit_urls",
                    "urls",
                    "spotify_urls",
                    "apple_music_urls",
                ],
            )
        # Match refresh must succeed with the replacement, or neither is committed.
        refresh_artist_credit_matches(created_artist_ids)


def _validate_releases(releases: list[ReleaseData]) -> None:
    for release in releases:
        for model, field_name, value in (
            (Artist, "name", release.artist),
            (ReleaseType, "name", release.release_type),
            (Release, "title", release.title),
            (Release, "album", release.album),
        ):
            if not isinstance(value, str):
                raise ValidationError(f"{field_name} must be text")
            # Empty titles/albums occur in the source; enforce persisted length
            # constraints without inventing a new requirement for those cells.
            model._meta.get_field(field_name).run_validators(value)
        if not release.artist.strip() or not release.release_type.strip():
            raise ValidationError("Artist and release type must not be empty")
        if not isinstance(release.release_date, str):
            raise ValidationError("Release date must be an ISO date string")
        parsed_date = Release._meta.get_field("release_date").clean(
            release.release_date, None
        )
        if parsed_date.isoformat() != release.release_date:
            raise ValidationError("Release date must use YYYY-MM-DD")
        for field_name in (
            "reddit_urls",
            "urls",
            "spotify_urls",
            "apple_music_urls",
        ):
            value = getattr(release, field_name)
            if value is None and field_name in ("reddit_urls", "urls"):
                continue
            if not isinstance(value, list) or any(
                not isinstance(url, str) for url in value
            ):
                raise ValidationError(f"{field_name} must be a list of strings")
        if release.id is not None and (
            type(release.id) is not int or release.id <= 0
        ):
            raise ValidationError("Release ID must be a positive integer")

    replacement_dates = {
        release.release_date for release in releases if release.id is None
    }
    replacement_keys = set()
    update_ids = set()
    for release in releases:
        if release.release_date in replacement_dates:
            key = (
                release.artist,
                release.album,
                release.title,
                release.release_date,
                release.release_type,
            )
            if key in replacement_keys:
                raise ValidationError("Duplicate release in replacement snapshot")
            replacement_keys.add(key)
        elif release.id in update_ids:
            raise ValidationError("Duplicate release ID in update snapshot")
        else:
            update_ids.add(release.id)
