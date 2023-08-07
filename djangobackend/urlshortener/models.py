import string
from itertools import product
from typing import Iterable

from django.db import models
from dotenv import load_dotenv

from djangobackend.settings import BASE_URL

MAX_ID = 20
load_dotenv()

class ShortURL(models.Model):
    ID_SIZE = 4
    url = models.URLField()
    short_id = models.CharField(max_length=MAX_ID, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    accessed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"<ShortURL url={self.url}, "
            f"short_id={self.short_id}, "
            f"created={self.created}, "
            f"accessed={self.accessed}, "
            f"redirect_url={self.redirect_url}>"
        )

    @classmethod
    def create_id(cls) -> str | None:
        saved_ids = cls.objects.values_list("short_id", flat=True)
        saved_ids = set(saved_ids)
        ids = set()
        for perm in permute(string.ascii_letters + string.digits, cls.ID_SIZE):
            if perm in saved_ids:
                continue
            ids.add(perm)
            if len(ids) >= 50000:
                break
        if not ids:
            return None
        return ids.pop()

    @classmethod
    def request_custom_id(cls, custom_id: str) -> str | Exception:
        if " " in custom_id:
            return ValueError("Custom ID cannot contain spaces")
        if len(custom_id) > MAX_ID:
            return ValueError(f"{custom_id} is too long")
        if not custom_id.isalnum():
            return ValueError(f"{custom_id} is not alphanumeric")
        if cls.objects.filter(short_id=custom_id).exists():
            return ValueError(f"{custom_id} is already taken")

        return custom_id

    @property
    def redirect_url(self) -> str:
        return f"{BASE_URL}/{self.short_id}"


def permute(chars: str, max_length: int) -> Iterable[str]:
    for perm in product(chars, repeat=max_length):
        yield "".join(perm)
