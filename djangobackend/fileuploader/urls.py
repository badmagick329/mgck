from django.urls import path
from fileuploader import views
from fileuploader.apps import FileuploaderConfig

app_name = FileuploaderConfig.name

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("upload/", views.upload_file, name="upload_file"),
    path("delete/<int:file_id>/", views.delete_file, name="delete_file"),
    path("", views.list_files, name="list_files"),
]
