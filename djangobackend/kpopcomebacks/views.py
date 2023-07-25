from django.http import HttpResponse
from django.shortcuts import render, reverse
from kpopcomebacks.utils import dummy_data, filter_comebacks, format_comebacks

# TODO
# tailwind
# flex gap-1
# justify between

def index(request):
    comebacks = dummy_data()
    comebacks = sorted(comebacks, key=lambda x: x["date"])
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks)
    data["search_url"] = search_url
    min_date = min([cb["date"] for cb in comebacks])
    max_date = max([cb["date"] for cb in comebacks])
    data["min_date"] = min_date
    data["max_date"] = max_date
    return render(request, "kpopcomebacks/list.html", context=data)


def search(request):
    if request.method != "POST":
        return HttpResponse("Method not allowed", status=405)
    cbs = dummy_data()
    comebacks = list()
    artist = request.POST.get("artist", "").strip().lower()
    title = request.POST.get("title", "").strip().lower()
    start_date = request.POST.get("start_date", "").strip()
    end_date = request.POST.get("end_date", "").strip()
    comebacks = filter_comebacks(cbs, artist, title, start_date, end_date)
    comebacks = sorted(comebacks, key=lambda x: x["date"])
    search_url = reverse("kpopcomebacks:search")
    data = format_comebacks(comebacks, request.GET.get("page", None))
    data["search_url"] = search_url
    return render(request, "kpopcomebacks/comebacks.html", context=data)
