from datetime import datetime

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver


class UploadedFile(models.Model):
    file = models.FileField(upload_to="")
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
            f"uploaded_by={self.uploaded_by}, "
            f"uploaded_at={self.uploaded_at})>"
        )


@receiver(post_delete, sender=UploadedFile)
def delete_file(sender, instance, **kwargs):
    instance.file.delete(False)
