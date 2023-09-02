from datetime import datetime

from django.core.paginator import Paginator
from django.db.models import Count, Q
from gfys.models import Gfy, Tag

PAGE_SIZE = 50


def format_gfys(gfys: list[Gfy], page_number: str | None = None) -> dict | None:
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
    gfys = [gfy for gfy in page]
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
        "last": paginator.num_pages if page.number != paginator.num_pages else None,
        "total": paginator.num_pages,
    }
    return {
        "gfys": gfys,
        "page": page,
    }


def filter_gfys(title: str, tags: str, start_date: str, end_date: str) -> list[Gfy]:
    title = title.strip().lower()
    tags = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]
    filters = list()
    if title:
        filters.append(Q(imgur_title__icontains=title))
    start_date, end_date = valid_date(start_date.strip()), valid_date(end_date.strip())
    if any([start_date, end_date]):
        filters.append(Q(date__isnull=False))
    if start_date:
        filters.append(Q(date__gte=start_date))
    if end_date:
        filters.append(Q(date__lte=end_date))
    if filters or tags:
        if not tags:
            return (
                Gfy.objects.filter(*filters)
                .prefetch_related("tags")
                .order_by("-date", "-id")
            )
        else:
            results = (
                Gfy.objects.filter(*filters)
                .filter(tags__name__in=tags)
                .annotate(num_tags=Count("tags"))
                .filter(num_tags=len(tags))
                .prefetch_related("tags")
                .order_by("-date", "-id")
            )
            return results

    return Gfy.objects.all().prefetch_related("tags").order_by("-date", "-id")


def valid_date(date: str) -> datetime | None:
    try:
        return datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None
