"""
Vistas específicas para usuarios con cargo de BODEGUERO
- Registrar ingresos de productos
- Registrar salidas de productos  
- Consultar stock de su bodega
- Registrar mermas
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from ..models import (
    IngresoProducto, DetalleIngreso, SalidaProducto, DetalleSalida,
    InventarioLote, Lote, Producto, RegistroMerma, DetalleMerma,
    CategoriaMerma
)
from ..serializers import (
    IngresoProductoSerializer, SalidaProductoSerializer,
    InventarioLoteSerializer, RegistroMermaSerializer
)

def verificar_acceso_bodega(user, bodega):
    """Verifica si el usuario tiene acceso a la bodega"""
    if user.bodega and user.bodega != bodega:
        return False
    return True

def verificar_usuario_activo_y_cargo(user, cargos_permitidos):
    """Verifica si el usuario está activo y tiene uno de los cargos permitidos"""
    if not user.is_active:
        return False, 'Usuario desactivado. Contacte al administrador.'
    
    if not user.cargo or user.cargo.tipo not in cargos_permitidos:
        return False, 'No tienes permisos para realizar esta acción'
    
    return True, None

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
def registrar_ingreso_producto(request):
    """Registra el ingreso de productos a la bodega"""
    
    # Verificar que el usuario sea bodeguero o jefe de bodega
    if not request.user.cargo or request.user.cargo.tipo not in ['bodeguero', 'Jefe de bodega']:
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        proveedor_id = request.data.get('proveedor_id')
        bodega_id = request.data.get('bodega_id', 1)  # Por defecto bodega 1
        productos = request.data.get('productos', [])  # Lista de productos
        
        if not proveedor_id or not productos:
            return Response({
                'success': False,
                'error': 'proveedor_id y productos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar acceso a la bodega
        from ..models import Bodega
        bodega = get_object_or_404(Bodega, id=bodega_id)
        if not verificar_acceso_bodega(request.user, bodega):
            return Response({
                'success': False,
                'error': 'No tienes acceso a esta bodega'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Crear el ingreso
        from ..models import Proveedor
        proveedor = get_object_or_404(Proveedor, id=proveedor_id)
        
        ingreso = IngresoProducto.objects.create(
            proveedor=proveedor,
            bodega=bodega,
            usuario=request.user,
            descripcion=request.data.get('descripcion', '')
        )
        
        # Procesar cada producto
        for producto_data in productos:
            producto_id = producto_data.get('producto_id')
            cantidad_lotes = producto_data.get('cantidad_lotes')
            codigo_lote = producto_data.get('codigo_lote')
            fecha_vencimiento = producto_data.get('fecha_vencimiento')
            
            if not all([producto_id, cantidad_lotes, codigo_lote]):
                continue
            
            producto = get_object_or_404(Producto, id=producto_id)
            
            # Calcular la cantidad total de unidades en el lote
            cantidad_total = float(cantidad_lotes) * float(producto.cantidad_por_lote)
            
            # Calcular el precio total del lote
            # precio_compra = cantidad_lotes × cantidad_por_lote × precio_unitario
            precio_compra_total = float(cantidad_lotes) * float(producto.cantidad_por_lote) * float(producto.precio_unitario)
            
            # Crear el lote automáticamente
            lote = Lote.objects.create(
                codigo_lote=codigo_lote,
                producto=producto,
                fecha_vencimiento=fecha_vencimiento,
                precio_compra=precio_compra_total,
                cantidad=cantidad_total,
                activo=True  # Los lotes nuevos siempre empiezan activos
            )
            
            # Crear detalle de ingreso
            DetalleIngreso.objects.create(
                ingreso=ingreso,
                producto=producto,
                cantidad_lotes=cantidad_lotes,
                lote=lote
            )
            
            # Crear registro en inventario
            InventarioLote.objects.create(
                bodega=bodega,
                lote=lote
            )
        
        serializer = IngresoProductoSerializer(ingreso)
        return Response({
            'success': True,
            'message': 'Ingreso registrado exitosamente',
            'ingreso': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar ingreso: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_salida_producto(request):
    """Registra la salida de productos de la bodega"""
    
    # Verificar que el usuario sea bodeguero o jefe de bodega
    if not request.user.cargo or request.user.cargo.tipo not in ['bodeguero', 'Jefe de bodega']:
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        cliente_id = request.data.get('cliente_id')
        conductor_id = request.data.get('conductor_id')
        bodega_id = request.data.get('bodega_id', 1)  # Por defecto bodega 1
        productos = request.data.get('productos', [])
        
        if not cliente_id or not conductor_id or not productos:
            return Response({
                'success': False,
                'error': 'cliente_id, conductor_id y productos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar acceso a la bodega
        from ..models import Bodega, Cliente, Conductor
        bodega = get_object_or_404(Bodega, id=bodega_id)
        if not verificar_acceso_bodega(request.user, bodega):
            return Response({
                'success': False,
                'error': 'No tienes acceso a esta bodega'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Crear la salida
        cliente = get_object_or_404(Cliente, id=cliente_id)
        conductor = get_object_or_404(Conductor, id=conductor_id)
        
        # VALIDAR STOCK ANTES DE CREAR LA SALIDA
        # Primero verificar que hay suficiente stock en todos los lotes
        for producto_data in productos:
            cantidad_lotes = producto_data.get('cantidad_lotes')
            lote_id = producto_data.get('lote_id')
            
            if not all([cantidad_lotes, lote_id]):
                continue
            
            lote = get_object_or_404(Lote, id=lote_id)
            producto = lote.producto
            
            # Verificar que el lote esté en la bodega
            try:
                inventario = InventarioLote.objects.get(bodega=bodega, lote=lote)
                
                # Usar la cantidad directamente sin multiplicar
                cantidad_total = cantidad_lotes
                
                # Verificar si hay suficiente stock en el lote
                if lote.cantidad < cantidad_total:
                    return Response({
                        'success': False,
                        'error': f'Stock insuficiente para {producto.nombre}. Disponible en lote: {lote.cantidad}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
            except InventarioLote.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'No hay stock de {producto.nombre} en esta bodega'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Si llegamos aquí, todo el stock está disponible, crear la salida
        salida = SalidaProducto.objects.create(
            cliente=cliente,
            conductor=conductor,
            bodega=bodega,
            usuario=request.user,
            descripcion=request.data.get('descripcion', '')
        )
        
        # Procesar cada producto (ya validado el stock)
        for producto_data in productos:
            cantidad_lotes = producto_data.get('cantidad_lotes')
            lote_id = producto_data.get('lote_id')
            
            if not all([cantidad_lotes, lote_id]):
                continue
            
            lote = get_object_or_404(Lote, id=lote_id)
            cantidad_total = cantidad_lotes
            
            # Crear detalle de salida
            DetalleSalida.objects.create(
                salida=salida,
                cantidad_lotes=cantidad_lotes,
                lote=lote
            )
            
            # Actualizar cantidad en el lote
            lote.cantidad -= cantidad_total
            lote.save()
            
            # Gestionar estado del lote (inactivar si llega a 0)
            gestionar_estado_lote(lote)
        
        serializer = SalidaProductoSerializer(salida)
        return Response({
            'success': True,
            'message': 'Salida registrada exitosamente',
            'salida': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar salida: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consultar_stock_bodega(request):
    """Consulta el stock actual de la bodega del usuario"""
    
    # Verificar que el usuario sea bodeguero
    if not request.user.cargo or request.user.cargo.tipo != 'bodeguero':
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Si el usuario tiene bodega específica, mostrar solo esa
        if request.user.bodega:
            inventario = InventarioLote.objects.filter(
                bodega=request.user.bodega,
                lote__cantidad__gt=0,
                lote__activo=True  # Solo mostrar lotes activos
            )
        else:
            return Response({
                'success': False,
                'error': 'No tienes una bodega asignada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = InventarioLoteSerializer(inventario, many=True)
        return Response({
            'success': True,
            'bodega': request.user.bodega.nombre,
            'inventario': serializer.data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al consultar stock: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_merma(request):
    """Registra mermas de productos en la bodega"""
    
    # Verificar que el usuario esté activo y sea bodeguero
    es_valido, error_msg = verificar_usuario_activo_y_cargo(request.user, ['bodeguero'])
    if not es_valido:
        return Response({
            'success': False,
            'error': error_msg
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
        
        # Crear registro de merma
        registro_merma = RegistroMerma.objects.create(
            bodega=request.user.bodega,
            usuario_registro=request.user,
            categoria_merma=categoria_merma,
            observaciones_registro=observaciones,
            estado='Pendiente'
        )
        
        # Procesar cada producto con merma
        for producto_data in productos:
            lote_id = producto_data.get('lote_id')
            cantidad_merma = producto_data.get('cantidad_merma')
            
            if not lote_id or not cantidad_merma:
                continue
            
            lote = get_object_or_404(Lote, id=lote_id)
            
            # Obtener stock actual
            try:
                inventario = InventarioLote.objects.get(
                    bodega=request.user.bodega,
                    lote=lote
                )
                
                # Crear detalle de merma
                detalle_merma = DetalleMerma.objects.create(
                    registro_merma=registro_merma,
                    lote=lote,
                    producto=lote.producto,
                    cantidad_merma=cantidad_merma,
                    cantidad_antes=lote.cantidad
                )
                
                # Calcular valor monetario del detalle
                detalle_merma.calcular_valor_merma()
                detalle_merma.save()
                
            except InventarioLote.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'No hay inventario para el lote {lote.codigo_lote}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calcular valor total de la merma
        registro_merma.calcular_valor_total()
        registro_merma.save()
        
        serializer = RegistroMermaSerializer(registro_merma)
        return Response({
            'success': True,
            'message': 'Merma registrada exitosamente. Pendiente de aprobación.',
            'registro_merma': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar merma: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)