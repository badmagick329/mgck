from django.urls import path

from urlshortener import views
from urlshortener.apps import UrlshortenerConfig

app_name = UrlshortenerConfig.name

urlpatterns = [
    path(
        "api/urlshortener/shortened/<str:short_id>",
        views.shortened_url_target,
        name="target_url_api",
    ),
    path("api/urlshortener/v2/url/<str:short_id>", views.url, name="url"),
]
