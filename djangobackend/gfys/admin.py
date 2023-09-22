from django.contrib import admin
from gfys.models import Gfy, Tag, Account, GfyUser


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
    ]


class TagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ["name"]

class AccountAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ["name"]

class GfyUserAdmin(admin.ModelAdmin):
    list_display = ("user", "account")
    search_fields = ["user", "account"]


admin.site.register(Gfy, GfyAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Account, AccountAdmin)
admin.site.register(GfyUser, GfyUserAdmin)
