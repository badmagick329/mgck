from django import forms
from django.contrib import admin
from django.template.defaultfilters import filesizeformat
from fileuploader.models import UploadedFile, UploadUser


class UploadUserAdminForm(forms.ModelForm):
    QUOTA_UNITS = (
        ("MB", 1024 * 1024),
        ("GB", 1024 * 1024 * 1024),
        ("TB", 1024 * 1024 * 1024 * 1024),
    )

    quota_value = forms.IntegerField(
        min_value=1,
        required=False,
        initial=1,
        help_text="Friendly quota amount for non-unlimited users.",
        label="Quota amount",
    )
    quota_unit = forms.ChoiceField(
        choices=[(unit, unit) for unit, _ in QUOTA_UNITS],
        required=False,
        initial="GB",
        label="Quota unit",
    )

    class Meta:  # type: ignore
        model = UploadUser
        fields = ("user", "is_unlimited")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance = self.instance
        if instance and instance.pk:
            quota_value, quota_unit = self.quota_value_and_unit(
                instance.storage_quota_bytes
            )
            self.fields["quota_value"].initial = quota_value
            self.fields["quota_unit"].initial = quota_unit

    def clean(self):
        cleaned_data = super().clean()
        is_unlimited = cleaned_data.get("is_unlimited")
        quota_value = cleaned_data.get("quota_value")
        quota_unit = cleaned_data.get("quota_unit")

        if not is_unlimited:
            if quota_value is None or quota_unit is None:
                raise forms.ValidationError(
                    "Please provide a quota amount and unit, or mark the user as unlimited."
                )
            cleaned_data["storage_quota_bytes"] = quota_value * dict(
                self.QUOTA_UNITS
            )[quota_unit]
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.cleaned_data.get("is_unlimited"):
            instance.storage_quota_bytes = 0
        else:
            instance.storage_quota_bytes = self.cleaned_data[
                "storage_quota_bytes"
            ]
        if commit:
            instance.save()
        return instance

    @classmethod
    def quota_value_and_unit(cls, quota_bytes: int) -> tuple[int, str]:
        for unit, multiplier in reversed(cls.QUOTA_UNITS):
            if quota_bytes >= multiplier and quota_bytes % multiplier == 0:
                return quota_bytes // multiplier, unit
        return max(quota_bytes // (1024 * 1024), 1), "MB"


@admin.register(UploadUser)
class UploadUserAdmin(admin.ModelAdmin):
    form = UploadUserAdminForm
    list_display = (
        "user",
        "is_unlimited",
        "quota_display",
        "used_storage_display",
    )
    list_filter = ("is_unlimited",)
    search_fields = ("user__username",)
    autocomplete_fields = ("user",)
    readonly_fields = ("used_storage_display",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "is_unlimited",
                    ("quota_value", "quota_unit"),
                    "used_storage_display",
                )
            },
        ),
    )

    @admin.display(description="Quota")
    def quota_display(self, obj: UploadUser) -> str:
        if obj.is_unlimited:
            return "Unlimited"
        return filesizeformat(obj.storage_quota_bytes)

    @admin.display(description="Used storage")
    def used_storage_display(self, obj: UploadUser) -> str:
        return filesizeformat(obj.used_storage_bytes)


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "uploaded_by",
        "stored_size_display",
        "uploaded_at",
    )
    search_fields = ("original_name", "uploaded_by__username")
    list_filter = ("uploaded_at",)
    autocomplete_fields = ("uploaded_by",)
    readonly_fields = (
        "original_name",
        "stored_size_bytes",
        "content_type",
        "uploaded_at",
    )

    @admin.display(description="Stored size")
    def stored_size_display(self, obj: UploadedFile) -> str:
        return filesizeformat(obj.stored_size_bytes)
