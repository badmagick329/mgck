import re
from datetime import datetime

import requests
from bs4 import BeautifulSoup as bs
from django.core.exceptions import ValidationError
from django.db.models import Count, F, Q, QuerySet
from gfys.models import Account, Gfy, Tag
from result import Result
from result.result import as_result

IMGUR_RE = re.compile(
    r"https?://(?:(?:www\.)|(?:i\.))?imgur\.com/([^\.^ ^/]+)"
)
IMGUR_A_RE = re.compile(
    r"https?://(?:(?:www\.)|(?:i\.))?imgur\.com/a/([^\.^ ^/]+)"
)


def filter_gfys(
    title: str,
    tags: str,
    start_date: str,
    end_date: str,
    account: str,
    sort: str = "recent",
) -> QuerySet[Gfy]:
    title = title.strip()
    tag_names = {tag.strip().lower() for tag in tags.split(",") if tag.strip()}
    filters = []
    if title:
        filters.append(Q(imgur_title__icontains=title))
    parsed_start_date = valid_date(start_date.strip())
    parsed_end_date = valid_date(end_date.strip())
    if parsed_start_date:
        filters.append(Q(date__gte=parsed_start_date))
    if parsed_end_date:
        filters.append(Q(date__lte=parsed_end_date))
    if account:
        filters.append(Q(account__name__iexact=account))
    queryset = Gfy.objects.filter(*filters).prefetch_related("tags")
    if tag_names:
        # Joining view counts must not multiply the number of matching tags.
        queryset = (
            queryset.filter(tags__name__in=tag_names)
            .annotate(num_tags=Count("tags", distinct=True))
            .filter(num_tags=len(tag_names))
        )

    queryset = queryset.annotate(view_total=Count("gfyview", distinct=True))
    if sort == "most_viewed":
        return queryset.order_by("-view_total", "-id")
    ordering = (
        (F("date").asc(nulls_last=True), "id")
        if sort == "oldest"
        else (F("date").desc(nulls_last=True), "-id")
    )
    return queryset.order_by(*ordering)


def valid_date(date: str) -> datetime | None:
    try:
        return datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None


@as_result(ValidationError)
def create_gfy(
    title: str, tags: list[str], url: str, account: Account
) -> Result[str, ValidationError]:
    imgur_id = imgur_id_from_url(url)
    if not imgur_id:
        raise ValidationError({"imgur_id": "Invalid imgur URL"})
    gfy = Gfy(imgur_title=title, imgur_id=imgur_id, account=account)
    gfy.full_clean()
    gfy.save()
    for tag in tags:
        t, _ = Tag.objects.get_or_create(name=tag)
        gfy.tags.add(t)
    Gfy.update_date(gfy)
    return gfy.imgur_mp4_url  # type: ignore


def fetch_imgur_title(url: str) -> str | None:
    match = IMGUR_RE.match(url)
    if not match:
        return ""
    imgur_id = match.group(1)
    url = f"https://imgur.com/{imgur_id}"
    text = requests.get(url).text
    soup = bs(text, "lxml")
    title = soup.select("meta[name='twitter:title']")
    if title:
        title = title.pop()["content"]
        if title == "imgur.com":
            title = ""
    return title or ""  # type: ignore


def imgur_id_from_url(url: str) -> str | None:
    match = IMGUR_A_RE.match(url)
    if match:
        text = requests.get(url).text
        soup = bs(text, "lxml")
        mp4_tag = soup.select("meta[name='twitter:player:stream']")
        if mp4_tag:
            url = mp4_tag.pop()["content"]  # type: ignore
        else:
            return None
    match = IMGUR_RE.match(url)
    if not match:
        return None
    return match.group(1)
