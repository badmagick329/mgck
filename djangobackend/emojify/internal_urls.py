from django.urls import path
from emojify import internal_views

app_name = "emojify_internal"
urlpatterns = [
    path("generate", internal_views.generate_view, name="generate"),
    path("control", internal_views.control_view, name="control"),
    path("usage", internal_views.usage_view, name="usage"),
]
