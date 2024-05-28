#!/usr/bin/env python3
import logging
import os
import sys
from pathlib import Path

import praw
from praw import Reddit

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"

import django

django.setup()
from datetime import timedelta

from scripts.scraper.database import Database, DatabaseReader, DatabaseWriter
from scripts.scraper.fetched_releases import (
    FetchedReleases,
    FetchedReleasesFromSubreddit,
)
from scripts.scraper.logger import get_stream_logger
from scripts.scraper.parsed_html import ParsedHTML
from scripts.scraper.release_data import ReleaseData
from scripts.scraper.release_youtube_urls import ReleaseYoutubeUrls
from scripts.scraper.wiki_urls import WikiUrls

from djangobackend.settings import REDDIT_AGENT, REDDIT_ID, REDDIT_SECRET

LOG_LEVEL = logging.INFO


class Scraper:
    _wiki_urls: WikiUrls
    _db_reader: DatabaseReader
    _db_writer: DatabaseWriter
    _reddit: Reddit
    _fetched_releases: FetchedReleases
    _logger: logging.Logger

    def __init__(
        self,
        reddit: Reddit,
        fetched_releases: FetchedReleases,
        db_reader: DatabaseReader,
        db_writer: DatabaseWriter,
        logger: logging.Logger,
    ) -> None:
        self._reddit = reddit
        self._fetched_releases = fetched_releases
        self._db_reader = db_reader
        self._db_writer = db_writer
        self._logger = logger
        self._wiki_urls = WikiUrls()

    def scrape(self, urls: list[str] | None = None):
        if not urls:
            urls = self._get_recent_urls()
        saved_releases = self._db_reader.get_recent_saved_releases()
        merged_releases = self._fetch_releases_from_urls(urls, saved_releases)
        self._update_db(merged_releases)

    def _get_recent_urls(self):
        self._wiki_urls.generate_urls()
        return self._wiki_urls.urls[-3:]

    def _fetch_releases_from_urls(
        self, urls: list[str], saved_releases: list[ReleaseData]
    ) -> list[ReleaseData]:
        new_releases = []
        merged_releases = []
        for url in urls:
            is_successful = self._fetch_release_data_from_url(
                url, saved_releases, new_releases
            )
            if not is_successful:
                break
            is_successful = self._merge_releases(
                saved_releases, new_releases, merged_releases
            )
            if not is_successful:
                break
        return merged_releases

    def _parse_html(self, url: str) -> list[ReleaseData]:
        try:
            self._logger.info(f"Scraping {url}")
            self._fetched_releases.read_url(url)
            html = self._fetched_releases.html
            assert isinstance(html, str), f"Wiki page content is not a string"
            parsed_html = ParsedHTML(html, url)
            release_list = parsed_html.release_list()
            release_list.sort(key=lambda r: r.release_date)
            return release_list
        except Exception as e:
            self._logger.error(f"Error scraping {url}\n{e}")
            return []

    def _fetch_release_data_from_url(
        self,
        url: str,
        saved_releases: list[ReleaseData],
        new_releases: list[ReleaseData],
    ) -> bool:
        try:
            release_data_from_url = [r for r in self._parse_html(url)]
            release_youtube_urls = ReleaseYoutubeUrls(
                self._reddit,
                saved_releases,
                release_data_from_url,
                self._logger,
            )
            release_youtube_urls.extract()
            if release_youtube_urls.releases:
                new_releases.extend(release_youtube_urls.releases)
            return True
        except Exception as e:
            self._logger.error(f"Error scraping {url}\n{e}")
            return False

    def _merge_releases(
        self,
        saved_releases: list[ReleaseData],
        new_releases: list[ReleaseData],
        merged_releases: list[ReleaseData],
    ) -> bool:
        try:
            newly_merged = self._create_merged_releases(
                saved_releases, new_releases
            )
            for merged_release in newly_merged:
                if merged_release not in merged_releases:
                    merged_releases.append(merged_release)

            self._logger.debug(f"Merged {len(newly_merged)} releases")
            return True
        except Exception as e:
            self._logger.error(f"Error merging\n{e}")
            return False

    def _create_merged_releases(
        self, old_releases: list[ReleaseData], new_releases: list[ReleaseData]
    ) -> list[ReleaseData]:
        """
        Merge new_releases into old_releases.
        All old_release dates that are in new_releases are replaced with new_releases
        """
        old_releases = sorted(old_releases, key=lambda x: x.release_date)
        remove_dates = list(set([r.release_date for r in new_releases]))
        merged_releases = [
            r for r in old_releases if r.release_date not in remove_dates
        ]
        merged_releases.extend(new_releases)
        return merged_releases

    def _update_db(self, releases: list[ReleaseData]):
        try:
            self._db_writer.save_to_db(releases)
            self._logger.info("Update complete")
        except Exception as e:
            self._logger.error(
                f"Error saving {e}", exc_info=e, stack_info=True
            )
            return


def main():
    import sys

    urls = sys.argv[1:] if len(sys.argv) > 1 else None

    db = Database()
    reddit = praw.Reddit(
        client_id=REDDIT_ID,
        client_secret=REDDIT_SECRET,
        user_agent=REDDIT_AGENT,
    )
    logger = get_stream_logger(LOG_LEVEL)
    fetched_releases = FetchedReleasesFromSubreddit(reddit, logger)
    retries = 2
    while retries > 0:
        try:
            scraper = Scraper(reddit, fetched_releases, db, db, logger)
            scraper.scrape(urls)
            break
        except Exception as e:
            retries -= 1
            if retries == 0:
                raise e


if __name__ == "__main__":
    main()
