"""
Fabric client wrapper.

This file defines a `FabricClient` interface and a `MockFabricClient` implementation used
for development when no Fabric network is available.

Real implementation should use the Hyperledger Fabric Python SDK or an HTTP gateway
provided by a Fabric REST proxy. Keep the calls isolated here.

Environment/configuration used by services.get_fabric_client():
- FABRIC_ENABLED: 'true' or 'false' (if false, MockFabricClient used)
- FABRIC_NETWORK_PROFILE: path to a network profile JSON (optional for mock)
- FABRIC_ORG: organization name
- FABRIC_USER: user identity to use
- FABRIC_CHANNEL: channel name
- FABRIC_CHAINCODE: chaincode name

Place a connection profile in `blockchain/config/network_profile.json` or provide path
via `FABRIC_NETWORK_PROFILE`.
"""
import json
import logging
import os
import uuid
from typing import Dict, List

logger = logging.getLogger(__name__)


class FabricClient:
    """Base interface for a Fabric client implementation."""

    def __init__(self, network_profile: str | None = None, org: str | None = None,
                 user: str | None = None, channel: str | None = None, chaincode: str | None = None):
        self.network_profile = network_profile
        self.org = org
        self.user = user
        self.channel = channel
        self.chaincode = chaincode

    def registrar_movimiento_en_blockchain(self, datos_movimiento: Dict) -> str:
        """Register a movement on the blockchain.

        Returns the transaction id (string).
        Real implementation should submit a transaction to chaincode and return the tx id/hash.
        """
        raise NotImplementedError()

    def obtener_historial_producto(self, id_producto: str) -> List[Dict]:
        """Return the product history from the ledger."""
        raise NotImplementedError()


class MockFabricClient(FabricClient):
    """A mock client that simulates blockchain behavior for development/testing.

    It generates a fake tx id and stores nothing externally. This is intentionally simple: the
    true source of truth remains the relational DB for local queries; blockchain immutability
    would be provided by a real Fabric network.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # In-memory store to simulate history in development. Not persisted across runs.
        self._store = []

    def registrar_movimiento_en_blockchain(self, datos_movimiento: Dict) -> str:
        tx_id = f"MOCKTX-{uuid.uuid4().hex}"
        entry = {
            'tx_id': tx_id,
            'producto_id': str(datos_movimiento.get('producto')) if datos_movimiento.get('producto') is not None else None,
            'tipo_movimiento': datos_movimiento.get('tipo_movimiento'),
            'cantidad': str(datos_movimiento.get('cantidad')),
            'usuario': datos_movimiento.get('usuario'),
            'timestamp': datos_movimiento.get('timestamp'),
            'raw': datos_movimiento,
        }
        self._store.append(entry)
        logger.info(f"[MockFabric] Registered movement TX {tx_id} for product {entry['producto_id']}")
        return tx_id

    def obtener_historial_producto(self, id_producto: str) -> List[Dict]:
        return [e for e in self._store if e.get('producto_id') == str(id_producto)]


# Placeholder for a real Fabric client implementation note
# class RealFabricClient(FabricClient):
#     def __init__(...):
#         # initialize sdk, wallets, identity, network, contract
#         pass
#     def registrar_movimiento_en_blockchain(self, datos_movimiento: Dict) -> str:
#         # submit transaction and return tx id
#         pass
#     def obtener_historial_producto(self, id_producto: str) -> List[Dict]:
#         # query chaincode ledger or rich queries
#         pass
