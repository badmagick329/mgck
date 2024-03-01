from django.urls import path
from kpopcomebacks import views
from kpopcomebacks.apps import KpopcomebacksConfig

app_name = KpopcomebacksConfig.name

urlpatterns = [
    path("", views.index, name="index"),
    path("search/", views.search, name="search"),
]
