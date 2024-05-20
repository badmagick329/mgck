from datetime import datetime as dt
from typing import Protocol

import pendulum
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
    def save_to_db(releases: list[ReleaseData]):
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
        for release in releases:
            release_exists = Release.objects.filter(id=release.id).exists()
            if not release_exists:
                print(
                    f"Checking if release with date {release.release_date} "
                    f"exists\n{release}\n{remove_dates_as_string}\n\n"
                )
                release_exists = (
                    release.release_date not in remove_dates_as_string
                )
            if release_exists:
                print(f"Updating release {release.id}\n{release}\n")
                release_from_db = Release.objects.get(id=release.id)
                release_from_db.reddit_urls = release.reddit_urls  # type: ignore
                release_from_db.urls = (  # type: ignore
                    release.urls if release.urls else release_from_db.urls
                )
                update_releases.append(release_from_db)
                if len(update_releases) == BATCH:
                    Release.objects.bulk_update(
                        update_releases, fields=["reddit_urls", "urls"]
                    )
                    update_releases = list()
            else:
                if release.artist not in artist_name_to_artist_map:
                    artist = Artist(name=release.artist)
                    artist_name_to_artist_map[release.artist] = artist
                    artist.save()
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
                )
                create_releases.append(release)
                if len(create_releases) == BATCH:
                    Release.objects.bulk_create(create_releases)
                    create_releases = list()

        if len(create_releases) > 0:
            Release.objects.bulk_create(create_releases)
        if len(update_releases) > 0:
            Release.objects.bulk_update(
                update_releases, fields=["reddit_urls", "urls"]
            )
