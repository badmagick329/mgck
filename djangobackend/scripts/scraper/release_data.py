from dataclasses import dataclass
from datetime import datetime as dt

import pendulum
from kpopcomebacks.models import Artist, Release, ReleaseType


@dataclass
class ReleaseData:
    release_date: str | dt
    artist: str
    title: str
    album: str
    release_type: str
    reddit_urls: list[str]
    urls: list[str] | None
    id: int | None = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "release_date": self.release_date,
            "artist": self.artist,
            "title": self.title,
            "album": self.album,
            "release_type": self.release_type,
            "reddit_urls": self.reddit_urls,
            "urls": self.urls,
        }

    @staticmethod
    def from_dict(data: dict) -> "ReleaseData":
        return ReleaseData(
            id=data["id"],
            release_date=data["release_date"],
            artist=data["artist"],
            title=data["title"],
            album=data["album"],
            release_type=data["release_type"],
            reddit_urls=data["reddit_urls"],
            urls=data["urls"],
        )

    def to_release(self) -> Release:
        artist, _ = Artist.objects.get_or_create(name=self.artist)
        release_type, _ = ReleaseType.objects.get_or_create(
            name=self.release_type
        )
        assert isinstance(
            self.release_date, str
        ), "Error creating Release from ReleaseData: release_date is not a string."
        return Release(
            id=self.id,
            artist=artist,
            album=self.album,
            title=self.title,
            release_date=pendulum.from_format(
                self.release_date, "YYYY-MM-DD", tz="Asia/Seoul"
            ),
            release_type=release_type,
            reddit_urls=self.reddit_urls,
            urls=self.urls,
        )

    @staticmethod
    def from_release(release: Release) -> "ReleaseData":
        # assert isinstance(
        #     release.release_date, _Date
        # ), "Error creating ReleaseData from Release: release_date is not a datetime object."
        return ReleaseData(
            id=release.id,  # type: ignore
            release_date=dt.strftime(release.release_date, "%Y-%m-%d"),  # type: ignore
            artist=release.artist.name,
            title=release.title,
            album=release.album,
            release_type=release.release_type.name,
            reddit_urls=release.reddit_urls or [],
            urls=release.urls,
        )
