from django.contrib import admin

from milestones.models import Milestone, MilestoneUser


class MilestoneAdmin(admin.ModelAdmin):
    list_display = (
        "event_name",
        "event_datetime_utc",
        "event_timezone",
        "created",
        "created_by",
    )
    search_fields = [
        "created_by",
        "event_name",
        "event_datetime_utc",
        "event_timezone",
    ]


class MilestoneUserAdmin(admin.ModelAdmin):
    list_display = ("username",)
    search_fields = [
        "username",
    ]


admin.site.register(Milestone, MilestoneAdmin)
admin.site.register(MilestoneUser, MilestoneUserAdmin)
