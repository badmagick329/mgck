from pathlib import Path
import sys
import os
import django

BASE_DIR = Path(__file__).resolve().parent.parent.parent

if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"
django.setup()

