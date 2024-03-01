from datetime import datetime

from django.core.paginator import Paginator
from django.db.models import Q
from kpopcomebacks.models import Release

PAGE_SIZE = 6


def format_comebacks(
    comebacks: list[Release], page_number: str | None = None
) -> dict:
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
        "last": (
            paginator.num_pages if page.number != paginator.num_pages else None
        ),
        "total": paginator.num_pages,
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
    artist: str, title: str, start_date: str, end_date: str, exact: bool
) -> list[Release]:
    artist = artist.strip().lower()
    title = title.strip().lower()
    filters = list()
    if artist:
        if exact:
            filters.append(Q(artist__name__iexact=artist))
        else:
            filters.append(Q(artist__name__icontains=artist))
    if title:
        if exact:
            filters.append(Q(title__iexact=title))
        else:
            filters.append(Q(title__icontains=title))
    if date := valid_date(start_date.strip()):
        filters.append(Q(release_date__gte=date))
    if date := valid_date(end_date.strip()):
        filters.append(Q(release_date__lte=date))
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


def valid_date(date: str) -> datetime | None:
    try:
        return datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None
