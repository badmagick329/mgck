import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"
import json
import logging
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import django
import pendulum
import praw
import requests
from bs4 import BeautifulSoup as bs
from prawcore.exceptions import BadRequest

django.setup()
from kpopcomebacks.models import Artist, Release, ReleaseType

from djangobackend.settings import REDDIT_AGENT, REDDIT_ID, REDDIT_SECRET

LOG_LEVEL = logging.DEBUG
CHECK_NEXT_MONTH = pendulum.now().date().day > 14


@dataclass
class ReleaseData:
    release_date: str
    artist: str
    title: str
    album: str
    release_type: str
    reddit_urls: list[str]
    urls: list[str] | None
    id: int | None = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "release_date": self.release_date,
            "artist": self.artist,
            "title": self.title,
            "album": self.album,
            "release_type": self.release_type,
            "reddit_urls": self.reddit_urls,
            "urls": self.urls,
        }

    @staticmethod
    def from_dict(data: dict) -> "ReleaseData":
        return ReleaseData(
            id=data["id"],
            release_date=data["release_date"],
            artist=data["artist"],
            title=data["title"],
            album=data["album"],
            release_type=data["release_type"],
            reddit_urls=data["reddit_urls"],
            urls=data["urls"],
        )

    def to_release(self) -> Release:
        artist, _ = Artist.objects.get_or_create(name=self.artist)
        release_type, _ = ReleaseType.objects.get_or_create(name=self.release_type)
        return Release(
            id=self.id,
            artist=artist,
            album=self.album,
            title=self.title,
            release_date=pendulum.from_format(
                self.release_date, "YYYY-MM-DD", tz="Asia/Seoul"
            ),
            release_type=release_type,
            reddit_urls=self.reddit_urls,
            urls=self.urls,
        )

    @staticmethod
    def from_release(release: Release) -> "ReleaseData":
        return ReleaseData(
            id=release.id,
            release_date=datetime.strftime(release.release_date, "%Y-%m-%d"),
            artist=release.artist.name,
            title=release.title,
            album=release.album,
            release_type=release.release_type.name,
            reddit_urls=release.reddit_urls,
            urls=release.urls,
        )


