from rest_framework.decorators import api_view
from rest_framework.response import Response

from milestones.apps import MilestonesConfig

app_name = MilestonesConfig.name


@api_view(["GET", "POST"])
def milestones(request):
    print(request.method)
    return Response({"message": "hello"}, status=200)
