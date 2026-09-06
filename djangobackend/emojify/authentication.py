from dataclasses import dataclass

from djangobackend.internal_authentication import CorePrincipal, NextServiceAuthentication
from rest_framework.permissions import BasePermission


@dataclass(frozen=True)
class AiPrincipal(CorePrincipal):
    role: str


class AiAuthentication(NextServiceAuthentication):
    """Only the authenticated Next service may assert a verified Core role."""

    def authenticate(self, request):
        principal, _ = super().authenticate(request)
        role = self._decode_identity(request.headers.get("X-MGCK-Core-Role"))
        return AiPrincipal(principal.user_id, principal.username, role), None


class AiUserPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role != "NewUser"


class AiAdminPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "Admin"
