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

from gfys.models import Gfy, Tag

LOG_LEVEL = logging.DEBUG
IMGUR_JSON = BASE_DIR / "scripts" / "data" / "imgur.json"


def main():
    with open(IMGUR_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Loaded {len(data)} gfys from {IMGUR_JSON}")
    for i, gfy in enumerate(data):
        print(f"{i+1}/{len(data)}", end="\r")
        try:
            g = Gfy.from_dict(gfy)
        except ValueError as e:
            print(f"Error creating gfy: {e}")
            break


if __name__ == "__main__":
    main()
