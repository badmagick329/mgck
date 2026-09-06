from django.db import models

class AiControl(models.Model):
    """One durable switch governs AI admission across all workers."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [models.CheckConstraint(check=models.Q(id=1), name="emojify_single_control")]


class AiUsage(models.Model):
    """Keep attributable usage without retaining private message content."""

    user_id = models.CharField(max_length=255)
    username = models.CharField(max_length=255)
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=10, default="pending", choices=[
        ("pending", "Pending"), ("succeeded", "Succeeded"), ("failed", "Failed")
    ])
    input_characters = models.PositiveIntegerField()
    prompt_tokens = models.PositiveIntegerField(null=True)
    output_tokens = models.PositiveIntegerField(null=True)
    total_tokens = models.PositiveIntegerField(null=True)
