from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from django.db import transaction
from django.utils import timezone as django_timezone

from milestones.models import Milestone, MilestoneUser

MAX_FUTURE_SKEW = timedelta(minutes=5)


class SyncConflict(Exception):
    pass


@dataclass
class RecordState:
    public_id: UUID
    name: str
    event_datetime_utc: datetime
    event_timezone: str
    color: str
    updated_at: datetime
    deleted_at: datetime | None
    server_received_at: datetime
    database_id: int | None = None

    @classmethod
    def from_model(cls, milestone: Milestone):
        return cls(
            public_id=milestone.public_id,
            name=milestone.event_name,
            event_datetime_utc=milestone.event_datetime_utc,
            event_timezone=milestone.event_timezone,
            color=milestone.color,
            updated_at=milestone.updated_at,
            deleted_at=milestone.deleted_at,
            server_received_at=milestone.server_received_at,
            database_id=milestone.pk,
        )


def datetime_from_milliseconds(value: int) -> datetime:
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc)


def milliseconds_from_datetime(value: datetime) -> int:
    return int(value.timestamp() * 1000)


def serialize_record(milestone: Milestone) -> dict:
    return {
        "public_id": str(milestone.public_id),
        "name": milestone.event_name,
        "timestamp": milliseconds_from_datetime(milestone.event_datetime_utc),
        "timezone": milestone.event_timezone,
        "color": milestone.color,
        "updated_at": milliseconds_from_datetime(milestone.updated_at),
        "deleted_at": (
            milliseconds_from_datetime(milestone.deleted_at)
            if milestone.deleted_at is not None
            else None
        ),
    }


def _incoming_state(record: dict, received_at: datetime) -> RecordState:
    updated_at = datetime_from_milliseconds(record["updated_at"])
    deleted_at = (
        datetime_from_milliseconds(record["deleted_at"])
        if record["deleted_at"] is not None
        else None
    )
    if updated_at > received_at + MAX_FUTURE_SKEW:
        updated_at = received_at
        if deleted_at is not None:
            deleted_at = received_at

    return RecordState(
        public_id=record["public_id"],
        name=record["name"],
        event_datetime_utc=datetime_from_milliseconds(record["timestamp"]),
        event_timezone=record["timezone"],
        color=record["color"],
        updated_at=updated_at,
        deleted_at=deleted_at,
        server_received_at=received_at,
    )


def _same_payload(first: RecordState, second: RecordState) -> bool:
    return (
        first.name == second.name
        and first.event_datetime_utc == second.event_datetime_utc
        and first.event_timezone == second.event_timezone
        and first.color == second.color
        and first.updated_at == second.updated_at
        and first.deleted_at == second.deleted_at
    )


def _state_changed(state: RecordState, model: Milestone | None) -> bool:
    return model is None or not _same_payload(
        state, RecordState.from_model(model)
    )


def _resolve_same_name_conflicts(
    states: dict[UUID, RecordState], received_at: datetime
):
    active_by_name: dict[str, list[RecordState]] = {}
    for state in states.values():
        if state.deleted_at is None:
            active_by_name.setdefault(state.name, []).append(state)

    for records in active_by_name.values():
        if len(records) < 2:
            continue
        winner = max(
            records,
            key=lambda state: (
                state.updated_at,
                state.server_received_at,
                str(state.public_id),
            ),
        )
        for loser in records:
            if loser.public_id == winner.public_id:
                continue
            resolution_at = max(
                received_at, winner.updated_at, loser.updated_at
            )
            loser.updated_at = resolution_at
            loser.deleted_at = resolution_at
            loser.server_received_at = received_at


@transaction.atomic
def merge_snapshot(
    owner: MilestoneUser,
    records: list[dict],
    received_at: datetime | None = None,
) -> list[dict]:
    received_at = received_at or django_timezone.now()
    owner = MilestoneUser.objects.select_for_update().get(pk=owner.pk)
    incoming_ids = [record["public_id"] for record in records]

    if (
        incoming_ids
        and Milestone.objects.filter(public_id__in=incoming_ids)
        .exclude(created_by=owner)
        .exists()
    ):
        raise SyncConflict

    existing_models = list(
        Milestone.objects.select_for_update().filter(created_by=owner)
    )
    models_by_id = {
        milestone.public_id: milestone for milestone in existing_models
    }
    states = {
        milestone.public_id: RecordState.from_model(milestone)
        for milestone in existing_models
    }

    for record in records:
        incoming = _incoming_state(record, received_at)
        current = states.get(incoming.public_id)
        if current is None:
            states[incoming.public_id] = incoming
            continue
        if incoming.updated_at < current.updated_at:
            continue
        if incoming.updated_at == current.updated_at and _same_payload(
            incoming, current
        ):
            continue
        incoming.database_id = current.database_id
        states[incoming.public_id] = incoming

    _resolve_same_name_conflicts(states, received_at)

    changed_states = [
        state
        for state in states.values()
        if _state_changed(state, models_by_id.get(state.public_id))
    ]
    changed_states.sort(key=lambda state: state.deleted_at is None)

    changed_active_ids = [
        state.database_id
        for state in changed_states
        if state.deleted_at is None and state.database_id is not None
    ]
    if changed_active_ids:
        Milestone.objects.filter(pk__in=changed_active_ids).update(
            deleted_at=received_at
        )

    for state in changed_states:
        values = {
            "event_name": state.name,
            "event_datetime_utc": state.event_datetime_utc,
            "event_timezone": state.event_timezone,
            "color": state.color,
            "updated_at": state.updated_at,
            "deleted_at": state.deleted_at,
            "server_received_at": state.server_received_at,
        }
        if state.database_id is None:
            milestone = Milestone.objects.create(
                public_id=state.public_id,
                created_by=owner,
                **values,
            )
            state.database_id = milestone.pk
        else:
            Milestone.objects.filter(pk=state.database_id).update(**values)

    authoritative = Milestone.objects.filter(created_by=owner).order_by(
        "public_id"
    )
    return [serialize_record(milestone) for milestone in authoritative]
