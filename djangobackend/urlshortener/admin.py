from django.contrib import admin

from urlshortener.models import ShortURL


class ShortURLAdmin(admin.ModelAdmin):
    list_display = (
        "url",
        "short_id",
        "created",
        "created_by",
        "accessed",
        "number_of_uses",
        "redirect_url",
    )
    search_fields = [
        "url",
        "short_id",
        "created",
        "created_by",
    ]


admin.site.register(ShortURL, ShortURLAdmin)
