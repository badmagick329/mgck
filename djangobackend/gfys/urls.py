from django.urls import path
from gfys import views
from gfys.apps import GfysConfig

app_name = GfysConfig.name

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("gfy-list", views.gfylist, name="gfy-list"),
    path("imgur-form", views.imgur_form, name="imgur-form"),
    path("imgur-upload", views.imgur_upload, name="imgur-upload"),
    path("fetch-title", views.fetch_title, name="fetch-title"),
    path("video/<str:object_id>", views.video, name="video"),
]
