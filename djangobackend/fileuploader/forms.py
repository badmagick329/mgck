from django import forms
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
