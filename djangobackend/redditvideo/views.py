from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from redditvideo.utils import mux_video
from django.views.decorators.csrf import csrf_exempt
from djangobackend.settings import BASE_URL, TOKEN


@csrf_exempt
def reddit_video(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are allowed"})
    token = request.POST.get("token", "")
    if token != TOKEN:
        return JsonResponse({"error": "Invalid token"})
    source_url = request.POST.get("source_url", "")
    if not source_url:
        return JsonResponse({"error": "No source_url provided"})
    result = mux_video(source_url)
    if not result:
        return JsonResponse({"error": "Something went wrong 😞"})
    video_url = BASE_URL + "/videos/" + result
    return JsonResponse({"video_url": video_url})
