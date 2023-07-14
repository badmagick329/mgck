from django.urls import path
from fileuploader import views
from fileuploader.apps import FileuploaderConfig

app_name = FileuploaderConfig.name

urlpatterns = [
    path("", views.upload_file, name="upload_file"),
]
