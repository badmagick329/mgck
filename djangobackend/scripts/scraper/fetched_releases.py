import logging
from typing import Protocol

from praw import Reddit


class FetchedReleases(Protocol):
    def read_url(self, url: str) -> None:
        """
        Load the wiki page at url, raising on failure.

        A page that does not exist raises prawcore.exceptions.NotFound so the
        scraper can tell a not-yet-created month from a real failure.
        """
        raise NotImplementedError

    @property
    def html(self) -> str | None:
        raise NotImplementedError


class FetchedReleasesFromSubreddit:
    _reddit: Reddit
    _logger: logging.Logger
    _html: str | None

    def __init__(self, reddit: Reddit, logger: logging.Logger) -> None:
        self._reddit = reddit
        self._logger = logger
        self._html = None

    def read_url(self, url: str) -> None:
        # Errors propagate: swallowing them here hid every failed run.
        self._html = None
        html = self._get_html(self.year(url), self.month(url))
        if not isinstance(html, str):
            raise ValueError(f"Wiki page content is not a string for {url}")
        self._html = html

    def _get_html(self, year: int, month: str) -> str | None:
        subreddit = self._reddit.subreddit("kpop")
        wiki_page = subreddit.wiki[f"upcoming-releases/{year}/{month}"]
        return wiki_page.content_html if wiki_page else None

    @property
    def html(self) -> str | None:
        return self._html

    def month(self, url: str):
        return url.split("/")[-2]

    def year(self, url: str):
        return int(url.split("/")[-3])
