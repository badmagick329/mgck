from api.views import gfys, kpopcomebacks
from django.urls import path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="mgck API",
        default_version="v1",
        description="API endpoints for mgck",
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
    path("gfys", gfys.GfysList.as_view(), name="gfys"),
    path("gfys/<str:id>", gfys.GfyDetails.as_view(), name="gfy"),
    path("accounts", gfys.AccountsList.as_view(), name="accounts"),
    path(
        "gfy/views",
        gfys.GfyViewCountView.as_view(),
        name="gfy-views",
    ),
    path(
        "kpopcomebacks",
        kpopcomebacks.KpopComebackList.as_view(),
        name="kpopcomebacks",
    ),
]
