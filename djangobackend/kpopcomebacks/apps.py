from django.apps import AppConfig


class KpopcomebacksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "kpopcomebacks"

    def ready(self):
        import kpopcomebacks.signals  # noqa: F401
