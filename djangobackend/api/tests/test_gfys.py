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
