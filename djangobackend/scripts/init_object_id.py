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


def main():
    gfys = Gfy.objects.all()
    print(f"Loaded {len(gfys)} gfys from db")
    for gfy in gfys:
        gfy.init_object_id()
        print(gfy.object_id)
        gfy.save()
    print("Finished. Confirming...")
    gfys = Gfy.objects.filter(object_id__isnull=True)
    assert len(gfys) == 0
    print("Confirmed.")


if __name__ == "__main__":
    main()
