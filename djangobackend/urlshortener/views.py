import re
from datetime import datetime

from django.shortcuts import HttpResponseRedirect, render
from urlshortener.models import ShortURL
from urlshortener.apps import UrlshortenerConfig

app_name = UrlshortenerConfig.name


def index(request):
    return render(request, f"{app_name}/index.html")


def shorten(request):
    if request.method != "POST":
        return HttpResponseRedirect("/")
    source_url = request.POST.get("source_url", "").strip()
    if source_url == "" or "." not in source_url:
        return error(request, "Please enter a valid URL")
    if " " in source_url:
        return error(request, f"{source_url} is not a valid URL")
    custom_id = request.POST.get("custom_id", "").strip()
    if custom_id:
        url_id = ShortURL.request_custom_id(custom_id)
        if isinstance(url_id, Exception):
            return error(request, str(url_id))
    else:
        url_id = ShortURL.create_id()
    short_url = ShortURL.objects.create(url=request.POST["source_url"], short_id=url_id)
    return render(
        request,
        f"{app_name}/shortened.html",
        context={"short_url": short_url.redirect_url},
    )


def target_url(request, short_id):
    if not request.method == "GET":
        return
    if not short_id:
        return error(request, f"{short_id} is not a valid short URL")
    short_url = ShortURL.objects.filter(short_id=short_id).first()
    if not short_url:
        return error(request, f"Shortened ID '{short_id}' not found")
    short_url.accessed = datetime.now()
    short_url.save()
    url = short_url.url
    if not re.match(r"^https?://", url):
        url = f"http://{url}"
    return HttpResponseRedirect(url)


def error(request, message: str):
    return render(
        request,
        f"{app_name}/error.html",
        context={"message": message},
    )
