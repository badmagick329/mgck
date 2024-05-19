import pendulum
from bs4 import BeautifulSoup as bs

from .release_data import ReleaseData


class ParsedHTML:
    def __init__(self, html: str, url: str) -> None:
        self.html = html
        split = url.split("/")
        assert len(split) >= 3, f"Invalid url: {url}"
        self.month = split[-2]
        self.year = split[-3]

    def release_list(self) -> list[ReleaseData]:
        release_list = list()
        soup = bs(self.html, "lxml")
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
                        f"{day} {self.month.title()} {self.year}",
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
                        if child.name == "a":  # type: ignore
                            reddit_urls.append(child["href"])  # type: ignore
                    continue

            release = self.validated_parsed_data(
                release_date, artist, title, album, release_type, reddit_urls
            )
            release_list.append(release)
        return release_list

    def validated_parsed_data(
        self,
        release_date: str | None,
        artist: str | None,
        title: str | None,
        album: str | None,
        release_type: str | None,
        reddit_urls: list[str],
    ) -> ReleaseData:
        assert (
            title is not None
        ), f"Error parsing title for {self.month} {self.year}. {artist} - {album}"
        assert (
            release_date is not None
        ), f"Error parsing release date for {self.month} {self.year}. {artist} - {title}"
        assert (
            artist is not None
        ), f"Error parsing artist for {self.month} {self.year}. {title}"
        assert (
            album is not None
        ), f"Error parsing album for {self.month} {self.year}. {title}"
        assert (
            release_type is not None
        ), f"Error parsing release type for {self.month} {self.year}. {title}"
        return ReleaseData(
            release_date=release_date,
            artist=artist,
            title=title,
            album=album,
            release_type=release_type,
            reddit_urls=reddit_urls,
            urls=None,
        )
