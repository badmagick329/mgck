from django.http import HttpResponse
from django.shortcuts import render, reverse
from kpopcomebacks.utils import dummy_data, filter_combacks, format_comebacks


def index(request):
    comebacks = dummy_data()
    comebacks = sorted(comebacks, key=lambda x: x["date"])
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks)
    data["search_url"] = search_url
    return render(request, "kpopcomebacks/list.html", context=data)


def search(request):
    if request.method != "POST":
        return HttpResponse("Method not allowed", status=405)
    cbs = dummy_data()
    comebacks = list()
    artist = request.POST.get("artist", "").strip().lower()
    title = request.POST.get("title", "").strip().lower()
    comebacks = filter_combacks(cbs, artist, title)
    comebacks = sorted(comebacks, key=lambda x: x["date"])
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks, request.GET.get("page", None))
    data["search_url"] = search_url
    return render(request, "kpopcomebacks/comebacks.html", context=data)
