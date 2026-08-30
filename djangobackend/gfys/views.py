import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from gfys.models import Gfy

from djangobackend.settings import TOKEN


@csrf_exempt
def gfy_upload(request):
    if request.method != "POST":
        return JsonResponse({"message": "Invalid request"}, status=400)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Invalid request"}, status=400)
    token = data.get("token", "")
    if token != TOKEN:
        return JsonResponse({"error": "Invalid token"}, status=403)

    imgur_url = data.get("imgur_url", "")
    video_url = data.get("video_url", "")
    title = data.get("title", "")
    tags = data.get("tags", [])
    width = data.get("width", None)
    height = data.get("height", None)
    account = data.get("account", None)
    try:
        gfy = Gfy.create_gfy_from_upload(
            title,
            tags,
            account,
            width,
            height,
            imgur_url,
            video_url,
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse(
        {
            "message": "success",
            "object_id": gfy.object_id,
            "imgur_id": gfy.imgur_id,
            "video_url": gfy.video_url,
        }
    )
