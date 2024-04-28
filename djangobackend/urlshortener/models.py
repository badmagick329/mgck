import random
import string
from datetime import datetime

from django.db import models
from dotenv import load_dotenv

from djangobackend.settings import BASE_URL

MAX_ID = 20
load_dotenv()


class ShortURL(models.Model):
    url = models.URLField()
    short_id = models.CharField(max_length=MAX_ID, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    accessed = models.DateTimeField(auto_now=True)
    number_of_uses = models.PositiveIntegerField(default=0)

    def __str__(self):
        return (
            f"<ShortURL url={self.url}, "
            f"short_id={self.short_id}, "
            f"created={self.created}, "
            f"accessed={self.accessed}, "
            f"number_of_uses={self.number_of_uses}, "
            f"redirect_url={self.redirect_url}>"
        )

    @classmethod
    def generate_id(cls) -> str | Exception:
        saved_ids = cls.objects.values_list("short_id", flat=True)
        code = ShortCode().available_code(list(saved_ids))
        if code is None:
            return ValueError(f"All IDs in use")
        return code

    @classmethod
    def generate_custom_id(cls, custom_id: str) -> str | Exception:
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

    def visit(self) -> None:
        self.number_of_uses += 1
        self.accessed = datetime.now()
        self.save()

    @staticmethod
    def validate_url(url: str) -> str | None:
        if url == "" or "." not in url or " " in url:
            return "Please enter a valid URL"
        return None

    @classmethod
    def is_short_url(cls, url: str) -> bool:
        base_url = BASE_URL.split("://")[1]
        if base_url not in url:
            return False

        split = url.split("/")
        if len(split) != 4:
            return False

        return cls.objects.filter(short_id=split[-1]).exists()


class ShortCode:
    chars: str
    size: int

    def __init__(
        self,
        chars: str | None = None,
        size: int | None = None,
    ) -> None:
        self.chars = chars or (string.ascii_letters + string.digits)
        self.size = size or 4

    @property
    def max_ids(self):
        return len(self.chars) ** self.size

    def available_code(self, saved_ids: list[str]) -> str | None:
        id_ = "".join(random.choices(self.chars, k=self.size))
        if len(saved_ids) >= self.max_ids:
            return None
        while id_ in saved_ids:
            id_ = "".join(random.choices(self.chars, k=self.size))
        return id_
