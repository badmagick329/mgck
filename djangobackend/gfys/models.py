import re
from datetime import date as Date
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models

VIDEO_URL = settings.VIDEO_URL


class GfyUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    account = models.ForeignKey(
        "Account", on_delete=models.SET_NULL, blank=True, null=True
    )

    def __str__(self):
        return f"<GfyUser(user={self.user}, account={self.account})>"


class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:  # type: ignore
        ordering = ["name"]

    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name})>"  # type: ignore

    def __str__(self):
        return self.name


class Account(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:  # type: ignore
        ordering = ["name"]

    def __repr__(self):
        return f"<Account(id={self.id}, name={self.name})>"  # type: ignore

    def __str__(self):
        return self.name


class Gfy(models.Model):
    IMGUR_RE = re.compile(r"https://i.imgur.com/(.*).mp4")
    IMGUR_BASE_URL = "https://i.imgur.com/"
    GFYCAT_BASE_URL = "https://gfycat.com/"

    object_id = models.CharField(
        max_length=20, unique=True, blank=True, null=True, default=None
    )
    imgur_id = models.CharField(
        max_length=20, unique=True, blank=True, null=True
    )
    gfy_id = models.CharField(max_length=100, blank=True, null=True)
    video_id = models.CharField(
        max_length=20, unique=True, blank=True, null=True, default=None
    )
    tags = models.ManyToManyField(Tag, related_name="gfys")
    imgur_title = models.CharField(max_length=255)
    gfy_title = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, blank=True, null=True
    )

    class Meta:  # type: ignore
        ordering = ["-date"]

    def __str__(self):
        return (
            f"<Gfy(id={self.id}, imgur_id={self.imgur_id}, object_id={self.object_id}, "  # type: ignore
            f"gfy_id={self.gfy_id}, video_id={self.video_id}, "
            f"imgur_title={self.imgur_title}, gfy_title={self.gfy_title}, "
            f"date={self.date}), account={self.account}>"
        )

    def init_object_id(self):
        assert self.video_id or self.imgur_id
        self.object_id = self.video_id or self.imgur_id

    @property
    def video_url(self) -> str:
        return f"{VIDEO_URL}/{self.video_id}.mp4"

    @property
    def imgur_url(self) -> str:
        return f"{self.IMGUR_BASE_URL}{self.imgur_id}"

    @property
    def imgur_gifv_url(self) -> str:
        return f"{self.IMGUR_BASE_URL}{self.imgur_id}.gifv"

    @property
    def imgur_mp4_url(self) -> str:
        return f"{self.IMGUR_BASE_URL}{self.imgur_id}.mp4"

    @property
    def gfy_url(self) -> str:
        return f"{self.GFYCAT_BASE_URL}{self.gfy_id}"

    @property
    def thumbnail(self) -> str:
        return f"{self.IMGUR_BASE_URL}{self.imgur_id}.jpg"

    @classmethod
    def from_dict(cls, data: dict) -> "Gfy":
        """
        Create or update a gfy from a dict.

        Parameters
        ----------
        data : dict
            expected keys:
                imgur_url : str,
                imgur_title : str,
            optional keys:
                gfy_id : str | None,
                gfy_title : str | None,
                tags : list[str] | None,
                account : str | None,

        Following fields will not be updated if a gfy with the same imgur_id already exists:

        - imgur_id
        - gfy_id
        - imgur_title
        - gfy_title

        Returns
        -------
        "Gfy"

        """
        gfy = cls._get_or_create_gfy(data)
        tags = data.get("tags", None) or list()
        cls._update_tags(gfy, tags)
        account = data.get("account", None)
        cls._update_account(gfy, account)
        cls.update_date(gfy)
        return gfy

    @staticmethod
    def gfy_date(tags: list[str], title: str) -> Date | None:
        date = None
        if tags:
            date = Gfy.date_from(tags)
            if date is not None:
                return date
        return Gfy.date_from(
            [w.strip() for w in title.split(" ") if w.strip()]
        )

    @staticmethod
    def date_from(words: list[str]) -> Date | None:
        for w in words:
            date = Gfy.text_to_date(w)
            if date is not None:
                return date

    @staticmethod
    def text_to_date(t: str) -> Date | None:
        if not t.isdigit():
            return None
        date_str = f"20{t}" if len(t) == 6 else t
        try:
            date = datetime.strptime(date_str, "%Y%m%d").date()
            return date
        except ValueError:
            return None

    @classmethod
    def _get_or_create_gfy(cls, data: dict) -> "Gfy":
        match = re.search(cls.IMGUR_RE, data["imgur_url"])
        if match is None:
            raise ValueError(f"Invalid imgur_url {data['imgur_url']}")
        gfy = cls.objects.filter(imgur_id=match.group(1)).first()
        if gfy is None:
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
        return gfy

    @classmethod
    def _update_tags(cls, gfy: "Gfy", tags: list[str]) -> None:
        for tag in tags:
            t, _ = Tag.objects.get_or_create(name=tag)
            gfy.tags.add(t)
        saved_tags = gfy.tags.all()
        for tag in saved_tags:
            if tag.name not in tags:
                gfy.tags.remove(tag)

    @classmethod
    def _update_account(cls, gfy: "Gfy", account: str | None) -> None:
        if account is None:
            return
        a, _ = Account.objects.get_or_create(name=account)
        gfy.account = a
        gfy.save()

    @classmethod
    def update_date(cls, gfy: "Gfy") -> None:
        title = gfy.imgur_title
        rindex = title.rfind("_[")
        if rindex != -1:
            title = title[:rindex]
        tags = [t.name for t in gfy.tags.all()]
        date = cls.gfy_date(tags, title)
        gfy.date = date
        gfy.save()
