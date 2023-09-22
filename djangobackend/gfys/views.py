from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.template.response import HttpResponse, TemplateResponse
from django.urls import reverse
from gfys.models import Account, Gfy, GfyUser
from gfys.utils import create_gfy, filter_gfys, format_gfys, fetch_imgur_title


def index(request):
    accounts = Account.objects.all().values_list("name", flat=True)
    return TemplateResponse(request, "gfys/gfys.html", {"accounts": accounts})


@login_required(login_url="login/")
def imgur_form(request):
    if not GfyUser.objects.filter(user=request.user).exists():
        return HttpResponse(
            "<h1>You do not have permission for this. Please contact the admin</h1>"
        )
    return TemplateResponse(request, "gfys/imgurform.html", {})


@login_required(login_url="login/")
def imgur_upload(request):
    if not GfyUser.objects.filter(user=request.user).exists():
        return HttpResponse(
            "<h1>You do not have permission for this. Please contact the admin</h1>"
        )
    if request.method != "POST":
        return
    data = request.POST.dict()
    account = GfyUser.objects.get(user=request.user).account
    res = create_gfy(
        data["title"].strip(),
        [t.strip() for t in data["tags"].split(",") if t.strip()],
        data["url"].strip(),
        account,
    )
    if res.is_err():
        error = res.unwrap_err()
        message_dict = error.message_dict
        field_map = {
            "imgur_title": "Title",
            "imgur_id": "URL",
            "tags": "Tags",
        }
        errors = [f"{field_map[k]}: {v[0]}" for k, v in message_dict.items()]
        return TemplateResponse(
            request,
            "gfys/partials/imgur_form_error.html",
            {"errors": errors},
        )
    else:
        return TemplateResponse(
            request,
            "gfys/partials/imgur_form_success.html",
            {"success": res.unwrap()},
        )

@login_required(login_url="login/")
def fetch_title(request):
    if request.method != "POST":
        return
    data = request.POST.dict()
    title = fetch_imgur_title(data["url"].strip())
    if not title:
        return HttpResponse("")
    return TemplateResponse(
        request,
        "gfys/partials/fetch_title.html",
        {"title": title},
    )


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


def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("gfys:imgur-form"))
        else:
            return render(
                request,
                "registration/login.html",
                {"message": "Invalid username and/or password."},
            )
    else:
        return render(
            request,
            "registration/login.html",
            {"action": reverse("gfys:login")},
        )


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("gfys:login"))
