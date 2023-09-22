from django.contrib import admin
from fileuploader.models import UploadedFile,UploadUser

# Register your models here.
admin.site.register(UploadedFile)
admin.site.register(UploadUser)
