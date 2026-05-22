import os
from uuid import uuid4

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_delete
from django.dispatch import receiver


def uploaded_file_path(instance: "UploadedFile", filename: str) -> str:
    username = instance.uploaded_by.username if instance.uploaded_by else "anonymous"
    _, ext = os.path.splitext(filename)
    return f"fileuploader/{username}/{uuid4().hex}{ext.lower()}"


class UploadUser(models.Model):
    DEFAULT_STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_unlimited = models.BooleanField(default=False)
    storage_quota_bytes = models.BigIntegerField(
        default=DEFAULT_STORAGE_QUOTA_BYTES,
    )

    def __str__(self):
        return (
            f"<UploadUser(user={self.user}, "
            f"is_unlimited={self.is_unlimited}, "
            f"storage_quota_bytes={self.storage_quota_bytes})>"
        )

    @property
    def used_storage_bytes(self) -> int:
        return self.user.uploaded_files.aggregate(
            total=Sum("stored_size_bytes")
        )["total"] or 0

    @property
    def remaining_storage_bytes(self) -> int | None:
        if self.is_unlimited:
            return None
        return max(self.storage_quota_bytes - self.used_storage_bytes, 0)

    def can_store(self, file_size: int) -> bool:
        if self.is_unlimited:
            return True
        return self.used_storage_bytes + file_size <= self.storage_quota_bytes


class UploadedFile(models.Model):
    file = models.FileField(upload_to=uploaded_file_path)
    original_name = models.CharField(max_length=255, blank=True, default="")
    stored_size_bytes = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=255, blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="uploaded_files",
        null=True,
    )

    def __str__(self):
        return (
            f"<UploadedFile(file={self.file}, "
            f"original_name={self.original_name}, "
            f"stored_size_bytes={self.stored_size_bytes}, "
            f"content_type={self.content_type}, "
            f"uploaded_by={self.uploaded_by}, "
            f"uploaded_at={self.uploaded_at})>"
        )

    @property
    def display_name(self) -> str:
        return self.original_name or os.path.basename(self.file.name)


@receiver(post_delete, sender=UploadedFile)
def delete_file(sender, instance, **kwargs):
    instance.file.delete(False)
