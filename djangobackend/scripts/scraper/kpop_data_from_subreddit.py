import logging
import sys

import praw
from praw import Reddit
from praw.models.reddit.wikipage import WikiPage

from .logger import get_stream_logger


class KpopDataFromSubreddit:
    reddit: Reddit
    logger: logging.Logger

    def __init__(
        self,
        reddit: Reddit,
        log_level: int | None = None,
    ) -> None:
        self.logger = get_stream_logger(log_level)
        self.reddit = reddit

    def read_url(self, url: str) -> WikiPage | None:
        month = url.split("/")[-2]
        year = int(url.split("/")[-3])
        try:
            subreddit = self.reddit.subreddit("kpop")
            return subreddit.wiki[f"upcoming-releases/{year}/{month}"]
        except Exception as e:
            self.logger.error(
                f"Error scraping {url}. status_code code: {e}",
                exc_info=e,
                stack_info=True,
            )
            return None
