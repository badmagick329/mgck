from django.urls import path
from urlshortener import views
from urlshortener.apps import UrlshortenerConfig

app_name = UrlshortenerConfig.name

urlpatterns = [
    path("", views.index, name="index"),
    path("s/", views.shortener, name="shortener"),
    path("shorten/", views.shorten, name="shorten"),
    path("<str:short_id>", views.target_url, name="target_url"),
]