class Scraper:
    JSON_FILE = Path(__file__).parent / "scraper_output.json"
    reddit_wiki_base = (
        "https://www.reddit.com/r/kpop/wiki/upcoming-releases/{year}/{month}/"
    )
    month_strings = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:67.0) Gecko/20100101 Firefox/67.0",
        "Accept-Language": "en-US,en;q=0.9,en-GB;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Charset": "utf-8",
        "Referrer": "https://www.google.com/",
    }

    def __init__(self, log_level):
        self.reddit = praw.Reddit(
            client_id=REDDIT_ID,
            client_secret=REDDIT_SECRET,
            user_agent=REDDIT_AGENT,
        )
        log = logging.getLogger(__name__)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        )
        log.addHandler(handler)
        log.setLevel(log_level)
        self.logger = log
        self.updating = False

    def scrape(self, urls: list[str] | None = None, from_json: bool = False):
        if not urls:
            urls = self.generate_urls()
            urls = urls[-2:] if CHECK_NEXT_MONTH else urls[-1:]
        if from_json:
            saved_cbs = self.cbs_from_json(self.JSON_FILE)
        else:
            saved_cbs = self.cbs_from_db()
        for _, url in enumerate(urls):
            try:
                self.logger.info(f"Scraping {url}")
                cbs = self.scrape_url(url)
                new_cbs = [cb.to_dict() for cb in cbs]
                self.logger.info(f"Fetching youtube urls")
                new_cbs = self.extract_youtube_urls(saved_cbs, new_cbs)
            except Exception as e:
                self.logger.error(f"Error scraping {url}\n{e}")
                return
            try:
                self.logger.debug(
                    f"Merging {len(new_cbs)} releases with {len(saved_cbs)} releases"
                )
                merged_cbs = self.merge_cbs(saved_cbs, new_cbs)
            except Exception as e:
                self.logger.error(f"Error merging\n{e}")
                return
        self.updating = True
        try:
            if from_json:
                self.save_to_json(merged_cbs, self.JSON_FILE)  # type: ignore
            else:
                self.save_to_db(merged_cbs)  # type: ignore
        except Exception as e:
            self.logger.error(f"Error saving {e}", exc_info=e, stack_info=True)
            return
        self.updating = False
        self.logger.info("Update complete")

    def scrape_url(self, url: str) -> list[ReleaseData]:
        # For reference
        # table_headers = [
        #     "day",
        #     "time",
        #     "artist",
        #     "album title",
        #     "album type",
        #     "title track",
        #     "streaming",
        # ]
        month = url.split("/")[-2]
        year = int(url.split("/")[-3])
        release_list = list()
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            html = response.text
            release_list = self.get_release_list(html, month, year)
        else:
            self.logger.error(
                f"Error scraping {url}. status_code code: {response.status}"
            )
        return release_list

    def generate_urls(self) -> list[str]:
        """
        Generate urls to scrape from january 2018 to current month (inclusive)
        """
        current_month = self.month_strings[pendulum.now().month - 1]
        years = [y for y in range(2018, pendulum.now().year + 2)]

        urls = []
        current_year = pendulum.now().year
        break_in = 0
        for year in years:
            for month in self.month_strings:
                if year == current_year and month == current_month:
                    break_in = 2 if CHECK_NEXT_MONTH else 1
                urls.append(self.reddit_wiki_base.format(year=year, month=month))
                break_in -= 1
                if break_in == 0:
                    return urls

    def merge_cbs(self, old_cbs: list[dict], new_cbs: list[dict]) -> list[dict]:
        """
        Merge new_cbs into old_cbs. All old_cb dates that are in new_cbs are replaced with new_cbs
        """
        old_cbs = deepcopy(old_cbs)
        old_cbs = sorted(old_cbs, key=lambda x: x["release_date"])
        remove_dates = list(set([cb["release_date"] for cb in new_cbs]))
        merged_cbs = [c for c in old_cbs if c["release_date"] not in remove_dates]
        merged_cbs.extend(new_cbs)
        return merged_cbs

    @staticmethod
    def get_release_list(html: str, month: str, year: str) -> list[ReleaseData]:
        release_list = list()
        soup = bs(html, "lxml")
        rows = soup.select("table")[0].select("tbody")[0].select("tr")
        release_date = None
        day = ""
        for row in rows:
            artist = None
            album = None
            release_type = None
            title = ""
            reddit_urls = list()
            for i, cell in enumerate(row.select("td")):
                if i == 0:
                    if not cell.text:
                        continue
                    day = cell.text
                    day = day[:-2]
                    release_date = pendulum.from_format(
                        f"{day} {month.title()} {year}",
                        "DD MMMM YYYY",
                    )
                    release_date = release_date.to_date_string()
                    continue
                if i == 1:
                    continue
                if i == 2:
                    artist = cell.text
                    continue
                if i == 3:
                    album = cell.text
                    continue
                if i == 4:
                    release_type = cell.text
                    continue
                if i == 5:
                    children = cell.contents
                    title = cell.text
                    for child in children:
                        if child.name == "a":
                            reddit_urls.append(child["href"])
                    continue
            release = ReleaseData(
                release_date=release_date,
                artist=artist,
                title=title,
                album=album,
                release_type=release_type,
                reddit_urls=reddit_urls,
                urls=None,
            )
            release_list.append(release)
        return release_list

    def extract_youtube_urls(
        self, saved_cbs: list[dict], cbs: list[dict]
    ) -> list[dict]:
        """
        Get youtube urls from reddit posts. Return altered cbs
        """

        def url_to_id(url: str):
            if "comments" in url:
                return url.split("comments/")[-1].split("/")[0]
            else:
                return url.replace("/", "")

        def in_saved_cbs(cb: dict) -> dict | None:
            for saved_cb in saved_cbs:
                if self.cb_dicts_eq(cb, saved_cb):
                    return saved_cb

        try:
            for cb in cbs:
                if cb["urls"] is not None and not (
                    len(cb["urls"]) == 0 and len(cb["reddit_urls"]) > 0
                ):
                    self.logger.debug("Skipping cb with with no urls found")
                    continue
                saved_cb = in_saved_cbs(cb)
                if saved_cb and saved_cb["urls"]:
                    self.logger.debug(f"Using saved youtube urls {saved_cb['urls']}")
                    cb["urls"] = saved_cb["urls"]
                    continue
                self.logger.debug(
                    f"Fetching youtube urls for {cb['reddit_urls']}. {cb['urls']=}"
                )
                youtube_urls = list()
                invalid_urls = list()
                for reddit_url in cb["reddit_urls"]:
                    if "youtube" in reddit_url or "youtu.be" in reddit_url:
                        youtube_urls.append(reddit_url)
                        continue
                    post_id = url_to_id(reddit_url)
                    try:
                        post = self.reddit.submission(post_id)
                    except BadRequest as e:
                        self.logger.info(f"Invalid reddit url: {reddit_url}")
                        invalid_urls.append(reddit_url)
                        continue
                    youtube_urls.append(post.url)
                cb["reddit_urls"] = [
                    url for url in cb["reddit_urls"] if url not in invalid_urls
                ]
                cb["urls"] = youtube_urls
            return cbs
        except Exception as e:
            self.logger.error(
                f"Error extracting youtube urls: {e}", exc_info=e, stack_info=True
            )

    @staticmethod
    def cbs_from_json(json_file):
        with open(json_file, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def save_to_json(cbs: list[dict], json_file):
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(cbs, f, indent=4, ensure_ascii=False)

    @staticmethod
    def cbs_from_db(recent: bool = True) -> list[dict[str, str]]:
        if recent:
            start_date = pendulum.now().subtract(months=2).date()
            releases = Release.objects.filter(
                release_date__gte=start_date
            ).prefetch_related("release_type", "artist")
        else:
            releases = Release.objects.all().prefetch_related("release_type", "artist")
        return [ReleaseData.from_release(release).to_dict() for release in releases]

    @staticmethod
    def save_to_db(cbs: list[dict]):
        update_releases = list()
        create_releases = list()
        BATCH = 500
        remove_dates = [cb["release_date"] for cb in cbs if cb["id"] is None]
        remove_dates = list(set(remove_dates))
        remove_dates = [
            datetime.strptime(date, "%Y-%m-%d").date() for date in remove_dates
        ]
        Release.objects.filter(release_date__in=remove_dates).delete()
        artist_names = list(set([cb["artist"] for cb in cbs]))
        release_types_names = list(set([cb["release_type"] for cb in cbs]))
        saved_artists = Artist.objects.filter(name__in=artist_names)
        saved_release_types = ReleaseType.objects.filter(name__in=release_types_names)
        artist_names_map = {artist.name: artist for artist in saved_artists}
        release_types_names_map = {
            release_type.name: release_type for release_type in saved_release_types
        }
        for cb in cbs:
            if cb["id"] is None:
                if cb["artist"] not in artist_names_map:
                    artist = Artist(name=cb["artist"])
                    artist_names_map[cb["artist"]] = artist
                    artist.save()
                else:
                    artist = artist_names_map[cb["artist"]]
                if cb["release_type"] not in release_types_names_map:
                    release_type = ReleaseType(name=cb["release_type"])
                    release_types_names_map[cb["release_type"]] = release_type
                    release_type.save()
                else:
                    release_type = release_types_names_map[cb["release_type"]]
                release = Release(
                    artist=artist,
                    title=cb["title"],
                    album=cb["album"],
                    release_type=release_type,
                    release_date=cb["release_date"],
                    reddit_urls=cb["reddit_urls"],
                    urls=cb["urls"],
                )
                create_releases.append(release)
                if len(create_releases) == BATCH:
                    Release.objects.bulk_create(create_releases)
                    create_releases = list()
            else:
                release = Release.objects.get(id=cb["id"])
                release.reddit_urls = cb["reddit_urls"]
                release.urls = cb["urls"] if cb["urls"] else release.urls
                update_releases.append(release)
                if len(update_releases) == BATCH:
                    Release.objects.bulk_update(
                        update_releases, fields=["reddit_urls", "urls"]
                    )
                    update_releases = list()
        if len(create_releases) > 0:
            Release.objects.bulk_create(create_releases)
        if len(update_releases) > 0:
            Release.objects.bulk_update(update_releases, fields=["reddit_urls", "urls"])

    @staticmethod
    def cb_dicts_eq(cb1: dict, cb2: dict) -> bool:
        return (
            cb1["release_date"] == cb2["release_date"]
            and cb1["artist"] == cb2["artist"]
            and cb1["title"] == cb2["title"]
            and cb1["album"] == cb2["album"]
            and cb1["release_type"] == cb2["release_type"]
            and cb1["reddit_urls"] == cb2["reddit_urls"]
        )


def main():
    scraper = Scraper(LOG_LEVEL)
    scraper.scrape()


if __name__ == "__main__":
    main()
