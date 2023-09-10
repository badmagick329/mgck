from django.contrib import admin
from gfys.models import Gfy, Tag, Account


class GfyAdmin(admin.ModelAdmin):
    list_display = (
        "imgur_id",
        "gfy_id",
        "imgur_title",
        "gfy_title",
        "date",
        "account",
    )
    search_fields = [
        "imgur_id",
        "gfy_id",
        "imgur_title",
        "gfy_title",
        "date",
        "account",
    ]


class TagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ["name"]

class AccountAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ["name"]


admin.site.register(Gfy, GfyAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Account, AccountAdmin)
