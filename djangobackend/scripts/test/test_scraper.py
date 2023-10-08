import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from scripts.scraper import Scraper


def test_scraper_init():
    scraper = Scraper()
    assert scraper is not None


def test_generate_urls_len():
    scraper = Scraper()
    urls = scraper.generate_urls(("february", 2018))
    assert len(urls) == 2
    urls = scraper.generate_urls(("january", 2019))
    assert len(urls) == 13


def test_generate_urls_string():
    scraper = Scraper()
    urls = scraper.generate_urls(("january", 2019))
    assert urls[-1] == scraper.reddit_wiki_base.format(
        month="january", year=2019
    )
    assert urls[-2] == scraper.reddit_wiki_base.format(
        month="december", year=2018
    )
    assert urls[-3] == scraper.reddit_wiki_base.format(
        month="november", year=2018
    )
