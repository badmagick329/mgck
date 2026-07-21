from django.core.management.base import BaseCommand

from kpopcomebacks.artist_credit_matches import refresh_artist_credit_matches
from kpopcomebacks.models import Artist


class Command(BaseCommand):
    help = "Backfill or resume precomputed followed-artist credit matches."

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=250,
            help="Number of changed artist ids to refresh per batch.",
        )
        parser.add_argument(
            "--start-after-id",
            type=int,
            default=0,
            help="Resume after the last successfully reported artist id.",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        if batch_size < 1:
            raise ValueError("--batch-size must be at least 1")

        artist_ids = Artist.objects.filter(id__gt=options["start_after_id"]).order_by(
            "id"
        ).values_list("id", flat=True)
        batch: list[int] = []
        processed = 0
        for artist_id in artist_ids.iterator():
            batch.append(artist_id)
            if len(batch) == batch_size:
                refresh_artist_credit_matches(batch)
                processed += len(batch)
                self.stdout.write(
                    f"Processed {processed} artists; resume with --start-after-id {batch[-1]}"
                )
                batch = []
        if batch:
            refresh_artist_credit_matches(batch)
            processed += len(batch)
            self.stdout.write(
                f"Processed {processed} artists; resume with --start-after-id {batch[-1]}"
            )
        self.stdout.write(self.style.SUCCESS(f"Completed {processed} artists."))
