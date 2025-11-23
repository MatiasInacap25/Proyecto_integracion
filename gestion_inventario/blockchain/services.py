"""
Service layer to obtain a Fabric client according to settings/environment.

If `FABRIC_ENABLED` is truthy (env var or Django settings), a real client would be returned.
Otherwise a MockFabricClient is returned for development.
"""
import os
from django.conf import settings
from .fabric_client import MockFabricClient, FabricClient


def get_fabric_client() -> FabricClient:
    """Return an initialized FabricClient.

    Configuration is read from Django settings first, falling back to environment vars.
    Settings that may be set in `proyecto_integracion/settings.py`:
    - FABRIC_ENABLED (bool)
    - FABRIC_NETWORK_PROFILE (str)
    - FABRIC_ORG (str)
    - FABRIC_USER (str)
    - FABRIC_CHANNEL (str)
    - FABRIC_CHAINCODE (str)

    If a real client is implemented, this factory should choose it.
    """
    enabled = getattr(settings, 'FABRIC_ENABLED', None)
    if enabled is None:
        enabled_env = os.environ.get('FABRIC_ENABLED', 'false')
        enabled = enabled_env.lower() in ['1', 'true', 'yes']

    network_profile = getattr(settings, 'FABRIC_NETWORK_PROFILE', None) or os.environ.get('FABRIC_NETWORK_PROFILE')
    org = getattr(settings, 'FABRIC_ORG', None) or os.environ.get('FABRIC_ORG')
    user = getattr(settings, 'FABRIC_USER', None) or os.environ.get('FABRIC_USER')
    channel = getattr(settings, 'FABRIC_CHANNEL', None) or os.environ.get('FABRIC_CHANNEL')
    chaincode = getattr(settings, 'FABRIC_CHAINCODE', None) or os.environ.get('FABRIC_CHAINCODE')

    # Currently always return mock unless a real implementation is available
    # Replace this logic to instantiate RealFabricClient when implemented.
    return MockFabricClient(network_profile, org, user, channel, chaincode)
