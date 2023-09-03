from functools import lru_cache

from django.http import HttpResponse
from django.shortcuts import render, reverse
from kpopcomebacks.models import Artist, Release, ReleaseType
from kpopcomebacks.utils import filter_comebacks, format_comebacks


def index(request):
    comebacks = [
        r
        for r in Release.objects.all()
        .prefetch_related("artist", "release_type")
        .order_by("release_date")
    ]
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks)
    data["search_url"] = search_url
    min_date = min([cb.release_date for cb in comebacks])
    max_date = max([cb.release_date for cb in comebacks])
    data["min_date"] = min_date.strftime("%Y-%m-%d")
    data["max_date"] = max_date.strftime("%Y-%m-%d")
    return render(request, "kpopcomebacks/list.html", context=data)


def search(request):
    if request.method != "POST":
        return HttpResponse("🙅", status=405)
    artist = request.POST.get("artist", "").strip().lower()
    title = request.POST.get("title", "").strip().lower()
    exact = request.POST.get("exact", "").strip().lower() == "exact"
    start_date = request.POST.get("start_date", "").strip()
    end_date = request.POST.get("end_date", "").strip()
    comebacks = filter_comebacks(artist, title, start_date, end_date, exact)
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks, request.GET.get("page", None))
    data["search_url"] = search_url
    return render(request, "kpopcomebacks/comebacks.html", context=data)
