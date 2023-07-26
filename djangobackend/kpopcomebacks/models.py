from django.db import models

class Artist(models.Model):
    name = models.CharField(max_length=510)

    def __str__(self):
        return f"<Artist(id={self.id}, name={self.name})>"


class Release(models.Model):
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    album = models.CharField(max_length=510)
    title = models.CharField(max_length=510)
    release_date = models.DateField()
    release_type = models.ForeignKey("ReleaseType", on_delete=models.CASCADE)
    urls = models.JSONField(null=True, blank=True)

    def __str__(self):
        return (
            f"<Release(id={self.id}, artist={self.artist}, "
            f"album={self.album}, title={self.title}, "
            f"release_date={self.release_date}, "
            f"release_type={self.release_type}, urls={self.urls})>"
        )


class ReleaseType(models.Model):
    name = models.CharField(max_length=510)

    def __str__(self):
        return f"<ReleaseType(id={self.id}, name={self.name})>"
