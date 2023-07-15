from django.urls import path
from fileuploader import views
from fileuploader.apps import FileuploaderConfig

app_name = FileuploaderConfig.name

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("", views.upload_file, name="upload_file"),
]
