import random
from datetime import datetime, timedelta
from time import perf_counter

from django.core.paginator import Paginator
from django.db.models import Q
from kpopcomebacks.models import Artist, Release, ReleaseType

random.seed(42)
PAGE_SIZE = 8


def format_comebacks(comebacks: list[Release], page_number: str | None = None) -> dict:
    paginator = Paginator(comebacks, PAGE_SIZE)
    if page_number is None:
        page_number = get_closest_page(paginator)
    page_number = int(page_number)
    if page_number < 1:
        page_number = 1
    elif page_number > paginator.num_pages:
        page_number = paginator.num_pages
    page = paginator.page(page_number)
    comebacks = [cb for cb in page]
    page_numbers = list()
    if page.has_previous():
        page_numbers.append(page.previous_page_number())
    page_numbers.append(page.number)
    if page.has_next():
        page_numbers.append(page.next_page_number())
    if len(page_numbers) < 3 and paginator.num_pages > 2:
        if page_numbers[0] == 1:
            page_numbers.append(3)
        else:
            page_numbers.insert(0, page.previous_page_number() - 1)
    page = {
        "current": page.number,
        "previous": page.previous_page_number() if page.has_previous() else page.number,
        "next": page.next_page_number() if page.has_next() else page.number,
        "total": paginator.num_pages,
        "has_next": page.has_next(),
        "has_previous": page.has_previous(),
        "page_numbers": page_numbers,
    }
    return {
        "comebacks": comebacks,
        "page": page,
    }


def get_closest_page(paginator: Paginator) -> int:
    closest = 1
    today = datetime.today().date()
    while paginator.page(closest).has_next():
        page = paginator.page(closest)
        cbs = [cb for cb in page]
        for cb in cbs:
            if cb.release_date >= today:
                return closest
        closest += 1
    return closest


def filter_comebacks(
    artist: str, title: str, start_date: str, end_date: str
) -> list[Release]:
    artist = artist.strip().lower()
    title = title.strip().lower()
    filters = list()
    if artist:
        filters.append(Q(artist__name__icontains=artist))
    if title:
        filters.append(Q(name__icontains=title))
    if valid_date(start_date.strip()):
        filters.append(Q(release_date__gte=start_date.strip()))
    if valid_date(end_date.strip()):
        filters.append(Q(release_date__lte=end_date.strip()))
    if filters:
        return (
            Release.objects.filter(*filters)
            .prefetch_related("artist", "release_type")
            .order_by("release_date")
        )
    return (
        Release.objects.all()
        .prefetch_related("artist", "release_type")
        .order_by("release_date")
    )


def valid_date(date: str) -> bool:
    try:
        datetime.strptime(date, "%Y-%m-%d")
        return True
    except ValueError:
        return False
