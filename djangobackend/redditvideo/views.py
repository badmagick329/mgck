from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from redditvideo.utils import mux_video

from djangobackend.settings import BASE_URL, TOKEN


@csrf_exempt
def reddit_video(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed"}, status=403
        )
    token = request.POST.get("token", "")
    if token != TOKEN:
        return JsonResponse({"error": "Invalid token"}, status=403)
    source_url = request.POST.get("source_url", "")
    if not source_url:
        return JsonResponse({"error": "No source_url provided"}, status=400)
    result = mux_video(source_url)
    if not result:
        return JsonResponse({"error": "Something went wrong 😞"}, status=404)
    video_url = BASE_URL + "/videos/" + result
    return JsonResponse({"video_url": video_url})
