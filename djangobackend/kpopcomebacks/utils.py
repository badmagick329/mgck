from datetime import date, datetime
from uuid import UUID

from django.core.paginator import Paginator
from django.db.models import Case, DateField, F, IntegerField, Q, QuerySet, Value, When
from django.db.models.functions import Lower, Trim
from django.utils import timezone
from kpopcomebacks.models import Artist, Release

PAGE_SIZE = 6


def format_comebacks(
    comebacks: QuerySet[Release], page_number: str | None = None
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
) -> QuerySet[Release]:
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
        return order_comebacks(Release.objects.filter(*filters))
    return order_comebacks(Release.objects.all())


def filter_comebacks_by_artist_public_ids(
    artist_public_ids: list[UUID],
    start_date: date | None = None,
    end_date: date | None = None,
    ordering: str = "release_date_asc",
) -> QuerySet[Release]:
    selected_artist_names = Artist.objects.filter(
        public_id__in=artist_public_ids
    ).annotate(normalized_name=Lower(Trim("name"))).values_list(
        "normalized_name",
        flat=True,
    )
    matching_artist_ids = Artist.objects.annotate(
        normalized_name=Lower(Trim("name"))
    ).filter(normalized_name__in=selected_artist_names).values("id")
    comebacks = Release.objects.filter(artist_id__in=matching_artist_ids)
    if start_date:
        comebacks = comebacks.filter(release_date__gte=start_date)
    if end_date:
        comebacks = comebacks.filter(release_date__lte=end_date)
    return order_comebacks(comebacks, ordering)


def order_comebacks(
    comebacks: QuerySet[Release],
    ordering: str = "release_date_asc",
) -> QuerySet[Release]:
    comebacks = comebacks.prefetch_related("artist", "release_type")
    if ordering != "upcoming_first":
        return comebacks.order_by("release_date", "id")

    today = timezone.localdate()
    return comebacks.annotate(
        release_window=Case(
            When(release_date__gte=today, then=Value(0)),
            default=Value(1),
            output_field=IntegerField(),
        ),
        upcoming_release_date=Case(
            When(release_date__gte=today, then=F("release_date")),
            default=Value(None, output_field=DateField()),
            output_field=DateField(),
        ),
        recent_release_date=Case(
            When(release_date__lt=today, then=F("release_date")),
            default=Value(None, output_field=DateField()),
            output_field=DateField(),
        ),
    ).order_by(
        "release_window",
        F("upcoming_release_date").asc(nulls_last=True),
        F("recent_release_date").desc(nulls_last=True),
        "id",
    )


def valid_date(date: str) -> datetime | None:
    try:
        return datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None
