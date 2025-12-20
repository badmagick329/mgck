from django.urls import path

from milestones import views
from milestones.apps import MilestonesConfig

app_name = MilestonesConfig.name

urlpatterns = [
    path("", views.list_milestones, name="list_milestones"),
    path("create/", views.create_milestone, name="create_milestone"),
    path("update/", views.update_milestone_endpoint, name="update_milestone"),
    path("delete/", views.delete_milestone_endpoint, name="delete_milestone"),
]
