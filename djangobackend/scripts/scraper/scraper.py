#!/usr/bin/env python3
import logging
import os
import sys
from pathlib import Path

import praw
from praw import Reddit
from prawcore.exceptions import NotFound

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

    def scrape(self, urls: list[str] | None = None) -> bool:
        """
        Scrape and save each URL, returning False if any of them failed.

        One bad month must not block the others, but its failure has to reach
        the exit status: the scheduler only sees a failed run as non-zero.
        """
        if not urls:
            urls = self._get_recent_urls()
        succeeded = True
        for url in urls:
            saved_releases = self._db_reader.get_recent_saved_releases()
            try:
                merged_releases = self._fetch_releases_from_url(
                    url, saved_releases
                )
                self._update_db(merged_releases)
            except NotFound:
                # Recent URLs include next month, whose page often does not
                # exist yet. That is normal, not a failed run.
                self._logger.warning(f"No wiki page at {url}, skipping")
            except Exception as e:
                self._logger.error(f"Error scraping {url}\n{e}", exc_info=e)
                succeeded = False
        return succeeded

    def _get_recent_urls(self):
        self._wiki_urls.generate_urls()
        return self._wiki_urls.urls[-3:]

    def _fetch_releases_from_url(
        self, url: str, saved_releases: list[ReleaseData]
    ) -> list[ReleaseData]:
        # Errors propagate to scrape(), which records the run as failed.
        new_releases = self._fetch_release_data_from_url(url, saved_releases)
        merged_releases = []
        self._merge_releases(saved_releases, new_releases, merged_releases)

        return merged_releases

    def _parse_html(self, url: str) -> list[ReleaseData]:
        self._logger.info(f"Scraping {url}")
        self._fetched_releases.read_url(url)
        html = self._fetched_releases.html
        assert isinstance(html, str), f"Wiki page content is not a string"
        parsed_html = ParsedHTML(html, url)
        release_list = parsed_html.release_list()
        release_list.sort(key=lambda r: r.release_date)
        return release_list

    def _fetch_release_data_from_url(
        self, url: str, saved_releases: list[ReleaseData]
    ) -> list[ReleaseData]:
        release_youtube_urls = ReleaseYoutubeUrls(
            self._reddit,
            saved_releases,
            self._parse_html(url),
            self._logger,
        )
        release_youtube_urls.extract()
        return release_youtube_urls.releases

    def _merge_releases(
        self,
        saved_releases: list[ReleaseData],
        new_releases: list[ReleaseData],
        merged_releases: list[ReleaseData],
    ) -> None:
        newly_merged = self._create_merged_releases(
            saved_releases, new_releases
        )
        for merged_release in newly_merged:
            if merged_release not in merged_releases:
                merged_releases.append(merged_release)

        self._logger.debug(f"Merged {len(newly_merged)} releases")

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
        self._db_writer.save_to_db(releases)
        self._logger.info("Update complete")


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
    succeeded = False
    while retries > 0:
        try:
            scraper = Scraper(reddit, fetched_releases, db, db, logger)
            succeeded = scraper.scrape(urls)
            break
        except Exception as e:
            retries -= 1
            if retries == 0:
                raise e
    # The scheduler marks a run failed only on a non-zero exit.
    if not succeeded:
        sys.exit(1)


if __name__ == "__main__":
    main()
