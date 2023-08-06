from django.contrib import admin
from kpopcomebacks.models import Artist, Release, ReleaseType


class ArtistAdmin(admin.ModelAdmin):
    list_display = ("name", "id")
    search_fields = ["name"]


class ReleaseAdmin(admin.ModelAdmin):
    list_display = ("artist", "album", "title", "release_date", "release_type", "urls")
    search_fields = [
        "artist__name",
        "album",
        "title",
        "release_date",
        "release_type__name",
    ]


admin.site.register(Artist, ArtistAdmin)
admin.site.register(Release, ReleaseAdmin)
admin.site.register(ReleaseType)
