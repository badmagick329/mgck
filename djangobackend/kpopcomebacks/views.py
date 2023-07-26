from functools import lru_cache

from django.http import HttpResponse
from django.shortcuts import render, reverse
from kpopcomebacks.models import Artist, Release, ReleaseType
from kpopcomebacks.utils import dummy_data, filter_comebacks, format_comebacks

# TODO
# tailwind
# flex gap-1
# justify between


def index(request):
    comebacks = [
        r.to_dict()
        for r in Release.objects.all()
        .prefetch_related("artist", "release_type")
        .order_by("release_date")
    ]
    print(f"len(comebacks): {len(comebacks)}")
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks)
    data["search_url"] = search_url
    min_date = min([cb["release_date"] for cb in comebacks])
    max_date = max([cb["release_date"] for cb in comebacks])
    data["min_date"] = min_date
    data["max_date"] = max_date
    return render(request, "kpopcomebacks/list.html", context=data)


def search(request):
    if request.method != "POST":
        return HttpResponse("Method not allowed", status=405)
    cbs = [
        r.to_dict()
        for r in Release.objects.all()
        .prefetch_related("artist", "release_type")
        .order_by("release_date")
    ]
    artist = request.POST.get("artist", "").strip().lower()
    title = request.POST.get("title", "").strip().lower()
    start_date = request.POST.get("start_date", "").strip()
    end_date = request.POST.get("end_date", "").strip()
    comebacks = filter_comebacks(cbs, artist, title, start_date, end_date)
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks, request.GET.get("page", None))
    data["search_url"] = search_url
    return render(request, "kpopcomebacks/comebacks.html", context=data)
