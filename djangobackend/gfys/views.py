from django.template.response import TemplateResponse
from gfys.models import Account, Gfy
from gfys.utils import filter_gfys, format_gfys


def index(request):
    accounts = Account.objects.all().values_list("name", flat=True)
    return TemplateResponse(request, "gfys/gfys.html", {"accounts": accounts})


def gfylist(request):
    gfys = filter_gfys(
        request.GET.get("title", ""),
        request.GET.get("tags", ""),
        request.GET.get("start_date", ""),
        request.GET.get("end_date", ""),
        request.GET.get("account", ""),
    )
    data = format_gfys(gfys, request.GET.get("page", None))
    return TemplateResponse(
        request,
        "gfys/partials/gfylist.html",
        {"data": data},
    )


def video(request, imgur_id):
    gfy = Gfy.objects.get(imgur_id=imgur_id)
    tags = [t.name for t in gfy.tags.all()]
    account_name = gfy.account.name if gfy.account else None
    return TemplateResponse(
        request,
        "gfys/partials/video.html",
        {"gfy": gfy, "tags": tags, "account_name": account_name},
    )
