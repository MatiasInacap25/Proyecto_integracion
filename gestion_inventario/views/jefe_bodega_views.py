"""
Vistas específicas para usuarios con cargo de JEFE DE BODEGA
- Aprobar/rechazar mermas
- Registrar mermas con aprobación automática
- Generar reportes de inventario
- Asignar usuarios a bodega
- Gestionar productos de la bodega
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal
from ..models import (
    RegistroMerma, DetalleMerma, InventarioLote, CustomUser,
    Producto, IngresoProducto, SalidaProducto, Bodega,
    CategoriaMerma, Lote
)
from ..serializers import (
    RegistroMermaSerializer, CustomUserSerializer, ProductoSerializer,
    InventarioLoteSerializer
)

def verificar_jefe_bodega(user):
    """Verifica si el usuario es jefe de bodega"""
    return user.cargo and user.cargo.tipo == 'Jefe de bodega'

def gestionar_estado_lote(lote):
    """Gestiona el estado activo/inactivo del lote basado en su cantidad"""
    if lote.cantidad <= 0 and lote.activo:
        # Lote llegó a 0, marcarlo como inactivo
        lote.inactivar()
    elif lote.cantidad > 0 and not lote.activo:
        # Lote volvió a tener stock, reactivarlo
        lote.reactivar()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def aprobar_merma(request, merma_id):
    """Aprueba una merma registrada por un bodeguero"""
    
    if not verificar_jefe_bodega(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        registro_merma = get_object_or_404(RegistroMerma, id=merma_id)
        
        # Verificar que la merma esté pendiente
        if registro_merma.estado != 'Pendiente':
            return Response({
                'success': False,
                'error': f'La merma ya está {registro_merma.estado}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar acceso a la bodega
        if request.user.bodega and request.user.bodega != registro_merma.bodega:
            return Response({
                'success': False,
                'error': 'No tienes acceso a esta bodega'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Aprobar la merma
        registro_merma.estado = 'aprobado'
        registro_merma.fecha_aprobacion = timezone.now()
        registro_merma.usuario_aprobacion = request.user
        registro_merma.save()
        
        # Descontar del inventario (actualizar cantidad del lote)
        for detalle in registro_merma.detalles_merma.all():
            try:
                inventario = InventarioLote.objects.get(
                    bodega=registro_merma.bodega,
                    lote=detalle.lote
                )
                # Actualizar la cantidad directamente en el lote
                detalle.lote.cantidad -= detalle.cantidad_merma
                if detalle.lote.cantidad < 0:
                    detalle.lote.cantidad = 0
                detalle.lote.save()
                
                # Gestionar estado del lote basado en la nueva cantidad
                gestionar_estado_lote(detalle.lote)
                
            except InventarioLote.DoesNotExist:
                continue
        
        serializer = RegistroMermaSerializer(registro_merma)
        return Response({
            'success': True,
            'message': 'Merma aprobada exitosamente',
            'registro_merma': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al aprobar merma: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rechazar_merma(request, merma_id):
    """Rechaza una merma registrada por un bodeguero"""
    
    if not verificar_jefe_bodega(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        registro_merma = get_object_or_404(RegistroMerma, id=merma_id)
        
        # Verificar que la merma esté pendiente
        if registro_merma.estado != 'Pendiente':
            return Response({
                'success': False,
                'error': f'La merma ya está {registro_merma.estado}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar acceso a la bodega
        if request.user.bodega and request.user.bodega != registro_merma.bodega:
            return Response({
                'success': False,
                'error': 'No tienes acceso a esta bodega'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Rechazar la merma
        registro_merma.estado = 'rechazado'
        registro_merma.fecha_aprobacion = timezone.now()
        registro_merma.usuario_aprobacion = request.user
        registro_merma.save()
        
        serializer = RegistroMermaSerializer(registro_merma)
        return Response({
            'success': True,
            'message': 'Merma rechazada',
            'registro_merma': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al rechazar merma: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_mermas_pendientes(request):
    """Lista las mermas pendientes de aprobación con información detallada"""
    
    if not verificar_jefe_bodega(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Filtrar por bodega del jefe si tiene una asignada
        queryset = RegistroMerma.objects.select_related(
            'usuario_registro', 'categoria_merma', 'bodega'
        ).prefetch_related(
            'detalles_merma__lote__producto'
        ).filter(estado='Pendiente')
        
        if request.user.bodega:
            queryset = queryset.filter(bodega=request.user.bodega)
        
        mermas_data = []
        for merma in queryset:
            # Construir información del detalle
            detalles_data = []
            for detalle in merma.detalles_merma.all():
                # Formatear valor de la merma del detalle
                valor_merma_val = float(detalle.valor_merma)
                valor_merma_clean = int(valor_merma_val) if valor_merma_val.is_integer() else valor_merma_val
                
                # Formatear cantidad de merma
                cantidad_val = float(detalle.cantidad_merma)
                cantidad_clean = int(cantidad_val) if cantidad_val.is_integer() else cantidad_val
                
                detalles_data.append({
                    'lote_codigo': detalle.lote.codigo_lote,
                    'producto_nombre': detalle.lote.producto.nombre,
                    'cantidad_merma': cantidad_clean,
                    'valor_merma': valor_merma_clean
                })
            
            # Formatear fecha y hora
            fecha_registro = merma.fecha_registro
            fecha_formateada = fecha_registro.strftime('%d/%m/%Y')
            hora_formateada = fecha_registro.strftime('%H:%M')
            
            # Formatear valor total de la merma
            valor_total_val = float(merma.valor_total_merma)
            valor_total_clean = int(valor_total_val) if valor_total_val.is_integer() else valor_total_val
            
            merma_info = {
                'id': merma.id,
                'fecha': fecha_formateada,
                'hora': hora_formateada,
                'categoria_merma': merma.categoria_merma.nombre,
                'estado': merma.estado,
                'observaciones_registro': merma.observaciones_registro,
                'usuario_registro': {
                    'nombre': merma.usuario_registro.first_name,
                    'apellido': merma.usuario_registro.last_name
                },
                'detalles_merma': detalles_data,
                'valor_total_merma': valor_total_clean
            }
            mermas_data.append(merma_info)
        
        return Response({
            'success': True,
            'mermas_pendientes': mermas_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al consultar mermas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generar_reporte_inventario(request):
    """Genera reporte completo del inventario de la bodega"""
    
    if not verificar_jefe_bodega(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener parámetros de fechas
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        # Filtrar por bodega del jefe
        bodega_filter = Q()
        if request.user.bodega:
            bodega_filter = Q(bodega=request.user.bodega)
        
        # Stock actual
        inventario_actual = InventarioLote.objects.filter(bodega_filter)
        
        # Ingresos del período
        ingresos_query = IngresoProducto.objects.filter(bodega_filter)
        if fecha_inicio:
            ingresos_query = ingresos_query.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            ingresos_query = ingresos_query.filter(fecha__lte=fecha_fin)
        
        # Salidas del período
        salidas_query = SalidaProducto.objects.filter(bodega_filter)
        if fecha_inicio:
            salidas_query = salidas_query.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            salidas_query = salidas_query.filter(fecha__lte=fecha_fin)
        
        # Mermas del período
        mermas_query = RegistroMerma.objects.filter(bodega_filter, estado='aprobado')
        if fecha_inicio:
            mermas_query = mermas_query.filter(fecha_registro__gte=fecha_inicio)
        if fecha_fin:
            mermas_query = mermas_query.filter(fecha_registro__lte=fecha_fin)
        
        # Calcular estadísticas
        total_productos = inventario_actual.count()
        valor_total_inventario = sum(
            item.cantidad_actual * item.lote.precio_compra 
            for item in inventario_actual
        )
        
        total_ingresos = ingresos_query.count()
        total_salidas = salidas_query.count()
        total_mermas = mermas_query.count()
        
        # Productos con bajo stock (menos de 10 unidades)
        productos_bajo_stock = inventario_actual.filter(cantidad_actual__lt=10)
        
        # Productos próximos a vencer (30 días)
        from datetime import date, timedelta
        fecha_limite = date.today() + timedelta(days=30)
        productos_por_vencer = inventario_actual.filter(
            lote__fecha_vencimiento__lte=fecha_limite,
            lote__fecha_vencimiento__isnull=False
        )
        
        reporte = {
            'success': True,
            'bodega': request.user.bodega.nombre if request.user.bodega else 'Todas las bodegas',
            'fecha_reporte': timezone.now().date(),
            'periodo': {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin
            },
            'resumen': {
                'total_productos': total_productos,
                'valor_total_inventario': valor_total_inventario,
                'total_ingresos': total_ingresos,
                'total_salidas': total_salidas,
                'total_mermas': total_mermas
            },
            'alertas': {
                'productos_bajo_stock': InventarioLoteSerializer(productos_bajo_stock, many=True).data,
                'productos_por_vencer': InventarioLoteSerializer(productos_por_vencer, many=True).data
            },
            'inventario_actual': InventarioLoteSerializer(inventario_actual, many=True).data
        }
        
        return Response(reporte)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al generar reporte: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_merma_aprobada(request):
    """Registra mermas que quedan automáticamente aprobadas (solo jefe de bodega)"""
    
    if not verificar_jefe_bodega(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        categoria_merma_id = request.data.get('categoria_merma_id')
        observaciones = request.data.get('observaciones', '')
        productos = request.data.get('productos', [])  # Lista de productos con merma
        
        if not categoria_merma_id or not productos:
            return Response({
                'success': False,
                'error': 'categoria_merma_id y productos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el usuario tenga bodega asignada
        if not request.user.bodega:
            return Response({
                'success': False,
                'error': 'No tienes una bodega asignada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        categoria_merma = get_object_or_404(CategoriaMerma, id=categoria_merma_id)
        
        # Crear registro de merma YA APROBADO
        registro_merma = RegistroMerma.objects.create(
            bodega=request.user.bodega,
            usuario_registro=request.user,
            categoria_merma=categoria_merma,
            observaciones_registro=observaciones,
            estado='aprobado',  # Automáticamente aprobado
            fecha_aprobacion=timezone.now(),  # Fecha de aprobación inmediata
            usuario_aprobacion=request.user  # Auto-aprobado por el jefe
        )
        
        # Procesar cada producto con merma
        for producto_data in productos:
            lote_id = producto_data.get('lote_id')
            cantidad_merma = producto_data.get('cantidad_merma')
            
            if not all([lote_id, cantidad_merma]):
                continue
            
            lote = get_object_or_404(Lote, id=lote_id)
            producto = lote.producto
            
            # Verificar que el lote esté en la bodega
            try:
                inventario = InventarioLote.objects.get(
                    bodega=request.user.bodega, 
                    lote=lote
                )
                
                # Verificar que hay suficiente stock
                cantidad_merma_decimal = Decimal(str(cantidad_merma))
                if lote.cantidad < cantidad_merma_decimal:
                    return Response({
                        'success': False,
                        'error': f'Stock insuficiente para {producto.nombre}. Disponible: {lote.cantidad}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Crear detalle de merma
                detalle_merma = DetalleMerma.objects.create(
                    registro_merma=registro_merma,
                    lote=lote,
                    producto=producto,
                    cantidad_merma=cantidad_merma,
                    cantidad_antes=lote.cantidad
                )
                
                # Calcular valor monetario del detalle
                detalle_merma.calcular_valor_merma()
                detalle_merma.save()
                
                # APLICAR INMEDIATAMENTE AL INVENTARIO (porque está aprobada)
                lote.cantidad -= cantidad_merma_decimal
                lote.save()
                
                # Gestionar estado del lote (inactivar si llega a 0)
                gestionar_estado_lote(lote)
                
            except InventarioLote.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'El lote {lote.codigo_lote} no está disponible en esta bodega'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calcular valor total de la merma
        registro_merma.calcular_valor_total()
        registro_merma.save()
        
        serializer = RegistroMermaSerializer(registro_merma)
        return Response({
            'success': True,
            'message': 'Merma registrada y aprobada automáticamente',
            'registro_merma': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar merma: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

