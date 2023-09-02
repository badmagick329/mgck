from django.shortcuts import HttpResponse, render, reverse
from django.template.response import TemplateResponse
from gfys.models import Gfy, Tag
from gfys.utils import filter_gfys, format_gfys


def index(request):
    return TemplateResponse(request, "gfys/gfys.html")


def gfylist(request):
    gfys = filter_gfys(
        request.GET.get("title", ""),
        request.GET.get("tags", ""),
        request.GET.get("start_date", ""),
        request.GET.get("end_date", ""),
    )
    data = format_gfys(gfys, request.GET.get("page", None))
    return TemplateResponse(request, "gfys/partials/gfylist.html", {"data": data})
