from django.urls import path
from emojify import views
from emojify.apps import EmojifyConfig

app_name = EmojifyConfig.name

urlpatterns = [
    path("convert/", views.convert, name="convert"),
    path("", views.index, name="index"),
]
