from django.db import IntegrityError

from djangobackend.internal_authentication import CorePrincipal
from milestones.models import MilestoneUser


class OwnerConflict(Exception):
    pass


def get_or_create_owner(principal: CorePrincipal) -> MilestoneUser:
    owner = (
        MilestoneUser.objects.select_for_update()
        .filter(core_user_id=principal.user_id)
        .first()
    )
    if owner is not None:
        return owner

    legacy_owner = (
        MilestoneUser.objects.select_for_update()
        .filter(username=principal.username)
        .first()
    )
    if legacy_owner is not None:
        # A reusable username cannot prove ownership of records from an older identity.
        # Keep these records untouched until an administrator verifies the stable ID.
        raise OwnerConflict

    try:
        return MilestoneUser.objects.create(
            core_user_id=principal.user_id,
            username=principal.username,
        )
    except IntegrityError as error:
        raise OwnerConflict from error
