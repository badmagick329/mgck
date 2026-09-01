from unittest.mock import Mock

from scripts.scraper.release_data import ReleaseData
from scripts.scraper.release_youtube_urls import ReleaseYoutubeUrls


def make_release(*, urls: list[str] | None) -> ReleaseData:
    return ReleaseData(
        release_date="2026-08-18",
        artist="IHWAK",
        title="I PROMISE YOU THAT SEVEN KINDS",
        album="I PROMISE YOU THAT SEVEN KINDS",
        release_type="Single",
        reddit_urls=["https://www.youtube.com/watch?v=5Ss8Hv7jf_Q"],
        urls=urls,
    )


def test_extract_keeps_release_when_reusing_saved_youtube_urls():
    saved_release = make_release(
        urls=["https://www.youtube.com/watch?v=5Ss8Hv7jf_Q"]
    )
    scraped_release = make_release(urls=None)
    extractor = ReleaseYoutubeUrls(
        reddit=Mock(),
        saved_releases=[saved_release],
        new_releases=[scraped_release],
        logger=Mock(),
    )

    extractor.extract()

    assert extractor.releases == [scraped_release]
    assert scraped_release.urls == saved_release.urls


def test_extract_keeps_release_that_does_not_need_url_processing():
    scraped_release = make_release(
        urls=["https://www.youtube.com/watch?v=5Ss8Hv7jf_Q"]
    )
    extractor = ReleaseYoutubeUrls(
        reddit=Mock(),
        saved_releases=[],
        new_releases=[scraped_release],
        logger=Mock(),
    )

    extractor.extract()

    assert extractor.releases == [scraped_release]
