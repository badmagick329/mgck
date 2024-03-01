import random

from django.http import JsonResponse
from django.shortcuts import render


def index(request):
    return render(request, "emojify/index.html")


def convert(request):
    message = request.GET.get("message")
    ret = converter(message)
    return JsonResponse({"message": ret})


def converter(message):
    emojis = [
        "😫",
        "😃",
        "😭",
        "🥰",
        "😍",
        "🤓",
        "🤯",
        "😯",
        "🫣",
        "😤",
        "😳",
        "😬",
        "🙄",
        "💃",
        "💅",
        "👀",
        "🔥",
        "🤪",
        "😑",
    ]
    return (
        " ".join(
            list(
                (
                    map(
                        lambda x: f"{random.choice(emojis)} {x}",
                        message.split(),
                    )
                )
            )
        )[2:]
        + " "
        + random.choice(emojis)
    )
