import pytest
from django.test import Client

from gfys.models import Account, Gfy


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
