import random
from datetime import datetime, timedelta
from time import perf_counter

from django.core.paginator import Paginator

random.seed(42)

Comeback = dict[str, str]
generated_data = None
PAGE_SIZE = 8


def dummy_data(n=10) -> list[Comeback]:
    global generated_data
    if generated_data is not None:
        return generated_data
    comebacks = list()
    for date in _dates(n):
        comebacks += create_comebacks(date)
    generated_data = comebacks
    return comebacks


def _dates(n):
    today = datetime.today()
    for i in range(n):
        yield (today + timedelta(days=i)).strftime("%Y-%m-%d")
        yield (today - timedelta(days=i)).strftime("%Y-%m-%d")


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
            "id": f"{date}-{artist}-{i}",
            "artist": artist,
            "title": f"{random.choice(prefixes)} {random.choice(postfixes)}",
            "reelase_date": date,
            "type": random.choice(types),
            "urls": ["https://www.youtube.com/watch?v=fNaKSu73w60"],
        }
        comebacks.append(comeback)
    return comebacks


def format_comebacks(comebacks: list[Comeback], page_number: str | None = None) -> dict:
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
            if cb["release_date"] >= today_str:
                return closest
        closest += 1
    return closest


def filter_comebacks(
    cbs: list[Comeback], artist: str, title: str, start_date: str, end_date: str
) -> list[Comeback]:
    artist = artist.strip().lower()
    title = title.strip().lower()
    artist_ids = set()
    title_ids = set()
    start_date_ids = set()
    end_date_ids = set()
    all_ids = set([cb["id"] for cb in cbs])
    if artist:
        artist_ids = set(
            [cb["id"] for cb in cbs if artist in cb["artist"].lower()]
        )
    else:
        artist_ids = all_ids
    if title:
        title_ids = set(
            [cb["id"] for cb in cbs if title in cb["title"].lower()]
        )
    else:
        title_ids = all_ids
    if valid_date(start_date.strip()):
        start_date_ids = set(
            [cb["id"] for cb in cbs if cb["release_date"] >= start_date.strip()]
        )
    else:
        start_date_ids = all_ids
    if valid_date(end_date.strip()):
        end_date_ids = set([cb["id"] for cb in cbs if cb["release_date"] <= end_date.strip()])
    else:
        end_date_ids = all_ids
    ids = artist_ids & title_ids & start_date_ids & end_date_ids
    return [cb for cb in cbs if cb["id"] in ids]


def filter_comebacks_v0(
    cbs: list[Comeback], artist: str, title: str, start_date: str, end_date: str
) -> list[Comeback]:
    artist = artist.strip().lower()
    title = title.strip().lower()
    start_date = start_date.strip() if valid_date(start_date.strip()) else None
    end_date = end_date.strip() if valid_date(end_date.strip()) else None
    artist_ids = set()
    title_ids = set()
    start_date_ids = set()
    end_date_ids = set()
    for cb in cbs:
        if artist:
            if artist in cb["artist"].lower():
                artist_ids.add(cb["id"])
        else:
            artist_ids.add(cb["id"])
        if title:
            if title in cb["title"].lower():
                title_ids.add(cb["id"])
        else:
            title_ids.add(cb["id"])
        if start_date:
            if cb["release_date"] >= start_date.strip():
                start_date_ids.add(cb["id"])
        else:
            start_date_ids.add(cb["id"])
        if end_date:
            if cb["release_date"] <= end_date.strip():
                end_date_ids.add(cb["id"])
        else:
            end_date_ids.add(cb["id"])
    ids = artist_ids & title_ids & start_date_ids & end_date_ids
    return [cb for cb in cbs if cb["id"] in ids]


def valid_date(date: str) -> bool:
    try:
        datetime.strptime(date, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def perf_test(n):
    cbs = dummy_data(n)
    cbs = sorted(cbs, key=lambda x: x["release_date"])
    func_a = list()
    start = perf_counter()
    filter_comebacks_v0(cbs, "shi", "bad", "2012-01-01", "2045-01-01")
    func_a.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks_v0(cbs, "", "goo", "2012-01-01", "2045-01-01")
    func_a.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks_v0(cbs, "bla", "", "2012-01-01", "2045-01-01")
    func_a.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks_v0(cbs, "", "", "2012-01-01", "2045-01-01")
    func_a.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks_v0(cbs, "", "", "", "2045-01-01")
    func_a.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks_v0(cbs, "", "", "", "")
    func_a.append(perf_counter() - start)
    print("Times taken for func a")
    for i in func_a:
        print(i)
    print("Total time taken for func a", sum(func_a))
    func_b = list()
    start = perf_counter()
    filter_comebacks(cbs, "shi", "bad", "2012-01-01", "2045-01-01")
    func_b.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks(cbs, "", "goo", "2012-01-01", "2045-01-01")
    func_b.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks(cbs, "bla", "", "2012-01-01", "2045-01-01")
    func_b.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks(cbs, "", "", "2012-01-01", "2045-01-01")
    func_b.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks(cbs, "", "", "", "2045-01-01")
    func_b.append(perf_counter() - start)
    start = perf_counter()
    filter_comebacks(cbs, "", "", "", "")
    func_b.append(perf_counter() - start)
    print("Times taken for func b")
    for i in func_b:
        print(i)
    print(f"Time taken: {perf_counter() - start}")
    print("Total time taken for func b", sum(func_b))


if __name__ == "__main__":
    perf_test(30000)
