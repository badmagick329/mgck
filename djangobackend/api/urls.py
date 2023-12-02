from django.urls import path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from api import views

schema_view = get_schema_view(
    openapi.Info(
        title="Gif List API",
        default_version="v1",
        description="API for gif list",
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path(
        "docs/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("gfys", views.GfysList.as_view(), name="gfys"),
]

