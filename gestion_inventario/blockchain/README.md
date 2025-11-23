# Integración Blockchain (Hyperledger Fabric)

Este módulo contiene la infraestructura mínima para integrar Hyperledger Fabric al sistema.

Estructura:
- `fabric_client.py`: interfaz `FabricClient` y `MockFabricClient` (implementación de desarrollo).
- `services.py`: fábrica `get_fabric_client()` que devuelve un cliente (mock por defecto).
- `config/network_profile.json`: archivo de ejemplo para el perfil de red de Fabric.

Variables de entorno/config (usar `settings.py` + env vars):
- `FABRIC_ENABLED`: 'true'/'false'. Si `false`, se usa `MockFabricClient` (recomendado en dev).
- `FABRIC_NETWORK_PROFILE`: ruta al JSON del perfil de red (opcional para mock).
- `FABRIC_ORG`, `FABRIC_USER`, `FABRIC_CHANNEL`, `FABRIC_CHAINCODE`: parámetros de red.

Cómo conectar una red real:
1. Implementar `RealFabricClient` en `fabric_client.py` usando la SDK de Fabric o un gateway HTTP.
2. Cambiar `get_fabric_client()` en `services.py` para devolver `RealFabricClient` cuando `FABRIC_ENABLED` sea true.
3. Proveer credenciales/identidades en carpetas de wallet o mecanimos recomendados por Fabric.

Pruebas locales (mock):
- Dejar `FABRIC_ENABLED=false` (por defecto) y al crear movimientos en la app se generarán entradas mock prefijadas con `MOCKTX-...`.
- Las entradas se almacenan localmente en la BD como `BlockchainTransaction`.

Notas de seguridad:
- Nunca comitear certificados/credenciales de identidades al repositorio.
- Guardar secretos en variables de entorno o secret manager.
