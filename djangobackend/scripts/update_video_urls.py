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
UPLOADED_VIDEOS = BASE_DIR / "scripts" / "data" / "uploaded_videos.json"


def main():
    with open(UPLOADED_VIDEOS, "r", encoding="utf-8") as f:
        video_ids = json.load(f)
    update_count = 0
    exists_count = 0
    for video_id in video_ids:
        gfys = Gfy.objects.filter(video_id=video_id)
        if len(gfys):
            exists_count += 1
            continue
        gfys = Gfy.objects.filter(imgur_id=video_id)
        if len(gfys) == 0:
            print(f"No gfys found for {video_id}")
            continue
        gfy = gfys[0]
        gfy.video_id = video_id
        gfy.save()
        update_count += 1
        print(f"Updated {update_count} gfys", end="\r")
    print(f"Updated {update_count} gfys. {exists_count} already existed.")


if __name__ == "__main__":
    main()
