# Importar todas las vistas para facilitar el acceso

# Importar vistas de autenticación desde auth.py
from .auth import login, register, logout_view, solicitar_recuperacion_password, resetear_password

from .bodeguero_views import (
    registrar_ingreso_producto, registrar_salida_producto,
    consultar_stock_bodega, registrar_merma
)
from .jefe_bodega_views import (
    aprobar_merma, rechazar_merma, listar_mermas_pendientes,
    generar_reporte_inventario, registrar_merma_aprobada
)
from .administrador_views import (
    listar_usuarios, eliminar_usuario,
    correo, crear_producto, eliminar_producto, registrar_usuario, desactivar_usuario, activar_usuario, establecer_password,
    activar_producto, desactivar_producto, eliminar_ingreso, eliminar_salida, eliminar_merma, editar_producto,
    proveedores_admin_data, registrar_proveedor, clientes_admin_data, registrar_cliente, conductores_admin_data, registrar_conductor,
    activar_proveedor, desactivar_proveedor, activar_cliente, desactivar_cliente, activar_conductor, desactivar_conductor,
    editar_proveedor, editar_cliente, editar_conductor, comparacion_mermas_mensual, comparacion_mermas_categorias,
    obtener_stocks_minimos, crear_stock_minimo, editar_stock_minimo, eliminar_stock_minimo
)
from .data_views import (
    obtener_proveedores, obtener_productos, obtener_clientes, obtener_lotes, obtener_categorias_merma, inventario_data, mermas_data, usuarios_data, conductores_data, ingresos_data, salidas_data, productos_admin_data, unidad_medida_data, categoria_data
)
from .blockchain_views import historial_blockchain, historial_producto

__all__ = [
    # Auth views
    'login', 'register', 'logout_view', 'protected_test', 'get_user_by_token',
    'solicitar_recuperacion_password', 'resetear_password',
    
    # Bodeguero views
    'registrar_ingreso_producto', 'registrar_salida_producto',
    'consultar_stock_bodega', 'registrar_merma',
    
    # Jefe de bodega views
    'aprobar_merma', 'rechazar_merma', 'listar_mermas_pendientes',
    'generar_reporte_inventario', 'asignar_usuario_bodega', 
    'gestionar_productos_bodega', 'registrar_merma_aprobada',
    
    # Administrador views
    'listar_usuarios', 'crear_usuario', 'actualizar_usuario', 'eliminar_usuario',
    'listar_bodegas', 'crear_bodega', 'actualizar_bodega',
    'dashboard_general', 'reporte_movimientos', 'listar_cargos', 'correo', 'crear_producto', 'eliminar_producto',
    'activar_producto', 'desactivar_producto', 'eliminar_ingreso', 'eliminar_salida', 'eliminar_merma',
    
    # Data views
    'obtener_proveedores', 'obtener_productos', 'obtener_clientes', 'obtener_lotes', 'obtener_categorias_merma',
    'inventario_data', 'mermas_data', 'usuarios_data', 'conductores_data', 'ingresos_data', 'salidas_data', 'productos_admin_data',
    'unidad_medida_data', 'categoria_data'
]

# Blockchain admin views
__all__.extend(['historial_blockchain', 'historial_producto'])