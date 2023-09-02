from django.shortcuts import HttpResponse, render, reverse
from django.template.response import TemplateResponse
from gfys.models import Gfy, Tag
from gfys.utils import filter_gfys, format_gfys


def index(request):
    return TemplateResponse(request, "gfys/gfys.html")


def gfylist(request):
    print(f"request.GET: {request.GET}")
    gfys = filter_gfys(
        request.GET.get("title", ""),
        request.GET.get("tags", ""),
        request.GET.get("start_date", ""),
        request.GET.get("end_date", ""),
    )
    data = format_gfys(gfys, request.GET.get("page", None))
    data["search_url"] = reverse("gfys:gfy-list")
    print(f"Sending page values: {data['page']}")
    return TemplateResponse(request, "gfys/partials/gfylist.html", {"data": data})
