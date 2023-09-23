import re
from datetime import datetime
import requests

from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import Count, F, Q, QuerySet
from gfys.models import Account, Gfy, Tag
from result import Result
from result.result import as_result
from bs4 import BeautifulSoup as bs

PAGE_SIZE = 50
IMGUR_RE = re.compile(r"https?://(?:(?:www\.)|(?:i\.))?imgur\.com/([^\.^ ^/]+)")
IMGUR_A_RE = re.compile(r"https?://(?:(?:www\.)|(?:i\.))?imgur\.com/a/([^\.^ ^/]+)")


def format_gfys(
    gfys: QuerySet[Gfy], page_number: int | str | None = None
) -> dict | None:
    paginator = Paginator(gfys, PAGE_SIZE)
    if page_number is None:
        page_number = 1
    if page_number == "None":
        return None
    page_number = int(page_number)
    if page_number < 1:
        page_number = 1
    elif page_number > paginator.num_pages:
        page_number = paginator.num_pages
    page = paginator.page(page_number)
    gfys = [gfy for gfy in page]  # type: ignore
    prev = page.previous_page_number() if page.has_previous() else None
    next_ = page.next_page_number() if page.has_next() else None
    prev_jump = page.previous_page_number() - 3 if prev else None
    if prev_jump and prev_jump < 1:
        prev_jump = None
    next_jump = page.next_page_number() + 3 if next_ else None
    if next_jump and next_jump > paginator.num_pages:
        next_jump = None
    page = {
        "current": page.number,
        "previous": prev,
        "next": next_,
        "previous_jump": prev_jump,
        "next_jump": next_jump,
        "first": 1 if page.number != 1 else None,
        "last": paginator.num_pages
        if page.number != paginator.num_pages
        else None,
        "total": paginator.num_pages,
    }
    return {
        "gfys": gfys,
        "page": page,
    }


def filter_gfys(
    title: str, tags: str, start_date: str, end_date: str, account: str
) -> QuerySet[Gfy]:
    title = title.strip().lower()
    tags = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]  # type: ignore
    filters = list()
    if title:
        filters.append(Q(imgur_title__icontains=title))
    start_date, end_date = valid_date(start_date.strip()), valid_date(end_date.strip())  # type: ignore
    if start_date:
        filters.append(Q(date__gte=start_date))
    if end_date:
        filters.append(Q(date__lte=end_date))
    if account:
        filters.append(Q(account__name__iexact=account))
    if filters or tags:
        if not tags:
            return (
                Gfy.objects.filter(*filters)
                .prefetch_related("tags")
                .order_by(F("date").desc(nulls_last=True), "-id")
            )
        else:
            results = (
                Gfy.objects.filter(*filters)
                .filter(tags__name__in=tags)
                .annotate(num_tags=Count("tags"))
                .filter(num_tags=len(tags))
                .prefetch_related("tags")
                .order_by(F("date").desc(nulls_last=True), "-id")
            )
            return results

    return (
        Gfy.objects.all()
        .prefetch_related("tags")
        .order_by(F("date").desc(nulls_last=True), "-id")
    )


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
    return gfy.imgur_mp4_url

def fetch_imgur_title(url:str) -> str | None:
    match = IMGUR_RE.match(url)
    if not match:
        return ""
    imgur_id = match.group(1)
    url = f"https://imgur.com/{imgur_id}"
    text = requests.get(url).text
    soup = bs(text, "lxml")
    title = soup.select("meta[name='twitter:title']")
    if title:
        title = title.pop()['content']
        if title == "imgur.com":
            title = ""
    return title or ""

def imgur_id_from_url(url:str) -> str | None:
    match = IMGUR_A_RE.match(url)
    if match:
        text = requests.get(url).text
        soup = bs(text, "lxml")
        mp4_tag = soup.select("meta[name='twitter:player:stream']")
        if mp4_tag:
            url = mp4_tag.pop()['content']
        else:
            return None
    match = IMGUR_RE.match(url)
    if not match:
        return None
    return match.group(1)
