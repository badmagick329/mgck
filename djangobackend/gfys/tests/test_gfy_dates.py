from datetime import date as Date

from gfys.models import Gfy


def test_gfy_date_from_tags():
    tags = ["190521", "red velvet", "irene"]
    date = Gfy.gfy_date(tags, "title")
    assert date == Date(2019, 5, 21)


def test_gfy_date_from_title():
    tags = []
    date = Gfy.gfy_date(tags, "220501 blackpink jennie")
    assert date == Date(2022, 5, 1)


def test_gfy_date_from_tags_and_title():
    tags = ["20190521", "red velvet", "irene"]
    date = Gfy.gfy_date(tags, "20220501 blackpink jennie")
    assert date == Date(2019, 5, 21)


def test_gfy_date_from_none():
    tags = []
    date = Gfy.gfy_date(tags, "")
    assert date is None


def test_invalid_gfy_date_in_tags():
    tags = ["191521", "red velvet", "irene"]
    date = Gfy.gfy_date(tags, "220501")
    assert date == Date(2022, 5, 1)


def test_invalid_gfy_date_in_title():
    tags = ["111231", "red velvet", "irene"]
    date = Gfy.gfy_date(tags, "221501")
    assert date == Date(2011, 12, 31)


def test_invalid_gfy_date_in_tags_and_title():
    tags = ["111331", "2019-01-01", "2018/01/01", "red velvet", "irene"]
    date = Gfy.gfy_date(tags, "221501 2015112")
    assert date is None


def test_invalid_gfy_date_in_tags_and_title():
    tags = ["111331", "red velvet", "irene"]
    date = Gfy.gfy_date(tags, "221501")
    assert date is None


def test_multiple_dates_in_tags():
    tags = ["111231", "red velvet", "irene", "190521"]
    date = Gfy.gfy_date(tags, "221501")
    assert date == Date(2011, 12, 31)


def test_multiple_dates_in_title():
    tags = []
    date = Gfy.gfy_date(tags, "190521 221501")
    assert date == Date(2019, 5, 21)
