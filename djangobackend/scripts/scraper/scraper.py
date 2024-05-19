#!/usr/bin/env python3
import logging
import os
import sys
from copy import deepcopy
from pathlib import Path

import praw
from praw import Reddit

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"

import django

django.setup()
from scripts.scraper.database import Database as db
from scripts.scraper.kpop_data_from_subreddit import KpopDataFromSubreddit
from scripts.scraper.logger import get_stream_logger
from scripts.scraper.parsed_html import ParsedHTML
from scripts.scraper.release_data import ReleaseData
from scripts.scraper.release_youtube_urls import ReleaseYoutubeUrls
from scripts.scraper.wiki_urls import WikiUrls

from djangobackend.settings import REDDIT_AGENT, REDDIT_ID, REDDIT_SECRET

LOG_LEVEL = logging.INFO


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

    def scrape(self):
        urls = self._get_recent_urls()
        saved_releases = db.get_saved_releases()
        merged_releases = self._fetch_releases_from_urls(urls, saved_releases)
        self._update_db(merged_releases)

    def _get_recent_urls(self):
        self.wiki_urls.generate_urls()
        return self.wiki_urls.urls[-3:]

    def _fetch_releases_from_urls(
        self, urls: list[str], saved_releases: list[dict]
    ) -> list[dict]:
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

    def _process_url(self, url: str) -> list[ReleaseData]:
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

    def _fetch_release_data_from_url(
        self, url: str, saved_releases: list[dict], new_releases: list[dict]
    ) -> bool:
        try:
            release_data_from_url = [
                r.to_dict() for r in self._process_url(url)
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
            return True
        except Exception as e:
            self.logger.error(f"Error scraping {url}\n{e}")
            return False

    def _merge_releases(
        self,
        saved_releases: list[dict],
        new_releases: list[dict],
        merged_releases: list[dict],
    ) -> bool:
        try:
            merged = self._create_merged_releases(saved_releases, new_releases)
            for merged_release in merged:
                if merged_release not in merged_releases:
                    merged_releases.append(merged_release)

            self.logger.debug(f"Merged {len(merged)} releases")
            return True
        except Exception as e:
            self.logger.error(f"Error merging\n{e}")
            return False

    def _create_merged_releases(
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

    def _update_db(self, releases: list[dict]):
        releases = self._unique_releases(releases)
        self.updating = True
        try:
            db.save_to_db(releases)
            self.updating = False
            self.logger.info("Update complete")
        except Exception as e:
            self.logger.error(f"Error saving {e}", exc_info=e, stack_info=True)
            return
        finally:
            self.updating = False

    @staticmethod
    def _unique_releases(releases: list[dict]) -> list[dict]:
        unique_releases = list()
        for release in releases:
            is_unique = True
            for urelease in unique_releases:
                if ReleaseData.dicts_eq(release, urelease):
                    is_unique = False
                    break
            if is_unique:
                unique_releases.append(release)
        return unique_releases


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
