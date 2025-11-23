from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from ..models import BlockchainTransaction, Producto
from ..serializers import BlockchainTransactionSerializer


def verificar_administrador(user):
    return hasattr(user, 'cargo') and user.cargo and user.cargo.tipo == 'administrador'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_blockchain(request):
    """Listado paginado de transacciones en blockchain. Permiso: administrador."""
    if not verificar_administrador(request.user):
        return Response({'success': False, 'error': 'No tienes permisos para realizar esta acción'}, status=status.HTTP_403_FORBIDDEN)

    producto_id = request.GET.get('producto_id')
    fecha_desde = request.GET.get('fecha_desde')
    fecha_hasta = request.GET.get('fecha_hasta')
    tipo_movimiento = request.GET.get('tipo_movimiento')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 25))

    qs = BlockchainTransaction.objects.all()

    if producto_id:
        qs = qs.filter(producto__id=producto_id)
    if tipo_movimiento:
        qs = qs.filter(tipo_movimiento__icontains=tipo_movimiento)
    if fecha_desde:
        qs = qs.filter(timestamp__date__gte=fecha_desde)
    if fecha_hasta:
        qs = qs.filter(timestamp__date__lte=fecha_hasta)

    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    serializer = BlockchainTransactionSerializer(page_obj.object_list, many=True)

    return Response({
        'success': True,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'page': page,
        'results': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_producto(request, producto_id):
    """Historial completo de un producto."""
    if not verificar_administrador(request.user):
        return Response({'success': False, 'error': 'No tienes permisos para realizar esta acción'}, status=status.HTTP_403_FORBIDDEN)

    producto = get_object_or_404(Producto, id=producto_id)
    qs = BlockchainTransaction.objects.filter(producto=producto)
    serializer = BlockchainTransactionSerializer(qs, many=True)
    return Response({'success': True, 'producto_id': producto_id, 'historial': serializer.data})
