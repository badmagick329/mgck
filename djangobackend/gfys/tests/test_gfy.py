from datetime import date as Date

import pytest
from django.db.utils import IntegrityError
from gfys.models import Account, Gfy, Tag


@pytest.mark.django_db
def test_unique():
    Gfy.objects.create(imgur_id="test")
    with pytest.raises(IntegrityError):
        Gfy.objects.create(imgur_id="test")


@pytest.mark.django_db
def test_from_dict_tag_creation():
    gfy_dict = _gfy_dict()
    gfy_dict["tags"] = ["tag 1", "tag2", "tag3"]
    gfy = Gfy.from_dict(gfy_dict)
    assert gfy.tags.count() == 3
    tags = Tag.objects.all()
    assert tags.count() == 3
    assert tags[0].name == "tag 1"
    assert tags[1].name == "tag2"
    assert tags[2].name == "tag3"


@pytest.mark.django_db
def test_from_dict_account_creation():
    gfy_dict = _gfy_dict()
    gfy_dict["account"] = "newaccount"
    gfy = Gfy.from_dict(gfy_dict)
    assert gfy.account.name == "newaccount"
    assert Account.objects.count() == 1
    assert Account.objects.first().name == "newaccount"


@pytest.mark.django_db
def test_from_dict_with_gfy_data():
    gfy_dict = _gfy_dict()
    gfy = Gfy.from_dict(gfy_dict)
    assert gfy.imgur_id == "imgurid"
    assert gfy.imgur_title == "200101 original title_[gfycatidhere]"
    assert gfy.gfy_id == "gfycatidhere"
    assert gfy.gfy_title == "200101 original title"
    assert gfy.date == Date(2020, 1, 1)
    assert gfy.account.name == "gfycataccount"
    assert gfy.tags.count() == 2
    assert gfy.tags.first().name == "tag 1"
    assert gfy.tags.last().name == "tag2"


@pytest.mark.django_db
def test_from_dict_without_gfy_data():
    gfy_dict = _gfy_dict()
    gfy_dict.pop("gfy_id")
    gfy_dict.pop("gfy_title")
    gfy = Gfy.from_dict(gfy_dict)
    assert gfy.imgur_id == "imgurid"
    assert gfy.imgur_title == "200101 original title_[gfycatidhere]"
    assert gfy.gfy_id is None
    assert gfy.gfy_title is None
    assert gfy.date == Date(2020, 1, 1)
    assert gfy.account.name == "gfycataccount"
    assert gfy.tags.count() == 2
    assert gfy.tags.first().name == "tag 1"
    assert gfy.tags.last().name == "tag2"


@pytest.mark.django_db
def test_from_dict_invalid_imgur_url():
    gfy_dict = _gfy_dict()
    gfy_dict["imgur_url"] = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    with pytest.raises(ValueError):
        Gfy.from_dict(gfy_dict)


@pytest.mark.django_db
def test_from_dict_missing_imgur_title():
    gfy_dict = _gfy_dict()
    gfy_dict.pop("imgur_title")
    with pytest.raises(KeyError):
        Gfy.from_dict(gfy_dict)


@pytest.mark.django_db
def test_from_dict_missing_optionals():
    gfy_dict = dict()
    gfy_dict["imgur_title"] = "original title_[gfycatidhere]"
    gfy_dict["imgur_url"] = "https://i.imgur.com/imgurid.mp4"
    gfy = Gfy.from_dict(gfy_dict)
    assert gfy.imgur_id == "imgurid"
    assert gfy.imgur_title == "original title_[gfycatidhere]"
    assert gfy.gfy_id is None
    assert gfy.gfy_title is None
    assert gfy.date is None
    assert gfy.account is None
    assert gfy.tags.count() == 0


@pytest.mark.django_db
def test_from_dict_existing_gfy_updates():
    gfy_dict = _gfy_dict()
    gfy = Gfy.from_dict(gfy_dict)
    assert Account.objects.count() == 1
    tags = Tag.objects.all()
    assert tags.count() == 2
    gfy_dict["tags"] = list()
    gfy_dict["account"] = "newaccount"
    gfy = Gfy.from_dict(gfy_dict)
    assert gfy.account.name == "newaccount"
    assert Account.objects.count() == 2
    tags = gfy.tags.all()
    assert tags.count() == 0


def _gfy_dict(
    imgur_url: str | None = None,
    imgur_title: str | None = None,
    gfy_id: str | None = None,
    gfy_title: str | None = None,
    tags: list[str] | None = None,
    account: str | None = None,
):
    return {
        "imgur_url": imgur_url or "https://i.imgur.com/imgurid.mp4",
        "imgur_title": imgur_title or "200101 original title_[gfycatidhere]",
        "gfy_id": gfy_id or "gfycatidhere",
        "gfy_title": gfy_title or "200101 original title",
        "tags": tags or ["tag 1", "tag2"],
        "account": account or "gfycataccount",
    }
