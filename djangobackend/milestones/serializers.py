from datetime import datetime, timezone

from rest_framework import serializers


class SyncRecordSerializer(serializers.Serializer):
    public_id = serializers.UUIDField()
    name = serializers.CharField(max_length=255, trim_whitespace=True)
    timestamp = serializers.IntegerField()
    timezone = serializers.CharField(max_length=63, trim_whitespace=True)
    color = serializers.RegexField(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    updated_at = serializers.IntegerField(min_value=0)
    deleted_at = serializers.IntegerField(min_value=0, allow_null=True)

    def validate_timestamp(self, value):
        return self._validate_epoch_milliseconds(value, "event timestamp")

    def validate_updated_at(self, value):
        return self._validate_epoch_milliseconds(value, "updated_at")

    def validate_deleted_at(self, value):
        if value is None:
            return value
        return self._validate_epoch_milliseconds(value, "deleted_at")

    @staticmethod
    def _validate_epoch_milliseconds(value, label):
        try:
            datetime.fromtimestamp(value / 1000, tz=timezone.utc)
        except (ValueError, OverflowError, OSError) as error:
            raise serializers.ValidationError(f"Invalid {label}") from error
        return value

    def validate(self, attrs):
        deleted_at = attrs.get("deleted_at")
        if deleted_at is not None and deleted_at != attrs["updated_at"]:
            raise serializers.ValidationError(
                "deleted_at must equal updated_at for tombstones"
            )
        return attrs


class SyncSnapshotSerializer(serializers.Serializer):
    records = SyncRecordSerializer(many=True, max_length=1000)

    def validate_records(self, records):
        public_ids = [record["public_id"] for record in records]
        if len(public_ids) != len(set(public_ids)):
            raise serializers.ValidationError("Duplicate public_id values")
        return records
