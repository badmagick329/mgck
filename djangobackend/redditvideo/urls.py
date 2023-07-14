from django.urls import path
from redditvideo import views
from redditvideo.apps import RedditvideoConfig

app_name = RedditvideoConfig.name

urlpatterns = [
    path("video/", views.reddit_video, name="reddit_video"),
]
