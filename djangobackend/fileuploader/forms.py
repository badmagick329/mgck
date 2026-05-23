from django import forms
from django.contrib.auth.forms import PasswordChangeForm
from fileuploader.models import UploadedFile


class UploadedFileForm(forms.ModelForm):
    class Meta:  # type: ignore
        model = UploadedFile
        fields = ["file"]
        widgets = {
            "file": forms.FileInput(
                attrs={
                    "class": (
                        "block w-full text-sm text-slate-600 "
                        "file:mr-4 file:rounded file:border-0 "
                        "file:bg-slate-800 file:px-4 file:py-2 "
                        "file:font-semibold file:text-white hover:file:bg-slate-900"
                    )
                }
            )
        }

    def clean_file(self):
        file = self.cleaned_data.get("file")
        if file is None:
            raise forms.ValidationError("Please choose a file to upload.")
        return file


class StyledPasswordChangeForm(PasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        field_config = {
            "old_password": {
                "placeholder": "Current password",
                "autocomplete": "current-password",
            },
            "new_password1": {
                "placeholder": "New password",
                "autocomplete": "new-password",
            },
            "new_password2": {
                "placeholder": "Confirm new password",
                "autocomplete": "new-password",
            },
        }

        for field_name, config in field_config.items():
            field = self.fields[field_name]
            field.widget.attrs.update(
                {
                    "class": "fu-login-input",
                    "placeholder": config["placeholder"],
                    "autocomplete": config["autocomplete"],
                }
            )
