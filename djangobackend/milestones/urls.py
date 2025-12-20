from django.urls import path

from milestones import views
from milestones.apps import MilestonesConfig

app_name = MilestonesConfig.name

urlpatterns = [
    #
    path("", views.milestones, name="milestones")
]
