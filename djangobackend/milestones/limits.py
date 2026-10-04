from django.core.exceptions import ValidationError

# Tombstones retain the evidence needed to reject stale offline snapshots.
# Count them toward the same durable quota instead of pruning and resurrecting.
MAX_OWNER_RECORDS = 1000


class MilestoneQuotaExceeded(ValidationError):
    def __init__(self):
        super().__init__(
            f"Milestone storage limit reached ({MAX_OWNER_RECORDS} records, "
            "including deleted records). Existing records can still be edited."
        )


def enforce_record_limit(existing_count: int, additions: int):
    # Preserve older over-limit accounts while preventing further growth.
    if additions and existing_count + additions > MAX_OWNER_RECORDS:
        raise MilestoneQuotaExceeded
