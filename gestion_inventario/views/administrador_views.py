"""
Vistas específicas para usuarios con cargo de ADMINISTRADOR
- Gestión completa de usuarios
- Gestión de bodegas
- Reportes generales del sistema
- Configuración global
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.contrib.auth.hashers import make_password

from proyecto_integracion.settings import BASE_DIR
import secrets
import string
from ..models import (
    CustomUser, Cargo, Bodega, Producto, InventarioLote,
    IngresoProducto, SalidaProducto, RegistroMerma, Lote,
    DetalleSalida, DetalleMerma, Categoria, UnidadMedida,
    Proveedor, Cliente, Conductor
)
from ..serializers import (
    CustomUserSerializer, BodegaSerializer, ProductoSerializer,
    CargoSerializer, InventarioLoteSerializer, RegistroMermaSerializer
)

from email.message import EmailMessage
import smtplib

def verificar_administrador(user):
    """Verifica si el usuario es administrador"""
    return user.cargo and user.cargo.tipo == 'administrador'

# =============== GESTIÓN DE USUARIOS ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios(request):
    """Lista todos los usuarios del sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        usuarios = CustomUser.objects.all()
        serializer = CustomUserSerializer(usuarios, many=True)
        return Response({
            'success': True,
            'usuarios': serializer.data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al listar usuarios: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_usuario(request):
    """Registra un nuevo usuario en el sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        apellido = request.data.get('apellido', '').strip()
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        rut = request.data.get('rut', '').strip()
        cargo_id = request.data.get('cargo')
        email = request.data.get('email', '').strip()
        
        # Validaciones básicas
        if not all([nombre, apellido, fecha_nacimiento, rut, cargo_id, email]):
            return Response({
                'success': False,
                'error': 'Todos los campos son obligatorios (incluyendo email)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el cargo existe
        try:
            cargo = Cargo.objects.get(id=cargo_id)
        except Cargo.DoesNotExist:
            return Response({
                'success': False,
                'error': 'El cargo especificado no existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté ya registrado
        if CustomUser.objects.filter(rut=rut).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un usuario con este RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generar username único basado en nombre y apellido
        username_base = f"{nombre.lower()}.{apellido.lower()}"
        username = username_base
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{username_base}{counter}"
            counter += 1
        
        # Crear el usuario sin contraseña (será establecida por el usuario)
        usuario = CustomUser.objects.create_user(
            username=username,
            email=email,
            first_name=nombre,
            last_name=apellido,
            fecha_nacimiento=fecha_nacimiento,
            rut=rut,
            cargo=cargo,
            password=None,  # Sin contraseña inicial
            is_password_set=False
        )
        
        # Generar token único para creación de contraseña
        from rest_framework.authtoken.models import Token
        token, created = Token.objects.get_or_create(user=usuario)
        
        # Generar link para crear contraseña
        link_crear_password = f"http://localhost:5173/crear-password/{token.key}"
        
        # Envío de correo con el link de creación de contraseña
        try:
            # Preparar datos del correo
            destinatario = usuario.email
            remitente = "matias.alarcon065@gmail.com"
            asunto = "Bienvenido al Sistema de Gestión de Inventario"
            
            mensaje = f'''
            <h2>Bienvenido al Sistema de Gestión de Inventario</h2>
            <p>Hola {usuario.first_name} {usuario.last_name},</p>
            <p>Se ha creado tu cuenta en el sistema con los siguientes datos:</p>
            <ul>
                <li><strong>Usuario:</strong> {usuario.username}</li>
                <li><strong>Cargo:</strong> {cargo.nombre}</li>
            </ul>
            <p>Para completar tu registro y establecer tu contraseña, haz clic en el siguiente enlace:</p>
            <p><a href="{link_crear_password}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Crear Contraseña</a></p>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p>{link_crear_password}</p>
            <p><strong>Importante:</strong> Este enlace es único y personal. No lo compartas con nadie.</p>
            <p>Saludos,<br>Equipo de Gestión de Inventario</p>
            '''
            
            email = EmailMessage()
            email["From"] = remitente
            email["To"] = destinatario
            email["Subject"] = asunto
            email.set_content(mensaje, subtype='html')
            
            smtp = smtplib.SMTP_SSL('smtp.gmail.com')
            smtp.login(remitente, "dcmu fhcq wkby onil")
            smtp.sendmail(remitente, destinatario, email.as_string())
            smtp.quit()
            
        except Exception as email_error:
            # Log del error pero no fallar el registro
            print(f"Error al enviar correo: {email_error}")
            return Response({
                'success': False,
                'error': f'Usuario creado pero error al enviar correo: {str(email_error)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Serializar usuario para respuesta
        serializer = CustomUserSerializer(usuario)
        
        return Response({
            'success': True,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def establecer_password(request):
    """Establece la contraseña para un usuario usando su token"""
    
    try:
        # Obtener datos del request
        token_key = request.data.get('token')
        password = request.data.get('password')
        
        # Validaciones básicas
        if not token_key or not password:
            return Response({
                'success': False,
                'error': 'Token y contraseña son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar longitud mínima de contraseña
        if len(password) < 8:
            return Response({
                'success': False,
                'error': 'La contraseña debe tener al menos 8 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar el token y obtener el usuario
        from rest_framework.authtoken.models import Token
        try:
            token = Token.objects.get(key=token_key)
            usuario = token.user
        except Token.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Token inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el usuario no tenga contraseña establecida
        if usuario.is_password_set:
            return Response({
                'success': False,
                'error': 'Este usuario ya tiene una contraseña establecida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Establecer la nueva contraseña
        usuario.set_password(password)
        usuario.is_password_set = True
        usuario.save()
        
        # Opcional: Eliminar el token después de usar (por seguridad)
        token.delete()
        
        return Response({
            'success': True,
            'message': 'Contraseña establecida exitosamente. Ya puedes iniciar sesión.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al establecer contraseña: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def correo(request):
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener datos del request o usar valores por defecto
        remitente = "matias.alarcon065@gmail.com"
        destinatario = 'Diego.123.fyd@gmail.com'
        mensaje = '<p>Hola, este es un mensaje del sistema de gestión de inventario.</p>'
        
        email = EmailMessage()
        email["From"] = remitente
        email["To"] = destinatario
        email["Subject"] = "Notificación del sistema de gestión de inventario"
        email.set_content(mensaje)
        
        smtp = smtplib.SMTP_SSL('smtp.gmail.com')
        smtp.login(remitente, "dcmu fhcq wkby onil")
        smtp.sendmail(remitente, destinatario, email.as_string())

        smtp.quit()
        
        return Response({
            'success': True,
            'message': 'Correo enviado exitosamente',
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al enviar correo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_usuario(request, usuario_id):
    """Elimina (desactiva) un usuario del sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        usuario = get_object_or_404(CustomUser, id=usuario_id)
        
        # No permitir que se elimine a sí mismo
        if usuario.id == request.user.id:
            return Response({
                'success': False,
                'error': 'No puedes eliminar tu propio usuario'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Desactivar en lugar de eliminar
        usuario.is_active = False
        usuario.save()
        
        # Invalidar tokens existentes del usuario
        from rest_framework.authtoken.models import Token
        try:
            token = Token.objects.get(user=usuario)
            token.delete()
        except Token.DoesNotExist:
            pass  # No había token
        
        return Response({
            'success': True,
            'message': f'Usuario {usuario.first_name} {usuario.last_name} desactivado'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al eliminar usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desactivar_usuario(request, usuario_id):
    """Desactiva un usuario del sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        usuario = get_object_or_404(CustomUser, id=usuario_id)
        
        # No permitir que se desactive a sí mismo
        if usuario.id == request.user.id:
            return Response({
                'success': False,
                'error': 'No puedes desactivar tu propio usuario'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si ya está desactivado
        if not usuario.is_active:
            return Response({
                'success': False,
                'error': 'El usuario ya está desactivado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Desactivar el usuario
        usuario.is_active = False
        usuario.save()
        
        # Invalidar tokens existentes del usuario
        from rest_framework.authtoken.models import Token
        try:
            token = Token.objects.get(user=usuario)
            token.delete()
        except Token.DoesNotExist:
            pass  # No había token
        
        return Response({
            'success': True,
            'message': f'Usuario {usuario.first_name} {usuario.last_name} desactivado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al desactivar usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activar_usuario(request, usuario_id):
    """Activa un usuario del sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        usuario = get_object_or_404(CustomUser, id=usuario_id)
        
        # Verificar si ya está activado
        if usuario.is_active:
            return Response({
                'success': False,
                'error': 'El usuario ya está activado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Activar el usuario
        usuario.is_active = True
        usuario.save()
        
        return Response({
            'success': True,
            'message': f'Usuario {usuario.first_name} {usuario.last_name} activado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al activar usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_producto(request):
    """Crea un nuevo producto en el sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        nombre = request.data.get('nombre')
        precio_unitario = request.data.get('precio_unitario')
        categoria_id = request.data.get('categoria_id')
        unidad_medida_id = request.data.get('unidad_medida_id')
        cantidad_por_lote_input = request.data.get('cantidad_por_lote', 1)
        
        if not all([nombre, precio_unitario, categoria_id, unidad_medida_id]):
            return Response({
                'success': False,
                'error': 'Todos los campos son requeridos: nombre, precio_unitario, categoria_id, unidad_medida_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from ..models import Categoria, UnidadMedida
        
        categoria = get_object_or_404(Categoria, id=categoria_id)
        unidad_medida = get_object_or_404(UnidadMedida, id=unidad_medida_id)
        
        # Determinar cantidad_por_lote según la unidad de medida
        if int(unidad_medida_id) == 1:  # Unidad
            cantidad_por_lote = cantidad_por_lote_input
        elif int(unidad_medida_id) in [2, 3]:  # Otras unidades de medida
            cantidad_por_lote = 1
        else:
            cantidad_por_lote = cantidad_por_lote_input  # Para futuras unidades de medida
        
        producto = Producto.objects.create(
            nombre=nombre,
            precio_unitario=precio_unitario,
            categoria=categoria,
            unidad_medida=unidad_medida,
            cantidad_por_lote=cantidad_por_lote
        )
        
        serializer = ProductoSerializer(producto)
        
        return Response({
            'success': True,
            'message': 'Producto creado exitosamente',
            'producto': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al crear producto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_producto(request, producto_id):
    """Elimina un producto del sistema"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        producto = get_object_or_404(Producto, id=producto_id)
        
        # Verificar si el producto tiene lotes asociados
        lotes_asociados = Lote.objects.filter(producto=producto).count()
        if lotes_asociados > 0:
            return Response({
                'success': False,
                'error': f'No se puede eliminar el producto. Tiene {lotes_asociados} lotes asociados en el inventario.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        nombre_producto = producto.nombre
        producto.delete()
        
        return Response({
            'success': True,
            'message': f'Producto "{nombre_producto}" eliminado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al eliminar producto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desactivar_producto(request, producto_id):
    """Desactiva un producto para que no aparezca en nuevos registros"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        producto = get_object_or_404(Producto, id=producto_id)
        
        if not producto.activo:
            return Response({
                'success': False,
                'error': 'El producto ya está inactivo'
            }, status=status.HTTP_400_BAD_REQUEST)

        producto.activo = False
        producto.save()
        
        return Response({
            'success': True,
            'message': f'Producto "{producto.nombre}" desactivado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al desactivar producto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activar_producto(request, producto_id):
    """Activa un producto previamente desactivado"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        producto = get_object_or_404(Producto, id=producto_id)
        
        if producto.activo:
             return Response({
                'success': False,
                'error': 'El producto ya está activo'
            }, status=status.HTTP_400_BAD_REQUEST)

        producto.activo = True
        producto.save()
        
        return Response({
            'success': True,
            'message': f'Producto "{producto.nombre}" activado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al activar producto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_ingreso(request, ingreso_id):
    """Elimina un ingreso y sus lotes asociados (si no han sido usados)"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        ingreso = get_object_or_404(IngresoProducto, id=ingreso_id)
        
        # Verificar si algún lote del ingreso ha sido usado
        for detalle in ingreso.detalles.all():
            lote = detalle.lote
            
            # Verificar uso en salidas
            if DetalleSalida.objects.filter(lote=lote).exists():
                return Response({
                    'success': False,
                    'error': f'No se puede eliminar el ingreso. El lote {lote.codigo_lote} ya tiene salidas registradas.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar uso en mermas
            if DetalleMerma.objects.filter(lote=lote).exists():
                return Response({
                    'success': False,
                    'error': f'No se puede eliminar el ingreso. El lote {lote.codigo_lote} ya tiene mermas registradas.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Si pasa las validaciones, eliminar lotes (esto eliminará detalles e inventario por CASCADE)
        # Pero espera, DetalleIngreso tiene CASCADE con Ingreso, pero Lote NO tiene CASCADE con DetalleIngreso.
        # Debemos eliminar los lotes explícitamente.
        
        lotes_a_eliminar = [detalle.lote for detalle in ingreso.detalles.all()]
        
        # Eliminar el ingreso (elimina detalles por CASCADE)
        ingreso.delete()
        
        # Eliminar los lotes
        for lote in lotes_a_eliminar:
            lote.delete()
            
        return Response({
            'success': True,
            'message': 'Ingreso eliminado exitosamente y stock revertido'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al eliminar ingreso: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_salida(request, salida_id):
    """Elimina una salida y restaura el stock a los lotes"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        salida = get_object_or_404(SalidaProducto, id=salida_id)
        
        # Restaurar stock
        for detalle in salida.detalles.all():
            lote = detalle.lote
            lote.cantidad += detalle.cantidad_total
            
            # Reactivar lote si estaba inactivo y ahora tiene stock
            if lote.cantidad > 0 and not lote.activo:
                lote.activo = True
                lote.fecha_inactivacion = None
            
            lote.save()
        
        # Eliminar la salida
        salida.delete()
        
        return Response({
            'success': True,
            'message': 'Salida eliminada exitosamente y stock restaurado'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al eliminar salida: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_merma(request, merma_id):
    """Elimina una merma y restaura el stock a los lotes"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        merma = get_object_or_404(RegistroMerma, id=merma_id)
        
        # Solo restaurar stock si la merma estaba aprobada
        if merma.estado == 'aprobado':
            for detalle in merma.detalles_merma.all():
                lote = detalle.lote
                lote.cantidad += detalle.cantidad_merma
                
                # Reactivar lote si estaba inactivo y ahora tiene stock
                if lote.cantidad > 0 and not lote.activo:
                    lote.activo = True
                    lote.fecha_inactivacion = None
                
                lote.save()
        
        # Eliminar la merma
        merma.delete()
        
        return Response({
            'success': True,
            'message': 'Merma eliminada exitosamente' + (' y stock restaurado' if merma.estado == 'aprobado' else '')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al eliminar merma: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_producto(request, producto_id):
    """Edita un producto existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        producto = get_object_or_404(Producto, id=producto_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre')
        categoria_id = request.data.get('categoria_id')
        unidad_medida_id = request.data.get('unidad_medida_id')
        cantidad_por_lote = request.data.get('cantidad_por_lote')
        precio_unitario = request.data.get('precio_unitario')
        
        # Validar campos requeridos
        if not nombre or not categoria_id or not unidad_medida_id or not cantidad_por_lote or not precio_unitario:
            return Response({
                'success': False,
                'error': 'Todos los campos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que la categoría existe
        try:
            categoria = Categoria.objects.get(id=categoria_id)
        except Categoria.DoesNotExist:
            return Response({
                'success': False,
                'error': 'La categoría seleccionada no existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que la unidad de medida existe
        try:
            unidad_medida = UnidadMedida.objects.get(id=unidad_medida_id)
        except UnidadMedida.DoesNotExist:
            return Response({
                'success': False,
                'error': 'La unidad de medida seleccionada no existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar valores numéricos
        try:
            cantidad_por_lote = int(cantidad_por_lote)
            if cantidad_por_lote <= 0:
                return Response({
                    'success': False,
                    'error': 'La cantidad por lote debe ser mayor a 0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'La cantidad por lote debe ser un número entero válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            precio_unitario = float(precio_unitario)
            if precio_unitario <= 0:
                return Response({
                    'success': False,
                    'error': 'El precio unitario debe ser mayor a 0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'El precio unitario debe ser un número válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el producto
        producto.nombre = nombre
        producto.categoria = categoria
        producto.unidad_medida = unidad_medida
        producto.cantidad_por_lote = cantidad_por_lote
        producto.precio_unitario = precio_unitario
        producto.save()
        
        return Response({
            'success': True,
            'message': f'Producto "{producto.nombre}" actualizado exitosamente',
            'producto': {
                'id': producto.id,
                'nombre': producto.nombre,
                'categoria': producto.categoria.nombre,
                'unidad_medida': producto.unidad_medida.nombre,
                'cantidad_por_lote': producto.cantidad_por_lote,
                'precio_unitario': int(producto.precio_unitario),
                'activo': producto.activo
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar producto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== GESTIÓN DE PROVEEDORES ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def proveedores_admin_data(request):
    """Obtiene todos los proveedores con información completa"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        proveedores = Proveedor.objects.all().order_by('nombre')
        
        proveedores_list = []
        for proveedor in proveedores:
            proveedores_list.append({
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'rut': proveedor.rut,
                'telefono': proveedor.telefono or '',
                'direccion': proveedor.direccion or '',
                'email': proveedor.email or '',
                'es_persona_juridica': proveedor.es_persona_juridica,
                'activo': proveedor.activo
            })
        
        return Response({
            'success': True,
            'proveedores': proveedores_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener proveedores: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_proveedor(request):
    """Registra un nuevo proveedor"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        direccion = request.data.get('direccion', '').strip()
        email = request.data.get('email', '').strip()
        es_persona_juridica = request.data.get('es_persona_juridica', True)
        
        # Validar campos requeridos
        if not nombre or not rut:
            return Response({
                'success': False,
                'error': 'El nombre y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado
        if Proveedor.objects.filter(rut=rut).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un proveedor con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el proveedor
        proveedor = Proveedor.objects.create(
            nombre=nombre,
            rut=rut,
            telefono=telefono if telefono else None,
            direccion=direccion if direccion else None,
            email=email if email else None,
            es_persona_juridica=es_persona_juridica
        )
        
        return Response({
            'success': True,
            'message': f'Proveedor "{proveedor.nombre}" registrado exitosamente',
            'proveedor': {
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'rut': proveedor.rut,
                'telefono': proveedor.telefono or '',
                'direccion': proveedor.direccion or '',
                'email': proveedor.email or '',
                'es_persona_juridica': proveedor.es_persona_juridica,
                'activo': proveedor.activo
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar proveedor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_proveedor(request, proveedor_id):
    """Edita un proveedor existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        proveedor = get_object_or_404(Proveedor, id=proveedor_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        direccion = request.data.get('direccion', '').strip()
        email = request.data.get('email', '').strip()
        es_persona_juridica = request.data.get('es_persona_juridica')
        
        # Validar campos requeridos
        if not nombre or not rut:
            return Response({
                'success': False,
                'error': 'El nombre y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado (excepto el mismo proveedor)
        if Proveedor.objects.filter(rut=rut).exclude(id=proveedor_id).exists():
            return Response({
                'success': False,
                'error': 'Ya existe otro proveedor con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el proveedor
        proveedor.nombre = nombre
        proveedor.rut = rut
        proveedor.telefono = telefono if telefono else None
        proveedor.direccion = direccion if direccion else None
        proveedor.email = email if email else None
        if es_persona_juridica is not None:
            proveedor.es_persona_juridica = es_persona_juridica
        proveedor.save()
        
        return Response({
            'success': True,
            'message': f'Proveedor "{proveedor.nombre}" actualizado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar proveedor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== GESTIÓN DE CLIENTES ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clientes_admin_data(request):
    """Obtiene todos los clientes con información completa"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        clientes = Cliente.objects.all().order_by('nombre')
        
        clientes_list = []
        for cliente in clientes:
            clientes_list.append({
                'id': cliente.id,
                'nombre': cliente.nombre,
                'rut': cliente.rut,
                'telefono': cliente.telefono or '',
                'direccion': cliente.direccion or '',
                'email': cliente.email or '',
                'es_persona_juridica': cliente.es_persona_juridica,
                'activo': cliente.activo
            })
        
        return Response({
            'success': True,
            'clientes': clientes_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener clientes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_cliente(request):
    """Registra un nuevo cliente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        direccion = request.data.get('direccion', '').strip()
        email = request.data.get('email', '').strip()
        es_persona_juridica = request.data.get('es_persona_juridica', True)
        
        # Validar campos requeridos
        if not nombre or not rut:
            return Response({
                'success': False,
                'error': 'El nombre y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado
        if Cliente.objects.filter(rut=rut).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un cliente con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el cliente
        cliente = Cliente.objects.create(
            nombre=nombre,
            rut=rut,
            telefono=telefono if telefono else None,
            direccion=direccion if direccion else None,
            email=email if email else None,
            es_persona_juridica=es_persona_juridica
        )
        
        return Response({
            'success': True,
            'message': f'Cliente "{cliente.nombre}" registrado exitosamente',
            'cliente': {
                'id': cliente.id,
                'nombre': cliente.nombre,
                'rut': cliente.rut,
                'telefono': cliente.telefono or '',
                'direccion': cliente.direccion or '',
                'email': cliente.email or '',
                'es_persona_juridica': cliente.es_persona_juridica,
                'activo': cliente.activo
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar cliente: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_cliente(request, cliente_id):
    """Edita un cliente existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        direccion = request.data.get('direccion', '').strip()
        email = request.data.get('email', '').strip()
        es_persona_juridica = request.data.get('es_persona_juridica')
        
        # Validar campos requeridos
        if not nombre or not rut:
            return Response({
                'success': False,
                'error': 'El nombre y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado (excepto el mismo cliente)
        if Cliente.objects.filter(rut=rut).exclude(id=cliente_id).exists():
            return Response({
                'success': False,
                'error': 'Ya existe otro cliente con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el cliente
        cliente.nombre = nombre
        cliente.rut = rut
        cliente.telefono = telefono if telefono else None
        cliente.direccion = direccion if direccion else None
        cliente.email = email if email else None
        if es_persona_juridica is not None:
            cliente.es_persona_juridica = es_persona_juridica
        cliente.save()
        
        return Response({
            'success': True,
            'message': f'Cliente "{cliente.nombre}" actualizado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar cliente: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== GESTIÓN DE CONDUCTORES ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conductores_admin_data(request):
    """Obtiene todos los conductores con información completa"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conductores = Conductor.objects.all().order_by('nombre', 'apellido')
        
        conductores_list = []
        for conductor in conductores:
            conductores_list.append({
                'id': conductor.id,
                'nombre': conductor.nombre,
                'apellido': conductor.apellido,
                'rut': conductor.rut,
                'telefono': conductor.telefono or '',
                'fecha_nacimiento': conductor.fecha_nacimiento.strftime('%Y-%m-%d') if conductor.fecha_nacimiento else None,
                'activo': conductor.activo
            })
        
        return Response({
            'success': True,
            'conductores': conductores_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener conductores: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_conductor(request):
    """Registra un nuevo conductor"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        apellido = request.data.get('apellido', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        
        # Validar campos requeridos
        if not nombre or not apellido or not rut:
            return Response({
                'success': False,
                'error': 'El nombre, apellido y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado
        if Conductor.objects.filter(rut=rut).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un conductor con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el conductor
        conductor = Conductor.objects.create(
            nombre=nombre,
            apellido=apellido,
            rut=rut,
            telefono=telefono if telefono else None,
            fecha_nacimiento=fecha_nacimiento if fecha_nacimiento else None
        )
        
        return Response({
            'success': True,
            'message': f'Conductor "{conductor.nombre} {conductor.apellido}" registrado exitosamente',
            'conductor': {
                'id': conductor.id,
                'nombre': conductor.nombre,
                'apellido': conductor.apellido,
                'rut': conductor.rut,
                'telefono': conductor.telefono or '',
                'fecha_nacimiento': conductor.fecha_nacimiento.strftime('%Y-%m-%d') if conductor.fecha_nacimiento else None,
                'activo': conductor.activo
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al registrar conductor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_conductor(request, conductor_id):
    """Edita un conductor existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conductor = get_object_or_404(Conductor, id=conductor_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        apellido = request.data.get('apellido', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        
        # Validar campos requeridos
        if not nombre or not apellido or not rut:
            return Response({
                'success': False,
                'error': 'El nombre, apellido y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado (excepto el mismo conductor)
        if Conductor.objects.filter(rut=rut).exclude(id=conductor_id).exists():
            return Response({
                'success': False,
                'error': 'Ya existe otro conductor con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el conductor
        conductor.nombre = nombre
        conductor.apellido = apellido
        conductor.rut = rut
        conductor.telefono = telefono if telefono else None
        if fecha_nacimiento:
            conductor.fecha_nacimiento = fecha_nacimiento
        conductor.save()
        
        # Formatear fecha_nacimiento para respuesta
        fecha_formatted = None
        if conductor.fecha_nacimiento:
            if isinstance(conductor.fecha_nacimiento, str):
                fecha_formatted = conductor.fecha_nacimiento
            else:
                fecha_formatted = conductor.fecha_nacimiento.strftime('%Y-%m-%d')
        
        return Response({
            'success': True,
            'message': f'Conductor "{conductor.nombre} {conductor.apellido}" actualizado exitosamente',
            'conductor': {
                'id': conductor.id,
                'nombre': conductor.nombre,
                'apellido': conductor.apellido,
                'rut': conductor.rut,
                'telefono': conductor.telefono or '',
                'fecha_nacimiento': fecha_formatted,
                'activo': conductor.activo
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar conductor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== ACTIVAR/DESACTIVAR PROVEEDORES ===============

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def activar_proveedor(request, proveedor_id):
    """Activa un proveedor"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        proveedor = get_object_or_404(Proveedor, id=proveedor_id)
        
        if proveedor.activo:
            return Response({
                'success': False,
                'error': 'El proveedor ya está activo'
            }, status=status.HTTP_400_BAD_REQUEST)

        proveedor.activo = True
        proveedor.save()
        
        return Response({
            'success': True,
            'message': f'Proveedor "{proveedor.nombre}" activado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al activar proveedor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def desactivar_proveedor(request, proveedor_id):
    """Desactiva un proveedor"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        proveedor = get_object_or_404(Proveedor, id=proveedor_id)
        
        if not proveedor.activo:
            return Response({
                'success': False,
                'error': 'El proveedor ya está inactivo'
            }, status=status.HTTP_400_BAD_REQUEST)

        proveedor.activo = False
        proveedor.save()
        
        return Response({
            'success': True,
            'message': f'Proveedor "{proveedor.nombre}" desactivado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al desactivar proveedor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_proveedor(request, proveedor_id):
    """Edita un proveedor existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        proveedor = get_object_or_404(Proveedor, id=proveedor_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        direccion = request.data.get('direccion', '').strip()
        email = request.data.get('email', '').strip()
        es_persona_juridica = request.data.get('es_persona_juridica', True)
        
        # Validar campos requeridos
        if not nombre or not rut:
            return Response({
                'success': False,
                'error': 'El nombre y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado (excepto el mismo proveedor)
        if Proveedor.objects.filter(rut=rut).exclude(id=proveedor_id).exists():
            return Response({
                'success': False,
                'error': 'Ya existe otro proveedor con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el proveedor
        proveedor.nombre = nombre
        proveedor.rut = rut
        proveedor.telefono = telefono if telefono else None
        proveedor.direccion = direccion if direccion else None
        proveedor.email = email if email else None
        proveedor.es_persona_juridica = es_persona_juridica
        proveedor.save()
        
        return Response({
            'success': True,
            'message': f'Proveedor "{proveedor.nombre}" actualizado exitosamente',
            'proveedor': {
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'rut': proveedor.rut,
                'telefono': proveedor.telefono or '',
                'direccion': proveedor.direccion or '',
                'email': proveedor.email or '',
                'es_persona_juridica': proveedor.es_persona_juridica,
                'activo': proveedor.activo
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar proveedor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== ACTIVAR/DESACTIVAR CLIENTES ===============

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def activar_cliente(request, cliente_id):
    """Activa un cliente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)
        
        if cliente.activo:
            return Response({
                'success': False,
                'error': 'El cliente ya está activo'
            }, status=status.HTTP_400_BAD_REQUEST)

        cliente.activo = True
        cliente.save()
        
        return Response({
            'success': True,
            'message': f'Cliente "{cliente.nombre}" activado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al activar cliente: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def desactivar_cliente(request, cliente_id):
    """Desactiva un cliente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)
        
        if not cliente.activo:
            return Response({
                'success': False,
                'error': 'El cliente ya está inactivo'
            }, status=status.HTTP_400_BAD_REQUEST)

        cliente.activo = False
        cliente.save()
        
        return Response({
            'success': True,
            'message': f'Cliente "{cliente.nombre}" desactivado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al desactivar cliente: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_cliente(request, cliente_id):
    """Edita un cliente existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        direccion = request.data.get('direccion', '').strip()
        email = request.data.get('email', '').strip()
        es_persona_juridica = request.data.get('es_persona_juridica', True)
        
        # Validar campos requeridos
        if not nombre or not rut:
            return Response({
                'success': False,
                'error': 'El nombre y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado (excepto el mismo cliente)
        if Cliente.objects.filter(rut=rut).exclude(id=cliente_id).exists():
            return Response({
                'success': False,
                'error': 'Ya existe otro cliente con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el cliente
        cliente.nombre = nombre
        cliente.rut = rut
        cliente.telefono = telefono if telefono else None
        cliente.direccion = direccion if direccion else None
        cliente.email = email if email else None
        cliente.es_persona_juridica = es_persona_juridica
        cliente.save()
        
        return Response({
            'success': True,
            'message': f'Cliente "{cliente.nombre}" actualizado exitosamente',
            'cliente': {
                'id': cliente.id,
                'nombre': cliente.nombre,
                'rut': cliente.rut,
                'telefono': cliente.telefono or '',
                'direccion': cliente.direccion or '',
                'email': cliente.email or '',
                'es_persona_juridica': cliente.es_persona_juridica,
                'activo': cliente.activo
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar cliente: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== ACTIVAR/DESACTIVAR CONDUCTORES ===============

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def activar_conductor(request, conductor_id):
    """Activa un conductor"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conductor = get_object_or_404(Conductor, id=conductor_id)
        
        if conductor.activo:
            return Response({
                'success': False,
                'error': 'El conductor ya está activo'
            }, status=status.HTTP_400_BAD_REQUEST)

        conductor.activo = True
        conductor.save()
        
        return Response({
            'success': True,
            'message': f'Conductor "{conductor.nombre} {conductor.apellido}" activado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al activar conductor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def desactivar_conductor(request, conductor_id):
    """Desactiva un conductor"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conductor = get_object_or_404(Conductor, id=conductor_id)
        
        if not conductor.activo:
            return Response({
                'success': False,
                'error': 'El conductor ya está inactivo'
            }, status=status.HTTP_400_BAD_REQUEST)

        conductor.activo = False
        conductor.save()
        
        return Response({
            'success': True,
            'message': f'Conductor "{conductor.nombre} {conductor.apellido}" desactivado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al desactivar conductor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_conductor(request, conductor_id):
    """Edita un conductor existente"""
    
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conductor = get_object_or_404(Conductor, id=conductor_id)
        
        # Obtener datos del request
        nombre = request.data.get('nombre', '').strip()
        apellido = request.data.get('apellido', '').strip()
        rut = request.data.get('rut', '').strip()
        telefono = request.data.get('telefono', '').strip()
        fecha_nacimiento = request.data.get('fecha_nacimiento')
        
        # Validar campos requeridos
        if not nombre or not apellido or not rut:
            return Response({
                'success': False,
                'error': 'El nombre, apellido y RUT son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el RUT no esté duplicado (excepto el mismo conductor)
        if Conductor.objects.filter(rut=rut).exclude(id=conductor_id).exists():
            return Response({
                'success': False,
                'error': 'Ya existe otro conductor con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar el conductor
        conductor.nombre = nombre
        conductor.apellido = apellido
        conductor.rut = rut
        conductor.telefono = telefono if telefono else None
        conductor.fecha_nacimiento = fecha_nacimiento if fecha_nacimiento else None
        conductor.save()
        
        # Formatear fecha_nacimiento para respuesta
        fecha_formatted = None
        if conductor.fecha_nacimiento:
            if isinstance(conductor.fecha_nacimiento, str):
                fecha_formatted = conductor.fecha_nacimiento
            else:
                fecha_formatted = conductor.fecha_nacimiento.strftime('%Y-%m-%d')
        
        return Response({
            'success': True,
            'message': f'Conductor "{conductor.nombre} {conductor.apellido}" actualizado exitosamente',
            'conductor': {
                'id': conductor.id,
                'nombre': conductor.nombre,
                'apellido': conductor.apellido,
                'rut': conductor.rut,
                'telefono': conductor.telefono or '',
                'fecha_nacimiento': fecha_formatted,
                'activo': conductor.activo
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar conductor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== COMPARACIÓN DE MERMAS MENSUALES ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comparacion_mermas_mensual(request):
    """
    Endpoint para obtener comparación de mermas mensuales.
    Permisos: ADMINISTRADOR y JEFE_BODEGA
    """
    try:
        # Verificar permisos
        if not request.user.cargo:
            return Response({
                'success': False,
                'error': 'Usuario sin cargo asignado'
            }, status=status.HTTP_403_FORBIDDEN)
        
        cargo_nombre = request.user.cargo.nombre.lower()
        cargos_permitidos = ['administrador', 'jefe de bodega']
        
        if cargo_nombre not in cargos_permitidos:
            return Response({
                'success': False,
                'error': 'No tienes permisos para acceder a este recurso'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener año de los parámetros (por defecto el actual)
        year = request.GET.get('year', timezone.now().year)
        year = int(year)
        
        # Obtener mermas aprobadas del año
        mermas = RegistroMerma.objects.filter(
            estado='aprobado',
            fecha_registro__year=year
        )
        
        # Agrupar por mes y calcular pérdidas
        datos_mensuales = mermas.annotate(
            mes=TruncMonth('fecha_registro')
        ).values('mes').annotate(
            total_mermas=Count('id'),
            perdida_economica=Sum('valor_total_merma')
        ).order_by('mes')
        
        # Formatear datos mensuales para todos los 12 meses
        datos_formateados = []
        meses_nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        
        # Crear un diccionario de los datos existentes
        datos_dict = {dato['mes'].month: dato for dato in datos_mensuales}
        
        # Generar datos para todos los meses
        for mes_num in range(1, 13):
            if mes_num in datos_dict:
                dato = datos_dict[mes_num]
                datos_formateados.append({
                    'mes': meses_nombres[mes_num - 1],
                    'mes_num': mes_num,
                    'total_mermas': dato['total_mermas'],
                    'perdida_economica': float(dato['perdida_economica'] or 0)
                })
            else:
                datos_formateados.append({
                    'mes': meses_nombres[mes_num - 1],
                    'mes_num': mes_num,
                    'total_mermas': 0,
                    'perdida_economica': 0
                })
        
        # Producto con mayor pérdida por mes
        productos_mayor_perdida = []
        for mes_num in range(1, 13):
            # Obtener detalles de mermas del mes desde DetalleMerma
            detalles_mes = DetalleMerma.objects.filter(
                registro_merma__estado='aprobado',
                registro_merma__fecha_registro__year=year,
                registro_merma__fecha_registro__month=mes_num
            ).values(
                'producto__nombre',
                'producto_id'
            ).annotate(
                total_perdida=Sum('valor_merma'),
                cantidad_total=Sum('cantidad_merma')
            ).order_by('-total_perdida').first()
            
            if detalles_mes:
                productos_mayor_perdida.append({
                    'mes': meses_nombres[mes_num - 1],
                    'mes_num': mes_num,
                    'producto': detalles_mes['producto__nombre'],
                    'producto_id': detalles_mes['producto_id'],
                    'perdida_economica': float(detalles_mes['total_perdida'] or 0),
                    'cantidad': float(detalles_mes['cantidad_total'] or 0)
                })
            else:
                productos_mayor_perdida.append({
                    'mes': meses_nombres[mes_num - 1],
                    'mes_num': mes_num,
                    'producto': 'Sin datos',
                    'producto_id': None,
                    'perdida_economica': 0,
                    'cantidad': 0
                })
        
        # Top 5 productos del año desde DetalleMerma
        top_productos = DetalleMerma.objects.filter(
            registro_merma__estado='aprobado',
            registro_merma__fecha_registro__year=year
        ).values(
            'producto__nombre',
            'producto_id'
        ).annotate(
            total_perdida=Sum('valor_merma'),
            cantidad_total=Sum('cantidad_merma')
        ).order_by('-total_perdida')[:5]
        
        top_formateado = [{
            'producto': p['producto__nombre'],
            'producto_id': p['producto_id'],
            'perdida_economica': float(p['total_perdida'] or 0),
            'cantidad': float(p['cantidad_total'] or 0)
        } for p in top_productos]
        
        # Resumen
        total_anual = mermas.aggregate(Sum('valor_total_merma'))['valor_total_merma__sum'] or 0
        total_mermas_count = mermas.count()
        promedio_mensual = float(total_anual) / 12 if total_anual > 0 else 0
        
        # Obtener el año mínimo con datos
        primera_merma = RegistroMerma.objects.filter(estado='aprobado').order_by('fecha_registro').first()
        año_minimo = primera_merma.fecha_registro.year if primera_merma else timezone.now().year
        
        return Response({
            'success': True,
            'year': year,
            'año_minimo': año_minimo,
            'datos_mensuales': datos_formateados,
            'productos_mayor_perdida_mes': productos_mayor_perdida,
            'top_productos_año': top_formateado,
            'resumen': {
                'total_anual': float(total_anual),
                'total_mermas': total_mermas_count,
                'promedio_mensual': promedio_mensual
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener comparación de mermas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comparacion_mermas_categorias(request):
    """
    Endpoint para comparar mermas por categorías en un rango de fechas.
    Permite comparar dos categorías diferentes.
    Permisos: ADMINISTRADOR y JEFE_BODEGA
    """
    try:
        # Verificar permisos
        if not request.user.cargo:
            return Response({
                'success': False,
                'error': 'Usuario sin cargo asignado'
            }, status=status.HTTP_403_FORBIDDEN)
        
        cargo_nombre = request.user.cargo.nombre
        cargos_permitidos = ['Administrador', 'Jefe de bodega']
        
        if cargo_nombre not in cargos_permitidos:
            return Response({
                'success': False,
                'error': 'No tienes permisos para acceder a este recurso'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener parámetros
        categoria1_id = request.GET.get('categoria1')
        categoria2_id = request.GET.get('categoria2')
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        
        if not all([categoria1_id, categoria2_id, fecha_inicio, fecha_fin]):
            return Response({
                'success': False,
                'error': 'Faltan parámetros requeridos: categoria1, categoria2, fecha_inicio, fecha_fin'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from datetime import datetime
        from ..models import CategoriaMerma
        
        # Convertir fechas
        fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
        
        # Obtener categorías
        try:
            categoria1 = CategoriaMerma.objects.get(id=categoria1_id)
            categoria2 = CategoriaMerma.objects.get(id=categoria2_id)
        except CategoriaMerma.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Una o ambas categorías no existen'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Función auxiliar para obtener datos de una categoría
        def obtener_datos_categoria(categoria):
            mermas = RegistroMerma.objects.filter(
                estado='aprobado',
                categoria_merma=categoria,
                fecha_registro__date__gte=fecha_inicio_dt.date(),
                fecha_registro__date__lte=fecha_fin_dt.date()
            )
            
            # Agrupar por mes
            datos_mensuales = mermas.annotate(
                mes=TruncMonth('fecha_registro')
            ).values('mes').annotate(
                total_mermas=Count('id'),
                perdida_economica=Sum('valor_total_merma')
            ).order_by('mes')
            
            # Formatear datos
            meses_nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            datos_dict = {dato['mes'].month: dato for dato in datos_mensuales}
            
            datos_formateados = []
            # Determinar rango de meses
            mes_inicio = fecha_inicio_dt.month
            mes_fin = fecha_fin_dt.month
            año_inicio = fecha_inicio_dt.year
            año_fin = fecha_fin_dt.year
            
            if año_inicio == año_fin:
                # Mismo año
                for mes_num in range(mes_inicio, mes_fin + 1):
                    if mes_num in datos_dict:
                        dato = datos_dict[mes_num]
                        datos_formateados.append({
                            'mes': f"{meses_nombres[mes_num - 1]} {año_inicio}",
                            'mes_num': mes_num,
                            'año': año_inicio,
                            'total_mermas': dato['total_mermas'],
                            'perdida_economica': float(dato['perdida_economica'] or 0)
                        })
                    else:
                        datos_formateados.append({
                            'mes': f"{meses_nombres[mes_num - 1]} {año_inicio}",
                            'mes_num': mes_num,
                            'año': año_inicio,
                            'total_mermas': 0,
                            'perdida_economica': 0
                        })
            else:
                # Diferentes años - incluir todos los meses entre las fechas
                año_actual = año_inicio
                mes_actual = mes_inicio
                
                while año_actual < año_fin or (año_actual == año_fin and mes_actual <= mes_fin):
                    if mes_actual in datos_dict:
                        dato = datos_dict[mes_actual]
                        datos_formateados.append({
                            'mes': f"{meses_nombres[mes_actual - 1]} {año_actual}",
                            'mes_num': mes_actual,
                            'año': año_actual,
                            'total_mermas': dato['total_mermas'],
                            'perdida_economica': float(dato['perdida_economica'] or 0)
                        })
                    else:
                        datos_formateados.append({
                            'mes': f"{meses_nombres[mes_actual - 1]} {año_actual}",
                            'mes_num': mes_actual,
                            'año': año_actual,
                            'total_mermas': 0,
                            'perdida_economica': 0
                        })
                    
                    mes_actual += 1
                    if mes_actual > 12:
                        mes_actual = 1
                        año_actual += 1
            
            # Calcular totales
            total_perdida = mermas.aggregate(Sum('valor_total_merma'))['valor_total_merma__sum'] or 0
            total_registros = mermas.count()
            
            return {
                'nombre': categoria.nombre,
                'datos_mensuales': datos_formateados,
                'total_perdida': float(total_perdida),
                'total_registros': total_registros
            }
        
        # Obtener datos de ambas categorías
        datos_categoria1 = obtener_datos_categoria(categoria1)
        datos_categoria2 = obtener_datos_categoria(categoria2)
        
        # Combinar datos para el gráfico comparativo
        datos_comparativos = []
        for i in range(len(datos_categoria1['datos_mensuales'])):
            datos_comparativos.append({
                'mes': datos_categoria1['datos_mensuales'][i]['mes'],
                f"{categoria1.nombre}": datos_categoria1['datos_mensuales'][i]['perdida_economica'],
                f"{categoria2.nombre}": datos_categoria2['datos_mensuales'][i]['perdida_economica'],
                f"{categoria1.nombre}_cantidad": datos_categoria1['datos_mensuales'][i]['total_mermas'],
                f"{categoria2.nombre}_cantidad": datos_categoria2['datos_mensuales'][i]['total_mermas']
            })
        
        return Response({
            'success': True,
            'categoria1': datos_categoria1,
            'categoria2': datos_categoria2,
            'datos_comparativos': datos_comparativos,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener comparación de categorías: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============== GESTIÓN DE STOCK MÍNIMO ===============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_stocks_minimos(request):
    """
    Obtiene todos los productos con sus stocks mínimos configurados
    """
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from ..models import StockMinimo
        
        # Obtener todos los stocks mínimos
        stocks = StockMinimo.objects.select_related(
            'producto__unidad_medida'
        ).all().order_by('producto__nombre')
        
        datos = []
        for stock in stocks:
            datos.append({
                'id': stock.id,
                'producto_id': stock.producto.id,
                'producto_nombre': stock.producto.nombre,
                'cantidad_minima': float(stock.cantidad_minima),
                'cantidad_por_lote': float(stock.producto.cantidad_por_lote),
                'unidad_medida': stock.producto.unidad_medida.abreviatura,
                'unidad_medida_nombre': stock.producto.unidad_medida.nombre
            })
        
        return Response({
            'success': True,
            'stocks': datos
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al obtener stocks mínimos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_stock_minimo(request):
    """
    Crea o actualiza el stock mínimo de un producto
    """
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from ..models import StockMinimo
        
        producto_id = request.data.get('producto_id')
        cantidad_minima = request.data.get('cantidad_minima')
        
        if not producto_id or cantidad_minima is None:
            return Response({
                'success': False,
                'error': 'Faltan campos requeridos: producto_id, cantidad_minima'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que la cantidad sea positiva
        if float(cantidad_minima) <= 0:
            return Response({
                'success': False,
                'error': 'La cantidad mínima debe ser mayor a 0'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el producto
        producto = Producto.objects.get(id=producto_id)
        
        # Verificar si ya existe un stock mínimo para este producto
        stock, created = StockMinimo.objects.get_or_create(
            producto=producto,
            defaults={'cantidad_minima': cantidad_minima}
        )
        
        if not created:
            return Response({
                'success': False,
                'error': f'El producto "{producto.nombre}" ya tiene un stock mínimo configurado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': f'Stock mínimo creado para {producto.nombre}',
            'stock': {
                'id': stock.id,
                'producto_id': stock.producto.id,
                'producto_nombre': stock.producto.nombre,
                'cantidad_minima': float(stock.cantidad_minima),
                'cantidad_por_lote': float(stock.producto.cantidad_por_lote),
                'unidad_medida': stock.producto.unidad_medida.abreviatura
            }
        }, status=status.HTTP_201_CREATED)
        
    except Producto.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Producto no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al crear stock mínimo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_stock_minimo(request, stock_id):
    """
    Edita la cantidad mínima de un stock
    """
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from ..models import StockMinimo
        
        cantidad_minima = request.data.get('cantidad_minima')
        
        if cantidad_minima is None:
            return Response({
                'success': False,
                'error': 'Falta el campo requerido: cantidad_minima'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que la cantidad sea positiva
        if float(cantidad_minima) <= 0:
            return Response({
                'success': False,
                'error': 'La cantidad mínima debe ser mayor a 0'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener y actualizar el stock
        stock = StockMinimo.objects.select_related('producto__unidad_medida').get(id=stock_id)
        stock.cantidad_minima = cantidad_minima
        stock.save()
        
        return Response({
            'success': True,
            'message': f'Stock mínimo actualizado para {stock.producto.nombre}',
            'stock': {
                'id': stock.id,
                'producto_id': stock.producto.id,
                'producto_nombre': stock.producto.nombre,
                'cantidad_minima': float(stock.cantidad_minima),
                'cantidad_por_lote': float(stock.producto.cantidad_por_lote),
                'unidad_medida': stock.producto.unidad_medida.abreviatura
            }
        }, status=status.HTTP_200_OK)
        
    except StockMinimo.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Stock mínimo no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al editar stock mínimo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_stock_minimo(request, stock_id):
    """
    Elimina un stock mínimo configurado
    """
    if not verificar_administrador(request.user):
        return Response({
            'success': False,
            'error': 'No tienes permisos para realizar esta acción'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from ..models import StockMinimo
        
        stock = StockMinimo.objects.select_related('producto').get(id=stock_id)
        producto_nombre = stock.producto.nombre
        stock.delete()
        
        return Response({
            'success': True,
            'message': f'Stock mínimo eliminado para {producto_nombre}'
        }, status=status.HTTP_200_OK)
        
    except StockMinimo.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Stock mínimo no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al eliminar stock mínimo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)