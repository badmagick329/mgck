from django.urls import path
from gfys import views
from gfys.apps import GfysConfig

app_name = GfysConfig.name

urlpatterns = [
    path("", views.index, name="index"),
    path("gfy-list", views.gfylist, name="gfy-list"),
]
