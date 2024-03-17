import json
import os
import sys
from pathlib import Path

import django

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"
django.setup()
import logging

from gfys.models import Gfy

LOG_LEVEL = logging.DEBUG
VIDEO_DIMENSIONS = BASE_DIR / "scripts" / "data" / "video_dimensions.json"


def main():
    with open(VIDEO_DIMENSIONS, "r", encoding="utf-8") as f:
        data = json.load(f)
    for i,d in enumerate(data):
        gfy = Gfy.objects.filter(video_id=d["file"]).first()
        if gfy is None:
            print(f"\nNo gfy found for {d['file']}")
            continue
        gfy.width = d["width"]
        gfy.height = d["height"]
        gfy.save()
        print(f"Updated {i}", end="\r")


if __name__ == "__main__":
    main()
