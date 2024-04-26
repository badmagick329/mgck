from django.urls import path
from urlshortener import views
from urlshortener.apps import UrlshortenerConfig

app_name = UrlshortenerConfig.name

urlpatterns = [
    path("api/urlshortener/shorten/", views.shorten_api, name="shorten_api"),
    path(
        "api/urlshortener/shortened/<str:short_id>",
        views.target_url_api,
        name="target_url_api",
    ),
]
