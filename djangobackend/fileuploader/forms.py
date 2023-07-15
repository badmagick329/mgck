from fileuploader.models import UploadedFile
from django import forms

class UploadedFileForm(forms.ModelForm):
    class Meta:
        model = UploadedFile
        fields = ['file']
