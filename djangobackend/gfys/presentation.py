import re

from django.db.models import Count, F

from gfys.models import Gfy


def display_title(gfy: Gfy) -> str:
    """Keep archive metadata intact; strip only known migration decoration."""
    title = (gfy.gfy_title or "").strip() or gfy.imgur_title.strip()
    title = re.sub(r"\.(?:mp4|webm|gifv?|mov)$", "", title, flags=re.IGNORECASE)
    if gfy.gfy_id:
        # Arbitrary brackets can contain source IDs or content names, so only
        # remove the suffix when it matches this clip's stored Gfycat slug.
        title = re.sub(
            rf"_\[{re.escape(gfy.gfy_id)}\]$", "", title,
            flags=re.IGNORECASE,
        )
    return title.strip() or gfy.imgur_title.strip()


# These collection-wide labels do not explain why two clips belong together.
_BROAD_TAGS = {
    "red velvet", "redvelvet", "레드벨벳", "kpop", "k-pop", "gfy",
    "gfys", "gfycat", "gif", "gifs", "girl group", "girl groups",
    "celebs", "celebrity", "celebrities",
}
_DATE_TAG = re.compile(r"(?:\d{4}|\d{6}|\d{8}|\d{4}[-./]\d{2}[-./]\d{2})")


def related_clips(gfy: Gfy) -> list[dict]:
    meaningful_ids = [
        tag.pk for tag in gfy.tags.all()
        if tag.name.strip().casefold() not in _BROAD_TAGS
        and not _DATE_TAG.fullmatch(tag.name.strip())
    ]
    if not meaningful_ids:
        return []
    # Rank and limit in SQL before prefetching: archive size must not determine
    # response memory or the number of tag queries.
    matches = (
        Gfy.objects.exclude(pk=gfy.pk)
        .exclude(object_id__isnull=True).exclude(object_id="")
        .exclude(imgur_id__isnull=True).exclude(imgur_id="")
        .filter(tags__pk__in=meaningful_ids)
        .annotate(shared_tags=Count("tags", distinct=True))
        .order_by("-shared_tags", F("date").desc(nulls_last=True), "object_id")
        .prefetch_related("tags")[:6]
    )
    return [
        {
            "id": clip.object_id,
            "imgur_id": clip.imgur_id,
            "title": display_title(clip),
            "tags": [tag.name for tag in clip.tags.all()],
            "date": clip.date,
            "width": clip.width,
            "height": clip.height,
        }
        for clip in matches
    ]
