"""
Signals to register inventory movements in the blockchain (or mock) and store a local BlockchainTransaction.

This module hooks into creation of DetalleIngreso, DetalleSalida, DetalleMerma and changes of RegistroMerma
state to 'aprobado'. It uses transaction.on_commit to call the Fabric client only after DB commit.

Environment: uses `gestion_inventario.blockchain.services.get_fabric_client()` to obtain a client.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from django.utils import timezone
import logging

from .models import DetalleIngreso, DetalleSalida, DetalleMerma, RegistroMerma, BlockchainTransaction
from .blockchain.services import get_fabric_client

logger = logging.getLogger(__name__)


def _registrar_movimiento(datos_movimiento, producto_obj=None, usuario_obj=None):
    client = get_fabric_client()

    def _do():
        try:
            tx_id = client.registrar_movimiento_en_blockchain(datos_movimiento)
            # Guardar réplica local
            BlockchainTransaction.objects.create(
                producto=producto_obj,
                usuario=usuario_obj,
                tipo_movimiento=datos_movimiento.get('tipo_movimiento', 'unknown'),
                cantidad=datos_movimiento.get('cantidad') or 0,
                tx_id_blockchain=tx_id,
                detalle=datos_movimiento
            )
            logger.info(f"Registered blockchain tx {tx_id} for product {producto_obj}")
        except Exception as e:
            logger.exception(f"Error registrando movimiento en blockchain: {e}")

    # Ensure we call after DB commit
    try:
        transaction.on_commit(_do)
    except Exception:
        # If on_commit not available (older versions), call directly but it's risky
        _do()


@receiver(post_save, sender=DetalleIngreso)
def detalle_ingreso_post_save(sender, instance: DetalleIngreso, created, **kwargs):
    if not created:
        return

    datos = {
        'producto': instance.producto.id if instance.producto else None,
        'tipo_movimiento': 'ingreso',
        'cantidad': float(instance.cantidad_total) if hasattr(instance, 'cantidad_total') else None,
        'usuario': instance.ingreso.usuario.username if instance.ingreso and instance.ingreso.usuario else None,
        'timestamp': instance.ingreso.fecha.isoformat() if instance.ingreso and instance.ingreso.fecha else timezone.now().isoformat(),
        'detalle_id': instance.id,
        'lote_id': instance.lote.id if instance.lote else None,
    }
    _registrar_movimiento(datos, producto_obj=instance.producto, usuario_obj=instance.ingreso.usuario if instance.ingreso else None)


@receiver(post_save, sender=DetalleSalida)
def detalle_salida_post_save(sender, instance: DetalleSalida, created, **kwargs):
    if not created:
        return

    datos = {
        'producto': instance.lote.producto.id if instance.lote and instance.lote.producto else None,
        'tipo_movimiento': 'salida',
        'cantidad': float(instance.cantidad_total) if hasattr(instance, 'cantidad_total') else None,
        'usuario': instance.salida.usuario.username if instance.salida and instance.salida.usuario else None,
        'timestamp': instance.salida.fecha.isoformat() if instance.salida and instance.salida.fecha else timezone.now().isoformat(),
        'detalle_id': instance.id,
        'lote_id': instance.lote.id if instance.lote else None,
    }
    _registrar_movimiento(datos, producto_obj=instance.lote.producto if instance.lote else None, usuario_obj=instance.salida.usuario if instance.salida else None)


# For merma details, we register when a DetalleMerma is created. Additionally, if RegistroMerma
# state transitions to 'aprobado', it's already modifying stock; we register on detalle creation
# and on RegistroMerma approval to capture the approval event.
@receiver(post_save, sender=DetalleMerma)
def detalle_merma_post_save(sender, instance: DetalleMerma, created, **kwargs):
    if not created:
        return

    datos = {
        'producto': instance.producto.id if instance.producto else None,
        'tipo_movimiento': 'merma',
        'cantidad': float(instance.cantidad_merma),
        'usuario': instance.registro_merma.usuario_registro.username if instance.registro_merma and instance.registro_merma.usuario_registro else None,
        'timestamp': instance.registro_merma.fecha_registro.isoformat() if instance.registro_merma and instance.registro_merma.fecha_registro else timezone.now().isoformat(),
        'detalle_id': instance.id,
        'lote_id': instance.lote.id if instance.lote else None,
    }
    _registrar_movimiento(datos, producto_obj=instance.producto, usuario_obj=instance.registro_merma.usuario_registro if instance.registro_merma else None)


# Detect transition of RegistroMerma.estado to 'aprobado' (to register approval event)
@receiver(pre_save, sender=RegistroMerma)
def registro_merma_pre_save(sender, instance: RegistroMerma, **kwargs):
    # Only proceed if instance has a PK (existing) so we can check previous state
    if not instance.pk:
        # New registro; nothing to compare here
        return
    try:
        previous = RegistroMerma.objects.get(pk=instance.pk)
    except RegistroMerma.DoesNotExist:
        return

    if previous.estado != 'aprobado' and instance.estado == 'aprobado':
        # Registro was approved now
        datos = {
            'producto': None,
            'tipo_movimiento': 'merma_aprobacion',
            'cantidad': None,
            'usuario': instance.usuario_aprobacion.username if instance.usuario_aprobacion else None,
            'timestamp': instance.fecha_aprobacion.isoformat() if instance.fecha_aprobacion else timezone.now().isoformat(),
            'registro_merma_id': instance.id,
        }
        # We register a single tx describing the approval; details were registered when each DetalleMerma was created
        _registrar_movimiento(datos, producto_obj=None, usuario_obj=instance.usuario_aprobacion)
