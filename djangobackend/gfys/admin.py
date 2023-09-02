from django.contrib import admin
from gfys.models import Gfy, Tag


class GfyAdmin(admin.ModelAdmin):
    list_display = ("imgur_id", "gfy_id", "imgur_title", "gfy_title", "date")
    search_fields = ["imgur_id", "gfy_id", "imgur_title", "gfy_title", "date"]


class TagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ["name"]


admin.site.register(Gfy, GfyAdmin)
admin.site.register(Tag, TagAdmin)
