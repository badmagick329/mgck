from datetime import date

import pytest

from gfys.models import Gfy, Tag
from gfys.presentation import display_title, related_clips


@pytest.mark.parametrize(
    ("imgur_title", "gfy_title", "gfy_id", "expected"),
    [
        ("Migrated_[oldslug]", "230101 Irene 2 - The Cure MV [Source_ID]", "oldslug",
         "230101 Irene 2 - The Cure MV [Source_ID]"),
        ("140823 Irene and Seulgi 2 아이린 [Source_ID]_[OldSlug].mp4", None, "oldslug",
         "140823 Irene and Seulgi 2 아이린 [Source_ID]"),
        ("Irene_[unrelated]", "", "oldslug", "Irene_[unrelated]"),
        ("220913 SEULGI 4 - 28 Reasons.mp4", None, None,
         "220913 SEULGI 4 - 28 Reasons"),
        ("Irene [1080p] 2022-10-22", None, None, "Irene [1080p] 2022-10-22"),
        ("Irene_[oldslug]", "  ", "oldslug", "Irene"),
    ],
)
def test_display_title_preserves_content_metadata(imgur_title, gfy_title, gfy_id, expected):
    gfy = Gfy(imgur_title=imgur_title, gfy_title=gfy_title, gfy_id=gfy_id)

    assert display_title(gfy) == expected
    assert gfy.imgur_title == imgur_title
    assert gfy.gfy_title == gfy_title


def make_clip(identifier, tags, clip_date=None, **fields):
    clip = Gfy.objects.create(
        imgur_id=identifier, imgur_title=identifier, date=clip_date, **fields
    )
    clip.tags.add(*(Tag.objects.get_or_create(name=name)[0] for name in tags))
    return clip


@pytest.mark.django_db
def test_related_clips_rank_overlap_then_date_and_canonical_id(django_assert_num_queries):
    current = make_clip("current", ["irene", "birthday", "red velvet", "230101"])
    make_clip("broad", ["red velvet", "230101"], date(2026, 1, 1))
    make_clip("newer-single", ["irene"], date(2026, 1, 1))
    make_clip("older-double", ["irene", "birthday"], date(2020, 1, 1))
    make_clip("tie-b", ["birthday"], date(2025, 1, 1))
    make_clip("tie-a", ["birthday"], date(2025, 1, 1), video_id="canonical-a")
    make_clip("undated", ["birthday"])
    make_clip("null-thumb", ["irene", "birthday"], video_id="no-thumb")
    Gfy.objects.filter(imgur_id="null-thumb").update(imgur_id=None)

    with django_assert_num_queries(3):
        clips = related_clips(current)

    assert [clip["id"] for clip in clips] == [
        "older-double", "newer-single", "canonical-a", "tie-b", "undated"
    ]
    assert clips[2]["imgur_id"] == "tie-a"
    assert clips[0]["tags"] == ["birthday", "irene"]
    assert clips[0]["width"] is None


@pytest.mark.django_db
def test_related_clips_limit_six_with_constant_queries(django_assert_num_queries):
    current = make_clip("current", ["irene"])
    for index in range(12):
        make_clip(f"related-{index:02}", ["irene"])

    with django_assert_num_queries(3):
        clips = related_clips(current)

    assert [clip["id"] for clip in clips] == [f"related-{index:02}" for index in range(6)]


@pytest.mark.django_db
@pytest.mark.parametrize("tags", [["red velvet", "kpop", "gfy", "gfycat", "230101"], ["unique"]])
def test_related_clips_do_not_fill_without_meaningful_overlap(tags):
    current = make_clip("current", tags)
    make_clip("unrelated", ["red velvet", "kpop", "230101"])

    assert related_clips(current) == []
