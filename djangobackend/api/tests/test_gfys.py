import pytest
from django.test import Client

from gfys.models import Account, Gfy, Tag


@pytest.mark.django_db
def test_gfy_api_includes_view_counts_and_orders_by_them():
    account = Account.objects.create(name="Red Velvet")
    less_viewed = Gfy.objects.create(
        imgur_id="less-viewed",
        imgur_title="Less viewed",
        account=account,
    )
    most_viewed = Gfy.objects.create(
        imgur_id="most-viewed",
        imgur_title="Most viewed",
        account=account,
    )
    less_viewed.add_view()
    most_viewed.add_view()
    most_viewed.add_view()

    client = Client()
    list_response = client.get("/api/gfys?sort=most_viewed")
    detail_response = client.get("/api/gfys/most-viewed")

    assert list_response.status_code == 200
    assert list_response.json()["results"][0]["imgur_id"] == "most-viewed"
    assert list_response.json()["results"][0]["view_count"] == 2
    assert list_response.json()["results"][1]["view_count"] == 1
    assert detail_response.status_code == 200
    assert detail_response.json()["view_count"] == 2


@pytest.mark.django_db
def test_random_gfy_returns_a_result_from_the_active_filters():
    account = Account.objects.create(name="Red Velvet")
    matching_gfy = Gfy.objects.create(
        imgur_id="random-match",
        imgur_title="Random match",
        account=account,
    )
    other_account = Account.objects.create(name="Other")
    Gfy.objects.create(
        imgur_id="random-other",
        imgur_title="Other match",
        account=other_account,
    )

    response = Client().get("/api/gfys/random?account=Red%20Velvet")

    assert response.status_code == 200
    assert response.json() == {"imgur_id": matching_gfy.imgur_id}


@pytest.mark.django_db
@pytest.mark.parametrize("tags", ["irene,seulgi", " Irene,irene, SEULGI, "])
@pytest.mark.parametrize("sort", ["recent", "oldest", "most_viewed"])
def test_tag_filters_require_all_distinct_tags_without_multiplying_views(tags, sort):
    irene = Tag.objects.create(name="irene")
    seulgi = Tag.objects.create(name="seulgi")
    matching = Gfy.objects.create(imgur_id="both", imgur_title="Both members")
    matching.tags.add(irene, seulgi)
    matching.add_view()
    matching.add_view()
    partial = Gfy.objects.create(imgur_id="one", imgur_title="One member")
    partial.tags.add(irene)
    partial.add_view()
    partial.add_view()

    response = Client().get("/api/gfys", {"tags": tags, "sort": sort})

    assert response.status_code == 200
    results = response.json()["results"]
    assert [(gfy["imgur_id"], gfy["view_count"]) for gfy in results] == [("both", 2)]


@pytest.mark.django_db
def test_view_posts_increment_the_counter():
    gfy = Gfy.objects.create(imgur_id="clip", imgur_title="Clip")
    client = Client()

    responses = [
        client.post(
            "/api/gfy/views",
            {"videoUrl": "https://i.imgur.com/clip.mp4"},
            content_type="application/json",
        )
        for _ in range(3)
    ]

    assert [response.json()["viewCount"] for response in responses] == [1, 2, 3]
    gfy.refresh_from_db()
    assert gfy.view_count == 3


@pytest.mark.django_db
@pytest.mark.parametrize("query", ["original imgur", "original gfycat", "OldSlug"])
def test_original_names_remain_searchable_with_tag_and_sort_filters(query):
    tag = Tag.objects.create(name="irene")
    matching = Gfy.objects.create(
        imgur_id="archive", imgur_title="Original Imgur_[OldSlug]",
        gfy_title="Original Gfycat", gfy_id="OldSlug",
    )
    matching.tags.add(tag)
    Gfy.objects.create(
        imgur_id="excluded", imgur_title="Original Imgur_[OldSlug]",
        gfy_title="Original Gfycat", gfy_id="OldSlug",
    )

    response = Client().get("/api/gfys", {"title": query, "tags": "irene", "sort": "oldest"})

    assert response.status_code == 200
    results = response.json()["results"]
    assert [clip["imgur_id"] for clip in results] == ["archive"]
    assert results[0]["display_title"] == "Original Gfycat"
    assert results[0]["imgur_title"] == "Original Imgur_[OldSlug]"
    assert results[0]["gfy_title"] == "Original Gfycat"
    assert results[0]["gfy_id"] == "OldSlug"


@pytest.mark.django_db
def test_details_preserve_original_title_and_include_related_contract(django_assert_num_queries):
    tag = Tag.objects.create(name="irene")
    current = Gfy.objects.create(
        imgur_id="archive", imgur_title="Original_[OldSlug]",
        gfy_title="230101 Irene", gfy_id="OldSlug",
    )
    current.tags.add(tag)
    related = Gfy.objects.create(
        imgur_id="thumbnail", video_id="canonical", imgur_title="Related.mp4",
        width=1920, height=1080,
    )
    related.tags.add(tag)

    with django_assert_num_queries(4):
        response = Client().get("/api/gfys/archive")

    assert response.status_code == 200
    result = response.json()
    assert result["title"] == "Original_[OldSlug]"
    assert result["display_title"] == "230101 Irene"
    assert result["gfy_title"] == "230101 Irene"
    assert result["gfy_id"] == "OldSlug"
    assert result["account"] is None
    assert result["related_clips"] == [{
        "id": "canonical", "imgur_id": "thumbnail", "title": "Related",
        "tags": ["irene"], "date": None, "width": 1920, "height": 1080,
    }]
