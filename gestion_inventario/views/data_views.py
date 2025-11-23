"""
Vistas específicas para enviar datos al frontend
- Datos de proveedores
- Datos de productos
- Otros datos maestros necesarios para formularios
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..models import (
    Proveedor, Producto, Cliente, Lote, CategoriaMerma, InventarioLote, 
    RegistroMerma, CustomUser, Conductor, IngresoProducto, DetalleIngreso,
    SalidaProducto, DetalleSalida, Categoria, UnidadMedida
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_proveedores(request):
    """Obtiene lista de proveedores con id y nombre para formularios"""
    
    try:
        proveedores = Proveedor.objects.all().values('id', 'nombre')
        
        return Response({
            'success': True,
            'proveedores': list(proveedores)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener proveedores: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_productos(request):
    """Obtiene lista de productos con id, nombre y cantidad_por_lote para formularios"""
    
    try:
        productos_raw = Producto.objects.select_related('unidad_medida').filter(
            activo=True
        ).values(
            'id', 'nombre', 'cantidad_por_lote', 'unidad_medida__abreviatura'
        )

        productos = []
        for p in productos_raw:
            cantidad_val = float(p['cantidad_por_lote'])
            cantidad_clean = int(cantidad_val) if cantidad_val.is_integer() else cantidad_val
            productos.append({
                'id': p['id'],
                'nombre': p['nombre'],
                'cantidad_por_lote': cantidad_clean,
                'unidad_medida_abreviatura': p.get('unidad_medida__abreviatura')
            })

        return Response({
            'success': True,
            'productos': productos
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener productos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_clientes(request):
    """Obtiene lista de clientes con id y nombre para formularios"""
    
    try:
        clientes = Cliente.objects.all().values('id', 'nombre')
        
        return Response({
            'success': True,
            'clientes': list(clientes)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener clientes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_lotes(request):
    """Obtiene lista de lotes con id, codigo_lote, cantidad y nombre del producto"""
    
    try:
        lotes_raw = Lote.objects.select_related('producto').filter(
            activo=True, 
            cantidad__gt=0
        ).values(
            'id', 
            'codigo_lote', 
            'cantidad', 
            'producto__nombre'
        )
        
        lotes = []
        for lote in lotes_raw:
            cantidad_val = float(lote['cantidad'])
            cantidad_clean = int(cantidad_val) if cantidad_val.is_integer() else cantidad_val
            lotes.append({
                'id': lote['id'],
                'codigo_lote': lote['codigo_lote'],
                'cantidad': cantidad_clean,
                'producto_nombre': lote['producto__nombre']
            })
        
        return Response({
            'success': True,
            'lotes': lotes
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener lotes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_categorias_merma(request):
    """Obtiene lista de categorías de merma con id y nombre para formularios"""
    
    try:
        categorias = CategoriaMerma.objects.all().values('id', 'nombre')
        
        return Response({
            'success': True,
            'categorias': list(categorias)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener categorías de merma: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventario_data(request):
    """Obtiene todos los lotes con cantidad mayor a 0 y el nombre del producto"""
    
    try:
        inventario_raw = InventarioLote.objects.select_related(
            'lote', 'lote__producto', 'lote__producto__unidad_medida'
        ).filter(
            lote__cantidad__gt=0,
            lote__activo=True
        ).values(
            'lote__codigo_lote',
            'lote__cantidad', 
            'lote__producto__nombre',
            'lote__producto__unidad_medida__nombre'
        )
        
        inventario = []
        for item in inventario_raw:
            cantidad_val = float(item['lote__cantidad'])
            cantidad_clean = int(cantidad_val) if cantidad_val.is_integer() else cantidad_val
            inventario.append({
                'codigo_lote': item['lote__codigo_lote'],
                'cantidad': cantidad_clean,
                'producto_nombre': item['lote__producto__nombre'],
                'unidad_medida': item['lote__producto__unidad_medida__nombre']
            })
        
        return Response({
            'success': True,
            'inventario': inventario
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener inventario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mermas_data(request):
    """Obtiene el historial completo de mermas (pendientes, aprobadas y rechazadas)"""
    
    try:
        mermas_queryset = RegistroMerma.objects.select_related(
            'bodega', 'usuario_registro', 'usuario_aprobacion', 'categoria_merma'
        ).prefetch_related(
            'detalles_merma__producto__unidad_medida',
            'detalles_merma__lote'
        ).filter(
            estado__in=['aprobado', 'rechazado', 'Pendiente']
        ).order_by('-fecha_aprobacion', '-fecha_registro')
        
        mermas = []
        for registro_merma in mermas_queryset:
            # Formatear fechas
            fecha_registro = registro_merma.fecha_registro.strftime('%d/%m/%Y')
            hora_registro = registro_merma.fecha_registro.strftime('%H:%M')
            
            fecha_aprobacion = registro_merma.fecha_aprobacion.strftime('%d/%m/%Y') if registro_merma.fecha_aprobacion else None
            hora_aprobacion = registro_merma.fecha_aprobacion.strftime('%H:%M') if registro_merma.fecha_aprobacion else None
            
            # Obtener detalles de productos
            productos = []
            for detalle in registro_merma.detalles_merma.all():
                cantidad_val = float(detalle.cantidad_merma)
                cantidad_clean = int(cantidad_val) if cantidad_val.is_integer() else cantidad_val
                
                # Formatear valor de la merma del detalle
                valor_merma_val = float(detalle.valor_merma)
                valor_merma_clean = int(valor_merma_val) if valor_merma_val.is_integer() else valor_merma_val
                
                productos.append({
                    'producto_nombre': detalle.producto.nombre,
                    'unidad_medida': detalle.producto.unidad_medida.nombre,
                    'cantidad_merma': cantidad_clean,
                    'codigo_lote': detalle.lote.codigo_lote,
                    'valor_merma': valor_merma_clean
                })
            
            # Formatear valor total de la merma
            valor_total_val = float(registro_merma.valor_total_merma)
            valor_total_clean = int(valor_total_val) if valor_total_val.is_integer() else valor_total_val
            
            mermas.append({
                'id': registro_merma.id,
                'fecha_registro': fecha_registro,
                'hora_registro': hora_registro,
                'fecha_aprobacion': fecha_aprobacion,
                'hora_aprobacion': hora_aprobacion,
                'estado': registro_merma.estado,
                'observaciones': registro_merma.observaciones_registro,
                'usuario_registro': f"{registro_merma.usuario_registro.first_name} {registro_merma.usuario_registro.last_name}",
                'usuario_aprobacion': f"{registro_merma.usuario_aprobacion.first_name} {registro_merma.usuario_aprobacion.last_name}" if registro_merma.usuario_aprobacion else None,
                'categoria_merma': registro_merma.categoria_merma.nombre,
                'bodega': registro_merma.bodega.nombre,
                'valor_total_merma': valor_total_clean,
                'productos': productos
            })
        
        return Response({
            'success': True,
            'mermas': mermas
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener historial de mermas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuarios_data(request):
    """Obtiene la lista de todos los usuarios con información del cargo"""
    
    try:
        usuarios_raw = CustomUser.objects.select_related('cargo').exclude(
            cargo__tipo='administrador'
        ).values(
            'id',
            'first_name',
            'last_name',
            'email',
            'rut',
            'fecha_nacimiento',
            'is_active',
            'date_joined',
            'cargo__nombre'
        ).order_by('first_name', 'last_name')
        
        usuarios = []
        for usuario in usuarios_raw:
            # Formatear fecha de nacimiento
            fecha_nacimiento = usuario['fecha_nacimiento'].strftime('%d/%m/%Y') if usuario['fecha_nacimiento'] else None
            
            # Formatear fecha de registro
            fecha_registro = usuario['date_joined'].strftime('%d/%m/%Y')
            
            usuarios.append({
                'id': usuario['id'],
                'nombre_completo': f"{usuario['first_name']} {usuario['last_name']}",
                'email': usuario['email'] or '',
                'rut': usuario['rut'] or '',
                'fecha_nacimiento': fecha_nacimiento,
                'fecha_registro': fecha_registro,
                'activo': usuario['is_active'],
                'cargo': usuario['cargo__nombre'] or 'Sin cargo asignado'
            })
        
        return Response({
            'success': True,
            'usuarios': usuarios
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener usuarios: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conductores_data(request):
    """Obtiene la lista de conductores con id, nombre, apellido y rut"""
    
    try:
        conductores = Conductor.objects.all().values(
            'id',
            'nombre', 
            'apellido',
            'rut'
        ).order_by('nombre', 'apellido')
        
        return Response({
            'success': True,
            'conductores': list(conductores)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener conductores: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ingresos_data(request):
    """Obtiene el historial completo de ingresos con sus detalles"""
    
    try:
        ingresos_queryset = IngresoProducto.objects.select_related(
            'proveedor', 'bodega', 'usuario'
        ).prefetch_related(
            'detalles__producto__unidad_medida',
            'detalles__lote'
        ).all().order_by('-fecha')
        
        ingresos = []
        for ingreso in ingresos_queryset:
            # Formatear fecha y hora
            fecha_ingreso = ingreso.fecha.strftime('%d/%m/%Y')
            hora_ingreso = ingreso.fecha.strftime('%H:%M')
            
            # Obtener detalles de productos
            productos = []
            valor_total_ingreso = 0
            for detalle in ingreso.detalles.all():
                # Calcular precio por unidad (precio_compra del lote dividido por cantidad del lote)
                precio_por_unidad = detalle.lote.precio_compra / detalle.lote.cantidad if detalle.lote.cantidad > 0 else 0
                
                # Calcular valor del detalle (precio_por_unidad * cantidad_total)
                valor_detalle = precio_por_unidad * detalle.cantidad_total
                valor_total_ingreso += valor_detalle
                
                productos.append({
                    'producto_nombre': detalle.producto.nombre,
                    'unidad_medida': detalle.producto.unidad_medida.abreviatura,
                    'cantidad_total': int(detalle.cantidad_total),
                    'cantidad_lotes': int(detalle.cantidad_lotes),
                    'cantidad_por_lote': int(detalle.producto.cantidad_por_lote),
                    'codigo_lote': detalle.lote.codigo_lote,
                    'precio_compra': int(precio_por_unidad),
                    'valor_detalle': int(valor_detalle)
                })
            
            ingresos.append({
                'id': ingreso.id,
                'fecha_ingreso': fecha_ingreso,
                'hora_ingreso': hora_ingreso,
                'proveedor': ingreso.proveedor.nombre,
                'usuario_registro': f"{ingreso.usuario.first_name} {ingreso.usuario.last_name}" if ingreso.usuario else "Usuario no disponible",
                'descripcion': ingreso.descripcion or '',
                'valor_total_ingreso': int(valor_total_ingreso),
                'productos': productos
            })
        
        return Response({
            'success': True,
            'ingresos': ingresos
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener historial de ingresos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salidas_data(request):
    """Obtiene el historial completo de salidas con sus detalles"""
    
    try:
        salidas_queryset = SalidaProducto.objects.select_related(
            'cliente', 'bodega', 'usuario', 'conductor'
        ).prefetch_related(
            'detalles__lote__producto__unidad_medida'
        ).all().order_by('-fecha')
        
        salidas = []
        for salida in salidas_queryset:
            # Formatear fecha y hora
            fecha_salida = salida.fecha.strftime('%d/%m/%Y')
            hora_salida = salida.fecha.strftime('%H:%M')
            
            # Obtener detalles de productos
            productos = []
            valor_total_salida = 0
            for detalle in salida.detalles.all():
                # Calcular precio por unidad (precio_compra del lote dividido por cantidad del lote)
                precio_por_unidad = detalle.lote.precio_compra / detalle.lote.cantidad if detalle.lote.cantidad > 0 else 0
                
                # Calcular valor del detalle (precio_por_unidad * cantidad_total)
                valor_detalle = precio_por_unidad * detalle.cantidad_total
                valor_total_salida += valor_detalle
                
                productos.append({
                    'producto_nombre': detalle.lote.producto.nombre,
                    'unidad_medida': detalle.lote.producto.unidad_medida.abreviatura,
                    'cantidad_total': int(detalle.cantidad_total),
                    'cantidad_lotes': int(detalle.cantidad_lotes),
                    'cantidad_por_lote': int(detalle.lote.producto.cantidad_por_lote),
                    'codigo_lote': detalle.lote.codigo_lote,
                    'precio_compra': int(precio_por_unidad),
                    'valor_detalle': int(valor_detalle)
                })
            
            salidas.append({
                'id': salida.id,
                'fecha_salida': fecha_salida,
                'hora_salida': hora_salida,
                'cliente': salida.cliente.nombre,
                'conductor': f"{salida.conductor.nombre} {salida.conductor.apellido}" if salida.conductor else "Sin conductor asignado",
                'usuario_registro': f"{salida.usuario.first_name} {salida.usuario.last_name}" if salida.usuario else "Usuario no disponible",
                'descripcion': salida.descripcion or '',
                'valor_total_salida': int(valor_total_salida),
                'productos': productos
            })
        
        return Response({
            'success': True,
            'salidas': salidas
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener historial de salidas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_admin_data(request):
    """Obtiene todos los productos con información completa para administración"""
    
    try:
        productos_queryset = Producto.objects.select_related(
            'categoria', 'unidad_medida'
        ).all().order_by('nombre')
        
        productos = []
        for producto in productos_queryset:
            productos.append({
                'id': producto.id,
                'nombre': producto.nombre,
                'precio_unitario': int(producto.precio_unitario),
                'cantidad_por_lote': int(producto.cantidad_por_lote),
                'activo': producto.activo,
                'categoria': producto.categoria.nombre if producto.categoria else None,
                'unidad_medida': producto.unidad_medida.nombre
            })
        
        return Response({
            'success': True,
            'productos': productos
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener productos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unidad_medida_data(request):
    """Obtiene todas las unidades de medida disponibles"""
    
    try:
        unidades = UnidadMedida.objects.all().order_by('nombre')
        
        unidades_list = []
        for unidad in unidades:
            unidades_list.append({
                'id': unidad.id,
                'nombre': unidad.nombre,
                'abreviatura': unidad.abreviatura
            })
        
        return Response({
            'success': True,
            'unidades_medida': unidades_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener unidades de medida: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def categoria_data(request):
    """Obtiene todas las categorías de productos disponibles"""
    
    try:
        categorias = Categoria.objects.all().order_by('nombre')
        
        categorias_list = []
        for categoria in categorias:
            categorias_list.append({
                'id': categoria.id,
                'nombre': categoria.nombre
            })
        
        return Response({
            'success': True,
            'categorias': categorias_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener categorías: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

