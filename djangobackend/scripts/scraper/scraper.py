#!/usr/bin/env python3
import json
import logging
import os
import sys
from copy import deepcopy
from datetime import datetime as dt
from pathlib import Path

import pendulum
import praw
from praw import Reddit

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"

import django

django.setup()
from kpopcomebacks.models import Artist, Release, ReleaseType
from scripts.scraper.kpop_data_from_subreddit import KpopDataFromSubreddit
from scripts.scraper.logger import get_stream_logger
from scripts.scraper.parsed_html import ParsedHTML
from scripts.scraper.release_data import ReleaseData
from scripts.scraper.release_youtube_urls import ReleaseYoutubeUrls
from scripts.scraper.wiki_urls import WikiUrls

from djangobackend.settings import REDDIT_AGENT, REDDIT_ID, REDDIT_SECRET

LOG_LEVEL = logging.DEBUG


class Scraper:
    subreddit_data: KpopDataFromSubreddit
    updating: bool
    wiki_urls: WikiUrls
    reddit: Reddit

    def __init__(self, log_level: int | None = None) -> None:
        self.logger = get_stream_logger(log_level)
        self.reddit = praw.Reddit(
            client_id=REDDIT_ID,
            client_secret=REDDIT_SECRET,
            user_agent=REDDIT_AGENT,
        )
        self.subreddit_data = KpopDataFromSubreddit(
            self.reddit, log_level=log_level
        )
        self.wiki_urls = WikiUrls()
        self.updating = False

    def get_recent_urls(self):
        self.wiki_urls.generate_urls()
        return self.wiki_urls.urls[-3:]

    def scrape(self):
        urls = self.get_recent_urls()
        saved_releases = self.get_saved_releases()
        merged_releases = list()
        new_releases = list()
        for url in urls:
            try:
                release_data_from_url = [
                    r.to_dict() for r in self.process_url(url)
                ]
                release_youtube_urls = ReleaseYoutubeUrls(
                    self.reddit,
                    saved_releases,
                    release_data_from_url,
                    self.logger,
                )
                release_youtube_urls.extract()
                if release_youtube_urls.releases:
                    new_releases.extend(release_youtube_urls.releases)
            except Exception as e:
                self.logger.error(f"Error scraping {url}\n{e}")
                return
            try:
                self.logger.debug(
                    f"Merging {len(new_releases)} releases with {len(saved_releases)} releases"
                )
                self.logger.debug("About to merge releases")
                merged = self._merge_releases(saved_releases, new_releases)
                for merged_release in merged:
                    if merged_release not in merged_releases:
                        merged_releases.append(merged_release)

                self.logger.debug(f"Merged {len(merged)} releases")
            except Exception as e:
                self.logger.error(f"Error merging\n{e}")
                return
        self.updating = True
        try:
            self.save_to_db(merged_releases)  # type: ignore
        except Exception as e:
            self.logger.error(f"Error saving {e}", exc_info=e, stack_info=True)
            self.updating = False
            return
        self.updating = False
        self.logger.info("Update complete")

    def _merge_releases(
        self, old_releases: list[dict], new_releases: list[dict]
    ) -> list[dict]:
        """
        Merge new_releases into old_releases.
        All old_release dates that are in new_releases are replaced with new_releases
        """
        old_releases = deepcopy(old_releases)
        old_releases = sorted(old_releases, key=lambda x: x["release_date"])
        remove_dates = list(set([cb["release_date"] for cb in new_releases]))
        merged_cbs = [
            c for c in old_releases if c["release_date"] not in remove_dates
        ]
        merged_cbs.extend(new_releases)
        return merged_cbs

    @staticmethod
    def get_saved_releases(recent: bool = True) -> list[dict[str, str]]:
        if recent:
            start_date = pendulum.now().subtract(months=2).date()
            releases = Release.objects.filter(
                release_date__gte=start_date
            ).prefetch_related("release_type", "artist")
        else:
            releases = Release.objects.all().prefetch_related(
                "release_type", "artist"
            )
        return [
            ReleaseData.from_release(release).to_dict() for release in releases
        ]

    def process_url(self, url: str) -> list[ReleaseData]:
        try:
            self.logger.info(f"Scraping {url}")
            wiki_page = self.subreddit_data.read_url(url)
            assert wiki_page is not None, f"Wiki page is None for {url}"
            html = wiki_page.content_html
            assert isinstance(html, str), f"Wiki page content is not a string"
            parsed_html = ParsedHTML(html, url)
            release_list = parsed_html.release_list()
            return release_list
        except Exception as e:
            self.logger.error(f"Error scraping {url}\n{e}")
            return []

    @staticmethod
    def save_to_db(releases: list[dict]):
        update_releases = list()
        create_releases = list()
        BATCH = 500
        remove_dates = [
            release["release_date"]
            for release in releases
            if release["id"] is None
        ]
        remove_dates = list(set(remove_dates))
        remove_dates = [
            dt.strptime(date, "%Y-%m-%d").date() for date in remove_dates
        ]
        Release.objects.filter(release_date__in=remove_dates).delete()
        artist_names = list(set([release["artist"] for release in releases]))
        release_types_names = list(
            set([release["release_type"] for release in releases])
        )
        saved_artists = Artist.objects.filter(name__in=artist_names)
        saved_release_types = ReleaseType.objects.filter(
            name__in=release_types_names
        )
        artist_names_map = {artist.name: artist for artist in saved_artists}
        release_types_names_map = {
            release_type.name: release_type
            for release_type in saved_release_types
        }
        for release in releases:
            if (
                release["id"] is None
                or release["release_date"] in remove_dates
            ):
                if release["artist"] not in artist_names_map:
                    artist = Artist(name=release["artist"])
                    artist_names_map[release["artist"]] = artist
                    artist.save()
                else:
                    artist = artist_names_map[release["artist"]]
                if release["release_type"] not in release_types_names_map:
                    release_type = ReleaseType(name=release["release_type"])
                    release_types_names_map[release["release_type"]] = (
                        release_type
                    )
                    release_type.save()
                else:
                    release_type = release_types_names_map[
                        release["release_type"]
                    ]
                release = Release(
                    artist=artist,
                    title=release["title"],
                    album=release["album"],
                    release_type=release_type,
                    release_date=release["release_date"],
                    reddit_urls=release["reddit_urls"],
                    urls=release["urls"],
                )
                create_releases.append(release)
                if len(create_releases) == BATCH:
                    Release.objects.bulk_create(create_releases)
                    create_releases = list()
            else:
                print(f"Updating release {release['id']}\n{release}\n")
                release = Release.objects.get(id=release["id"])
                release.reddit_urls = release["reddit_urls"]  # type: ignore
                release.urls = release["urls"] if release["urls"] else release.urls  # type: ignore
                update_releases.append(release)
                if len(update_releases) == BATCH:
                    Release.objects.bulk_update(
                        update_releases, fields=["reddit_urls", "urls"]
                    )
                    update_releases = list()
        if len(create_releases) > 0:
            Release.objects.bulk_create(create_releases)
        if len(update_releases) > 0:
            Release.objects.bulk_update(
                update_releases, fields=["reddit_urls", "urls"]
            )


def main():
    retries = 2
    while retries > 0:
        try:
            scraper = Scraper(LOG_LEVEL)
            scraper.scrape()
            break
        except Exception as e:
            retries -= 1
            if retries == 0:
                raise e


if __name__ == "__main__":
    main()
