from django.apps import AppConfig


class GestionInventarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gestion_inventario'

    def ready(self):
        # Import signals to register blockchain hooks
        try:
            from . import signals_blockchain  # noqa: F401
        except Exception:
            # Avoid breaking app startup if signals fail; log if desired
            pass
