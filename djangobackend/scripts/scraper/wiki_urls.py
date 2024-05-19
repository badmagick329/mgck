import pendulum


class WikiUrls:
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
    reddit_wiki_base = (
        "https://www.reddit.com/r/kpop/wiki/upcoming-releases/{year}/{month}/"
    )
    urls: list[str]

    def __init__(self) -> None:
        self.urls = list()

    def generate_urls(
        self, next_month_and_year: tuple[str, int] | None = None
    ) -> None:
        """
        Generate urls to scrape from january 2018 to next month (inclusive)

        Examples:
        - next_month_and_year = ("february", 2018)
            Returns:
            list of 2 urls

        - next_month_and_year = None
            Returns:
            list of urls upto and including next month
        """
        stop_month, stop_year = (
            next_month_and_year or self.next_month_and_year()
        )
        years = [y for y in range(2018, stop_year + 2)]

        urls = []
        for year in years:
            for month in self.month_strings:
                if year == stop_year and month == stop_month:
                    urls.append(
                        self.reddit_wiki_base.format(year=year, month=month)
                    )
                    self.urls = urls
                    return
                urls.append(
                    self.reddit_wiki_base.format(year=year, month=month)
                )
        raise ValueError("Error generating urls.")

    def next_month_and_year(self) -> tuple[str, int]:
        idx = pendulum.now().month
        if idx == len(self.month_strings):
            return self.month_strings[0], pendulum.now().year + 1
        return self.month_strings[idx], pendulum.now().year
