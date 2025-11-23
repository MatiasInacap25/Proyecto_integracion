"""
Vistas de autenticación para el sistema de gestión de inventario
- Login con RUT y contraseña
- Registro de nuevos usuarios
- Logout
- Recuperación de contraseña
- Endpoint de prueba protegido
- Obtener usuario por token
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import secrets
from datetime import timedelta
from ..models import CustomUser, Cargo
from ..serializers import CustomUserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def resetear_password(request):
    """
    Endpoint para cambiar contraseña con token de recuperación
    Recibe token y nueva contraseña
    """
    token = request.data.get('token')
    nueva_password = request.data.get('password')

    if not token or not nueva_password:
        return Response({
            'success': False,
            'error': 'Token y nueva contraseña son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(nueva_password) < 6:
        return Response({
            'success': False,
            'error': 'La contraseña debe tener al menos 6 caracteres'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Buscar usuario por token
        user = CustomUser.objects.get(reset_password_token=token)

        # Verificar que el token no haya expirado
        if user.reset_password_expires and user.reset_password_expires < timezone.now():
            return Response({
                'success': False,
                'error': 'El token ha expirado. Solicita uno nuevo.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar contraseña
        user.password = make_password(nueva_password)
        user.is_password_set = True

        # Limpiar token de recuperación
        user.reset_password_token = None
        user.reset_password_expires = None
        user.save()

        return Response({
            'success': True,
            'message': 'Contraseña actualizada exitosamente'
        }, status=status.HTTP_200_OK)

    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Token inválido o expirado'
        }, status=status.HTTP_400_BAD_REQUEST)
"""
Vistas de autenticación para el sistema de gestión de inventario
- Login con RUT y contraseña
- Registro de nuevos usuarios
- Logout
- Recuperación de contraseña
- Endpoint de prueba protegido
- Obtener usuario por token
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import secrets
from datetime import timedelta
from ..models import CustomUser, Cargo
from ..serializers import CustomUserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Vista de login que acepta RUT y contraseña"""
    rut = request.data.get('rut')
    password = request.data.get('password')
    
    if not rut or not password:
        return Response({
            'success': False,
            'error': 'RUT y contraseña son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buscar usuario por RUT
        user = CustomUser.objects.get(rut=rut)
        
        # Verificar si el usuario está activo
        if not user.is_active:
            return Response({
                'success': False,
                'error': 'Usuario desactivado. Contacte al administrador.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verificar contraseña
        if user.check_password(password):
            # Crear o obtener token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'message': 'Login exitoso',
                'token': token.key,
                'cargo': user.cargo.id if user.cargo else None,
                'nombre': user.first_name,
                'apellido': user.last_name
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Usuario no encontrado con ese RUT'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Vista de registro que crea un nuevo usuario"""
    required_fields = ['rut', 'password', 'email', 'first_name', 'last_name']
    
    # Validar campos requeridos
    for field in required_fields:
        if not request.data.get(field):
            return Response({
                'success': False,
                'error': f'El campo {field} es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    rut = request.data.get('rut')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    
    # Generar username automáticamente desde el RUT
    # Remover puntos y guión del RUT para usar como username
    username = rut.replace('.', '').replace('-', '')
    
    # Si el usuario envía un username personalizado, usarlo
    if request.data.get('username'):
        username = request.data.get('username')
    fecha_nacimiento = request.data.get('fecha_nacimiento')
    cargo_id = request.data.get('cargo_id')
    bodega_id = request.data.get('bodega_id')
    
    try:
        # Verificar que no exista usuario con ese username
        if CustomUser.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un usuario con ese username'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que no exista usuario con ese RUT
        if CustomUser.objects.filter(rut=rut).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un usuario con ese RUT'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que no exista usuario con ese email
        if CustomUser.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'error': 'Ya existe un usuario con ese email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener cargo si se proporciona
        cargo = None
        if cargo_id:
            try:
                cargo = Cargo.objects.get(id=cargo_id)
            except Cargo.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Cargo no encontrado'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el usuario
        user = CustomUser.objects.create(
            username=username,
            rut=rut,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=make_password(password),  # Encriptar la contraseña
            fecha_nacimiento=fecha_nacimiento,
            cargo=cargo,
            is_password_set=True
        )
        
        # Asignar bodega si se proporciona
        if bodega_id:
            from ..models import Bodega
            try:
                bodega = Bodega.objects.get(id=bodega_id)
                user.bodega = bodega
                user.save()
            except Bodega.DoesNotExist:
                pass  # Continuar sin bodega
        
        # Crear token para el nuevo usuario
        token = Token.objects.create(user=user)
        
        # Serializar el usuario creado
        serializer = CustomUserSerializer(user)
        
        return Response({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'token': token.key,
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error al crear usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def logout_view(request):
    """Vista de logout que elimina el token"""
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({
            'success': True,
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Token no encontrado'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def solicitar_recuperacion_password(request):
    """
    Endpoint para solicitar recuperación de contraseña
    Recibe RUT, genera token único y envía correo
    """
    rut = request.data.get('rut')
    
    if not rut:
        return Response({
            'success': False,
            'error': 'RUT es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buscar usuario por RUT
        user = CustomUser.objects.get(rut=rut)
        
        # Verificar que el usuario esté activo
        if not user.is_active:
            return Response({
                'success': False,
                'error': 'Usuario desactivado. Contacte al administrador.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el usuario tenga email
        if not user.email:
            return Response({
                'success': False,
                'error': 'El usuario no tiene email registrado. Contacte al administrador.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generar token único de recuperación
        reset_token = secrets.token_urlsafe(32)
        
        # Guardar token y fecha de expiración en el usuario (válido por 1 hora)
        user.reset_password_token = reset_token
        user.reset_password_expires = timezone.now() + timedelta(hours=1)
        user.save()
        
        # Construir URL de recuperación
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url}/reset-password/{reset_token}"
        # Enviar correo HTML igual que en registrar_usuario
        try:
            import smtplib
            from email.message import EmailMessage

            destinatario = user.email

            remitente = "matias.alarcon065@gmail.com"
            password_app = "dcmu fhcq wkby onil"
            asunto = "Recuperación de Contraseña - Sistema de Inventario"

            mensaje = f'''
            <h2>Recuperación de Contraseña</h2>
            <p>Hola {user.first_name} {user.last_name},</p>
            <p>Has solicitado recuperar tu contraseña para el Sistema de Gestión de Inventario.</p>
            <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
            <p><a href="{reset_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a></p>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p>{reset_url}</p>
            <p><strong>Importante:</strong> Este enlace expirará en 1 hora y es único para tu cuenta.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p>Saludos,<br>Equipo de Gestión de Inventario</p>
            '''

            email = EmailMessage()
            email["From"] = remitente
            email["To"] = destinatario
            email["Subject"] = asunto
            email.set_content(mensaje, subtype='html')

            smtp = smtplib.SMTP_SSL('smtp.gmail.com')
            smtp.login(remitente, password_app)
            smtp.sendmail(remitente, destinatario, email.as_string())
            smtp.quit()

            return Response({
                'success': True,
                'message': f'Correo de recuperación enviado a {user.email}'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error al enviar correo: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except CustomUser.DoesNotExist:
        # Por seguridad, no revelar si el usuario existe o no
        return Response({
            'success': True,
            'message': 'Si el RUT está registrado, recibirás un correo con instrucciones.'
        }, status=status.HTTP_200_OK)