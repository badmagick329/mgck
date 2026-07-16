from django.contrib import admin

from milestones.models import Milestone, MilestoneUser


class MilestoneAdmin(admin.ModelAdmin):
    list_display = (
        "event_name",
        "event_datetime_utc",
        "event_timezone",
        "created",
        "updated_at",
        "deleted_at",
        "created_by",
    )
    search_fields = [
        "created_by",
        "event_name",
        "event_datetime_utc",
        "event_timezone",
    ]


class MilestoneUserAdmin(admin.ModelAdmin):
    list_display = ("username", "core_user_id")
    search_fields = [
        "username",
        "core_user_id",
    ]


admin.site.register(Milestone, MilestoneAdmin)
admin.site.register(MilestoneUser, MilestoneUserAdmin)
