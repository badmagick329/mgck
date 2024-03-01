from django import forms
from fileuploader.models import UploadedFile


class UploadedFileForm(forms.ModelForm):
    class Meta:  # type: ignore
        model = UploadedFile
        fields = ["file"]
