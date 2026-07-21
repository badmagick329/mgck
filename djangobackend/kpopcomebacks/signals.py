from django.db.models.signals import post_save
from django.dispatch import receiver

from kpopcomebacks.artist_credit_matches import (
    artist_credit_match_refresh_is_suspended,
    refresh_artist_credit_matches,
)
from kpopcomebacks.models import Artist


@receiver(post_save, sender=Artist)
def refresh_matches_after_artist_save(sender, instance: Artist, **kwargs):
    if not artist_credit_match_refresh_is_suspended():
        refresh_artist_credit_matches([instance.id])
