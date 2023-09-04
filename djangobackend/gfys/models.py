import re
from datetime import date as Date
from datetime import datetime

from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver


class Tag(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ["name"]
        unique_together = ["name"]

    def __str__(self):
        return f"<Tag(id={self.id}, name={self.name})>"


class Gfy(models.Model):
    IMGUR_RE = re.compile(r"https://i.imgur.com/(.*).mp4")

    imgur_id = models.CharField(max_length=20)
    gfy_id = models.CharField(max_length=100, blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name="gfys")
    imgur_title = models.CharField(max_length=255)
    gfy_title = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ["imgur_id"]

    def __str__(self):
        return (
            f"<Gfy(id={self.id}, imgur_id={self.imgur_id}, gfy_id={self.gfy_id}, "
            f"imgur_title={self.imgur_title}, gfy_title={self.gfy_title}, "
            f"date={self.date})>"
        )

    @property
    def imgur_url(self) -> str:
        return f"https://i.imgur.com/{self.imgur_id}"

    @property
    def imgur_gifv_url(self) -> str:
        return f"https://i.imgur.com/{self.imgur_id}.gifv"

    @property
    def imgur_mp4_url(self) -> str:
        return f"https://i.imgur.com/{self.imgur_id}.mp4"

    @property
    def gfy_url(self) -> str:
        return f"https://gfycat.com/{self.gfy_id}"

    @property
    def thumbnail(self) -> str:
        return f"https://i.imgur.com/{self.imgur_id}.jpg"

    @classmethod
    def from_dict(cls, data: dict) -> "Gfy":
        match = re.search(cls.IMGUR_RE, data["imgur_url"])
        if match is None:
            raise ValueError(f"Invalid imgur_url {data['imgur_url']}")
        saved_gfy = cls.objects.filter(imgur_id=match.group(1))
        if saved_gfy.exists():
            gfy = saved_gfy.first()
            gfy_title = gfy.gfy_title
            gfy_id = gfy.gfy_id
            imgur_title = gfy.imgur_title
        else:
            imgur_id = match.group(1)
            gfy_id = data.get("gfy_id", None)
            imgur_title = data["imgur_title"]
            gfy_title = data.get("gfy_title", None)
            gfy = cls(
                imgur_id=imgur_id,
                gfy_id=gfy_id,
                imgur_title=imgur_title,
                gfy_title=gfy_title,
            )
            gfy.save()
        if data["tags"] is None:
            tags_strlist = list()
        else:
            tags_strlist = [t.strip() for t in data["tags"]]
            gfy_tags = [t.name for t in gfy.tags.all()]
            for tag in data["tags"]:
                if tag in gfy_tags:
                    continue
                t, _ = Tag.objects.get_or_create(name=tag)
                gfy.tags.add(t)
        title = imgur_title
        if "_[" in title and title.endswith("]"):
            title = title.split("_[")[0]
        date = cls.gfy_date(tags_strlist, title)
        gfy.date = date
        gfy.save()
        return gfy

    @staticmethod
    def gfy_date(tags: list[str], title: str) -> Date | None:
        date = None
        for t in tags:
            date = Gfy.text_to_date(t)
            if date is not None:
                return date
        words = [w.strip() for w in title.split(" ") if w.strip()]
        for w in words:
            date = Gfy.text_to_date(w)
            if date is not None:
                return date

    @staticmethod
    def text_to_date(t: str) -> Date | None:
        if not t.isdigit():
            return None
        if len(t) == 6:
            date_str = f"20{t}"
        else:
            date_str = t
        try:
            date = datetime.strptime(date_str, "%Y%m%d").date()
            return date
        except ValueError:
            return None
