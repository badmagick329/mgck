import logging

from praw import Reddit
from prawcore.exceptions import BadRequest

from .release_data import ReleaseData


class ReleaseYoutubeUrls:
    _saved_releases: list[dict]
    _new_releases: list[dict]
    _logger: logging.Logger
    _reddit: Reddit
    releases: list[dict]

    def __init__(
        self,
        reddit: Reddit,
        saved_releases: list[dict],
        new_releases: list[dict],
        logger: logging.Logger,
    ) -> None:
        self._saved_releases = saved_releases
        self._new_releases = new_releases
        self._logger = logger
        self._reddit = reddit
        self.releases = list()

    def extract(self) -> None:
        try:
            for release in self._new_releases:
                if self._url_is_updated(release):
                    self._logger.debug(
                        "Skipping releases with no urls found or not update required"
                    )
                    continue

                saved_releases = self._in_saved_releases(release)
                if saved_releases and saved_releases["urls"]:
                    self._logger.debug(
                        f"Using saved youtube urls {saved_releases['urls']}"
                    )
                    release["urls"] = saved_releases["urls"]
                    continue

                self._process_reddit_urls(release)
        except Exception as e:
            self._logger.error(
                f"Error extracting youtube urls: {e}",
                exc_info=e,
                stack_info=True,
            )

    def _process_reddit_urls(self, release: dict):
        youtube_urls = list()
        invalid_urls = list()
        for reddit_url in release["reddit_urls"]:
            if "youtube" in reddit_url or "youtu.be" in reddit_url:
                self._logger.debug(
                    f"Found youtube url in reddit_url: {reddit_url}"
                )
                youtube_urls.append(reddit_url)
                continue
            post_id = _url_to_id(reddit_url)
            try:
                post = self._reddit.submission(post_id)
            except BadRequest as e:
                self._logger.info(f"Invalid reddit url: {reddit_url}")
                invalid_urls.append(reddit_url)
                continue
            self._logger.debug(f"Found youtube url in reddit post: {post.url}")
            youtube_urls.append(post.url)
        release["reddit_urls"] = [
            url for url in release["reddit_urls"] if url not in invalid_urls
        ]
        self._logger.debug(f"Youtube urls found: {youtube_urls}")
        release["urls"] = youtube_urls
        self.releases.append(release)

    def _in_saved_releases(self, release: dict) -> dict | None:
        for saved_cb in self._saved_releases:
            if _release_dicts_eq(release, saved_cb):
                return saved_cb

    def _url_is_updated(self, release: dict) -> bool:
        has_reddit_urls = len(release["reddit_urls"]) > 0
        urls_is_empty = release["urls"] is None or len(release["urls"]) == 0
        urls_need_updating = urls_is_empty and has_reddit_urls

        return release["urls"] is not None and not urls_need_updating


def _url_to_id(url: str):
    if "comments" in url:
        return url.split("comments/")[-1].split("/")[0]
    else:
        return url.replace("/", "")


def _release_dicts_eq(r1: dict, r2: dict) -> bool:
    return (
        r1["release_date"] == r2["release_date"]
        and r1["artist"] == r2["artist"]
        and r1["title"] == r2["title"]
        and r1["album"] == r2["album"]
        and r1["release_type"] == r2["release_type"]
        and r1["reddit_urls"] == r2["reddit_urls"]
    )
