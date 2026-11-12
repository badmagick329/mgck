import logging
from unittest.mock import Mock

from prawcore.exceptions import NotFound, ServerError
from scripts.scraper.fetched_releases import FetchedReleasesFromSubreddit
from scripts.scraper.scraper import Scraper

WIKI = "https://www.reddit.com/r/kpop/wiki/upcoming-releases/2026/{}/"
OCTOBER, NOVEMBER, DECEMBER = (
    WIKI.format(month) for month in ("october", "november", "december")
)

PAGE = """
    <table><tbody><tr>
        <td>12th</td><td>6PM</td><td>Haon</td><td></td><td></td>
        <td><a href="https://youtu.be/example">Teaser</a></td><td></td>
    </tr></tbody></table>
"""


class WikiPage:
    def __init__(self, content):
        self._content = content

    @property
    def content_html(self):
        if isinstance(self._content, Exception):
            raise self._content
        return self._content


class FakeReddit:
    """Serves wiki pages by month; a month mapped to an exception raises it."""

    def __init__(self, pages):
        self._pages = pages

    def subreddit(self, name):
        wiki = {
            f"upcoming-releases/2026/{month}": WikiPage(content)
            for month, content in self._pages.items()
        }
        return Mock(wiki=wiki)


class Writer:
    def __init__(self, fail_on_call=None):
        self.saved = []
        self._fail_on_call = fail_on_call

    def save_to_db(self, releases):
        self.saved.append(releases)
        if len(self.saved) == self._fail_on_call:
            raise RuntimeError("Injected save failure")


def http_error(error_type, status_code):
    return error_type(Mock(status_code=status_code))


def scrape(pages, urls, writer):
    reddit = FakeReddit(pages)
    logger = logging.getLogger("scraper-tests")
    reader = Mock(get_recent_saved_releases=Mock(return_value=[]))
    scraper = Scraper(
        reddit,  # type: ignore[arg-type]
        FetchedReleasesFromSubreddit(reddit, logger),  # type: ignore[arg-type]
        reader,
        writer,
        logger,
    )
    return scraper.scrape(urls)


def test_missing_wiki_page_is_skipped_without_failing_the_run():
    writer = Writer()
    succeeded = scrape(
        {"november": PAGE, "december": http_error(NotFound, 404)},
        [NOVEMBER, DECEMBER],
        writer,
    )
    assert succeeded is True
    assert [[r.artist for r in saved] for saved in writer.saved] == [["Haon"]]


def test_save_error_fails_the_run_but_later_months_are_still_saved():
    writer = Writer(fail_on_call=1)
    succeeded = scrape(
        {"october": PAGE, "november": PAGE}, [OCTOBER, NOVEMBER], writer
    )
    assert succeeded is False
    assert len(writer.saved) == 2


def test_fetch_error_other_than_not_found_fails_the_run():
    writer = Writer()
    succeeded = scrape(
        {"october": http_error(ServerError, 500), "november": PAGE},
        [OCTOBER, NOVEMBER],
        writer,
    )
    assert succeeded is False
    assert [[r.artist for r in saved] for saved in writer.saved] == [["Haon"]]
