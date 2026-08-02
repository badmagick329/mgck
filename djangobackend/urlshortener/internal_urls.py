from django.urls import path

from urlshortener import internal_views

app_name = "urlshortener_internal"

urlpatterns = [
    path("urls", internal_views.urls, name="urls"),
    path("url/<str:short_id>", internal_views.url, name="url"),
]
