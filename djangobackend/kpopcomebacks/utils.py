import random
from datetime import datetime

from django.core.paginator import Paginator

random.seed(42)

Comeback = dict[str, str]
generated_data = None
PAGE_SIZE = 2


def dummy_data() -> list[Comeback]:
    global generated_data
    if generated_data is not None:
        return generated_data
    dates = [
        "2023-08-24",
        "2023-08-03",
        "2023-08-05",
        "2023-08-24",
        "2023-08-12",
        "2023-07-24",
        "2023-07-21",
        "2023-07-10",
        "2023-07-13",
        "2023-07-01",
        "2023-06-01",
        "2023-06-11",
        "2023-06-21",
        "2023-06-15",
        "2023-06-17",
    ]
    comebacks = list()
    for date in dates:
        comebacks += create_comebacks(date, random.randint(1, 5))
    generated_data = comebacks
    return comebacks


def create_comebacks(date: str, n=1):
    artists = [
        "aespa",
        "AKMU",
        "Baekhyun",
        "BIBI",
        "BLACKPINK",
        "BTS",
        "Chungha",
        "Davichi",
        "ENHYPEN",
        "EXO",
        "GOT7",
        "Hwasa",
        "IU",
        "ITZY",
        "Kang Daniel",
        "Kang Seung Yoon",
        "Red Velvet",
        "Rosé",
        "Seventeen",
        "SHINee",
        "Stray Kids",
        "Sunmi",
        "Super Junior",
        "Taemin",
        "Taeyeon",
        "TXT",
        "TWICE",
        "Weki Meki",
        "Wendy",
    ]
    types = [
        "Debut",
        "Comeback",
    ]
    prefixes = [
        "Hot",
        "Good",
        "Bad",
        "Cool",
        "Pretty",
    ]
    postfixes = [
        "Summer",
        "Winter",
        "Spring",
        "Fall",
    ]

    comebacks = list()
    for i in range(n):
        artist = random.choice(artists)
        comeback = {
            "id": str(i),
            "artist": artist,
            "title": f"{random.choice(prefixes)} {random.choice(postfixes)}",
            "date": date,
            "type": random.choice(types),
            "urls": ["https://www.youtube.com/watch?v=fNaKSu73w60"],
        }
        comebacks.append(comeback)
    return comebacks


def format_comebacks(
    comebacks: list[dict[str, str]], page_number: str | None = None
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
    page_numbers = list()
    if page.has_previous():
        page_numbers.append(page.previous_page_number())
    page_numbers.append(page.number)
    if page.has_next():
        page_numbers.append(page.next_page_number())
    if len(page_numbers) < 3 and paginator.num_pages > 2:
        if page_numbers[0] == 1:
            page_numbers.append(3)
        else:
            page_numbers.insert(0, page.previous_page_number() - 1)
    page = {
        "current": page.number,
        "previous": page.previous_page_number() if page.has_previous() else page.number,
        "next": page.next_page_number() if page.has_next() else page.number,
        "total": paginator.num_pages,
        "has_next": page.has_next(),
        "has_previous": page.has_previous(),
        "page_numbers": page_numbers,
    }
    return {
        "comebacks": comebacks,
        "page": page,
    }


def get_closest_page(paginator: Paginator) -> int:
    closest = 1
    today_str = datetime.today().strftime("%Y-%m-%d")
    while paginator.page(closest).has_next():
        page = paginator.page(closest)
        cbs = [cb for cb in page]
        for cb in cbs:
            if cb["date"] >= today_str:
                return closest
        closest += 1
    return closest


def filter_combacks(
    cbs: list[dict[str, str]], artist: str, title: str
) -> list[dict[str, str]]:
    if not artist and not title:
        return cbs
    comebacks = list()
    for cb in cbs:
        artist_check = cb["artist"].lower().startswith(artist)
        title_check = cb["title"].lower().startswith(title)
        if artist and title:
            if artist_check and title_check:
                comebacks.append(cb)
            continue
        if artist and artist_check:
            comebacks.append(cb)
            continue
        if title and title_check:
            comebacks.append(cb)
            continue
    return comebacks
