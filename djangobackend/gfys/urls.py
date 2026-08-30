from django.urls import path
from gfys import views
from gfys.apps import GfysConfig

app_name = GfysConfig.name

urlpatterns = [
    path("gfy-upload", views.gfy_upload, name="gfy-upload"),
]
