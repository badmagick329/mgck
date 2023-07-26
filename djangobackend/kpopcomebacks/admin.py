from django.contrib import admin
from kpopcomebacks.models import Artist, Release, ReleaseType

# Register your models here.
admin.site.register(Artist)
admin.site.register(Release)
admin.site.register(ReleaseType)
