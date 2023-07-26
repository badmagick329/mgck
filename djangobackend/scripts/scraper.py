import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

os.environ["DJANGO_SETTINGS_MODULE"] = "djangobackend.settings"
import django

django.setup()

from urlshortener.models import ShortURL


def main():
    short_urls = ShortURL.objects.all()
    for short_url in short_urls:
        print(short_url)
        print(short_url.redirect_url)


if __name__ == "__main__":
    main()
