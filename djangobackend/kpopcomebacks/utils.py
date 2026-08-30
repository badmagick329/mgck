import os
import re
from datetime import date, datetime
from uuid import UUID

from django.db.models import Case, DateField, F, IntegerField, Q, QuerySet, Value, When
from django.utils import timezone
from kpopcomebacks.models import Artist, ArtistCreditMatch, Release

def artist_name_phrase_regex(name: str) -> str:
    """Match an artist phrase without matching it inside another word."""
    return rf"(^|[^[:alnum:]]){re.escape(name.strip())}([^[:alnum:]]|$)"


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
    if os.environ.get("KPOP_WATCHLIST_USE_MATERIALIZED_MATCHES") == "1":
        matching_artist_ids = ArtistCreditMatch.objects.filter(
            followed_artist__public_id__in=artist_public_ids
        ).values("credited_artist_id")
    else:
        selected_artist_names = Artist.objects.filter(
            public_id__in=artist_public_ids
        ).values_list("name", flat=True)
        matching_names: Q | None = None
        for artist_name in selected_artist_names:
            if artist_name.strip():
                phrase_match = Q(
                    name__iregex=artist_name_phrase_regex(artist_name)
                )
                matching_names = (
                    phrase_match
                    if matching_names is None
                    else matching_names | phrase_match
                )
        if matching_names is None:
            return Release.objects.none()
        matching_artist_ids = Artist.objects.filter(matching_names).values("id")
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
    comebacks = comebacks.select_related("artist", "release_type")
    if ordering not in {"upcoming_first", "recent_first"}:
        return comebacks.order_by("release_date", "id")

    today = timezone.localdate()
    upcoming_first = ordering == "upcoming_first"
    return comebacks.annotate(
        release_window=Case(
            When(release_date__gte=today, then=Value(0 if upcoming_first else 1)),
            default=Value(1 if upcoming_first else 0),
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
        *(
            [
                F("upcoming_release_date").asc(nulls_last=True),
                F("recent_release_date").desc(nulls_last=True),
            ]
            if upcoming_first
            else [
                F("recent_release_date").desc(nulls_last=True),
                F("upcoming_release_date").asc(nulls_last=True),
            ]
        ),
        "id",
    )


def valid_date(date: str) -> datetime | None:
    try:
        return datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None
