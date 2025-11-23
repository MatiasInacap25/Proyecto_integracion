from django.urls import path
from . import views

urlpatterns = [
    # =============== AUTENTICACIÓN ===============
    path('auth/login/', views.login, name='login'),
    path('auth/register/', views.register, name='register'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/solicitar-recuperacion/', views.solicitar_recuperacion_password, name='solicitar_recuperacion_password'),
    path('auth/resetear-password/', views.resetear_password, name='resetear_password'),
    
    # =============== VISTAS DE BODEGUERO ===============
    path('bodeguero/ingreso-producto/', views.registrar_ingreso_producto, name='registrar_ingreso_producto'),
    path('bodeguero/salida-producto/', views.registrar_salida_producto, name='registrar_salida_producto'),
    path('bodeguero/consultar-stock/', views.consultar_stock_bodega, name='consultar_stock_bodega'),
    path('bodeguero/registro-merma/', views.registrar_merma, name='registrar_merma'),
    
    # =============== VISTAS DE JEFE DE BODEGA ===============
    path('jefe-bodega/aprobar-merma/<int:merma_id>/', views.aprobar_merma, name='aprobar_merma'),
    path('jefe-bodega/rechazar-merma/<int:merma_id>/', views.rechazar_merma, name='rechazar_merma'),
    path('jefe-bodega/mermas-pendientes/', views.listar_mermas_pendientes, name='listar_mermas_pendientes'),
    path('jefe-bodega/reporte-inventario/', views.generar_reporte_inventario, name='generar_reporte_inventario'),
    path('jefe-bodega/registrar-merma-aprobada/', views.registrar_merma_aprobada, name='registrar_merma_aprobada'),
    
    # =============== VISTAS DE ADMINISTRADOR ===============
    # Gestión de usuarios
    path('admin/usuarios/', views.listar_usuarios, name='listar_usuarios'),
    path('admin/usuarios/<int:usuario_id>/eliminar/', views.eliminar_usuario, name='eliminar_usuario'),
    path('admin/usuarios/registrar/', views.registrar_usuario, name='registrar_usuario'),
    path('admin/usuarios/<int:usuario_id>/desactivar/', views.desactivar_usuario, name='desactivar_usuario'),
    path('admin/usuarios/<int:usuario_id>/activar/', views.activar_usuario, name='activar_usuario'),
    
    # Gestión de productos
    path('admin/productos/crear/', views.crear_producto, name='crear_producto'),
    path('admin/productos/<int:producto_id>/eliminar/', views.eliminar_producto, name='eliminar_producto'),
    path('admin/productos/<int:producto_id>/desactivar/', views.desactivar_producto, name='desactivar_producto'),
    path('admin/productos/<int:producto_id>/activar/', views.activar_producto, name='activar_producto'),
    path('admin/productos/<int:producto_id>/editar/', views.editar_producto, name='editar_producto'),
    
    # Gestión de movimientos (Eliminación)
    path('admin/ingresos/<int:ingreso_id>/eliminar/', views.eliminar_ingreso, name='eliminar_ingreso'),
    path('admin/salidas/<int:salida_id>/eliminar/', views.eliminar_salida, name='eliminar_salida'),
    path('admin/mermas/<int:merma_id>/eliminar/', views.eliminar_merma, name='eliminar_merma'),
    
    # Gestión de proveedores
    path('admin/proveedores/', views.proveedores_admin_data, name='proveedores_admin_data'),
    path('admin/proveedores/registrar/', views.registrar_proveedor, name='registrar_proveedor'),
    path('admin/proveedores/<int:proveedor_id>/editar/', views.editar_proveedor, name='editar_proveedor'),
    path('admin/proveedores/<int:proveedor_id>/activar/', views.activar_proveedor, name='activar_proveedor'),
    path('admin/proveedores/<int:proveedor_id>/desactivar/', views.desactivar_proveedor, name='desactivar_proveedor'),
    
    # Gestión de clientes
    path('admin/clientes/', views.clientes_admin_data, name='clientes_admin_data'),
    path('admin/clientes/registrar/', views.registrar_cliente, name='registrar_cliente'),
    path('admin/clientes/<int:cliente_id>/editar/', views.editar_cliente, name='editar_cliente'),
    path('admin/clientes/<int:cliente_id>/activar/', views.activar_cliente, name='activar_cliente'),
    path('admin/clientes/<int:cliente_id>/desactivar/', views.desactivar_cliente, name='desactivar_cliente'),
    
    # Gestión de conductores
    path('admin/conductores/', views.conductores_admin_data, name='conductores_admin_data'),
    path('admin/conductores/registrar/', views.registrar_conductor, name='registrar_conductor'),
    path('admin/conductores/<int:conductor_id>/editar/', views.editar_conductor, name='editar_conductor'),
    path('admin/conductores/<int:conductor_id>/activar/', views.activar_conductor, name='activar_conductor'),
    path('admin/conductores/<int:conductor_id>/desactivar/', views.desactivar_conductor, name='desactivar_conductor'),
    
    # Comparación de mermas
    path('admin/mermas/comparacion-mensual/', views.comparacion_mermas_mensual, name='comparacion_mermas_mensual'),
    path('admin/mermas/comparacion-categorias/', views.comparacion_mermas_categorias, name='comparacion_mermas_categorias'),
    
    # Gestión de stock mínimo
    path('admin/stocks-minimos/', views.obtener_stocks_minimos, name='obtener_stocks_minimos'),
    path('admin/stocks-minimos/crear/', views.crear_stock_minimo, name='crear_stock_minimo'),
    path('admin/stocks-minimos/<int:stock_id>/editar/', views.editar_stock_minimo, name='editar_stock_minimo'),
    path('admin/stocks-minimos/<int:stock_id>/eliminar/', views.eliminar_stock_minimo, name='eliminar_stock_minimo'),
    
    # Envío de correos
    path('admin/enviar-correo/', views.correo, name='enviar_correo'),
    
    # Configuración de contraseñas
    path('establecer-password/', views.establecer_password, name='establecer_password'),
    
    # =============== VISTAS DE DATOS ===============
    path('data/proveedores/', views.obtener_proveedores, name='obtener_proveedores'),
    path('data/productos/', views.obtener_productos, name='obtener_productos'),
    path('data/clientes/', views.obtener_clientes, name='obtener_clientes'),
    path('data/lotes/', views.obtener_lotes, name='obtener_lotes'),
    path('data/categorias-merma/', views.obtener_categorias_merma, name='obtener_categorias_merma'),
    path('data/inventario/', views.inventario_data, name='inventario_data'),
    path('data/mermas/', views.mermas_data, name='mermas_data'),
    path('data/usuarios/', views.usuarios_data, name='usuarios_data'),
    path('data/conductores/', views.conductores_data, name='conductores_data'),
    path('data/ingresos/', views.ingresos_data, name='ingresos_data'),
    path('data/salidas/', views.salidas_data, name='salidas_data'),
    path('data/productos-admin/', views.productos_admin_data, name='productos_admin_data'),
    path('data/unidades-medida/', views.unidad_medida_data, name='unidad_medida_data'),
    path('data/categorias/', views.categoria_data, name='categoria_data'),
    # Blockchain admin endpoints (solo administradores)
    path('blockchain/historial/', views.historial_blockchain, name='historial_blockchain'),
    path('blockchain/historial/<int:producto_id>/', views.historial_producto, name='historial_producto'),
]