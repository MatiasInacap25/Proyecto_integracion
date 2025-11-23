from rest_framework import serializers
from .models import (
    Cargo, CustomUser, Proveedor, Cliente, Conductor,
    Region, Bodega, UnidadMedida, Categoria, Producto, 
    Lote, InventarioLote, IngresoProducto, DetalleIngreso,
    SalidaProducto, DetalleSalida, CategoriaMerma, 
    RegistroMerma, DetalleMerma
    , BlockchainTransaction
)

# ==============================
# Serializers para Datos Base
# ==============================

class CargoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    requiere_bodega = serializers.ReadOnlyField(source='requiere_bodega_especifica')
    
    class Meta:
        model = Cargo
        fields = ['id', 'nombre', 'tipo', 'tipo_display', 'requiere_bodega']

class CustomUserSerializer(serializers.ModelSerializer):
    cargo_nombre = serializers.CharField(source='cargo.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    bodegas_disponibles = serializers.SerializerMethodField()
    requiere_bodega_asignada = serializers.ReadOnlyField()
    tiene_acceso_todas_bodegas = serializers.SerializerMethodField()
    edad = serializers.ReadOnlyField()  # Campo calculado desde fecha_nacimiento
    
    def get_tiene_acceso_todas_bodegas(self, obj):
        """Indica si el usuario tiene acceso a todas las bodegas"""
        return obj.bodega is None
    
    def get_bodegas_disponibles(self, obj):
        """Obtiene las bodegas disponibles para el usuario"""
        bodegas = obj.bodegas_disponibles()
        return [{'id': b.id, 'nombre': b.nombre} for b in bodegas]
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rut', 'fecha_nacimiento', 'edad',
                'cargo', 'cargo_nombre', 'bodega', 'bodega_nombre', 
                'requiere_bodega_asignada', 'tiene_acceso_todas_bodegas', 'bodegas_disponibles',
                'is_password_set', 'date_joined', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = '__all__'

# ==============================
# Serializers para Ubicaciones
# ==============================

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = '__all__'

class BodegaSerializer(serializers.ModelSerializer):
    region_nombre = serializers.CharField(source='region.nombre', read_only=True)
    
    class Meta:
        model = Bodega
        fields = ['id', 'nombre', 'region', 'region_nombre', 'comuna', 'calle', 'numero']

# ==============================
# Serializers para Productos y Lotes
# ==============================

class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    unidad_medida_nombre = serializers.CharField(source='unidad_medida.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'unidad_medida', 'unidad_medida_nombre', 
                 'cantidad_por_lote', 'precio_unitario', 'categoria', 'categoria_nombre']

class LoteSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    
    class Meta:
        model = Lote
        fields = ['id', 'producto', 'producto_nombre', 'codigo_lote', 
                 'cantidad_inicial', 'fecha_vencimiento', 'precio_compra']

class InventarioLoteSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    producto_nombre = serializers.CharField(source='lote.producto.nombre', read_only=True)
    
    class Meta:
        model = InventarioLote
        fields = ['id', 'bodega', 'bodega_nombre', 'lote', 'lote_codigo', 
                 'producto_nombre', 'cantidad_actual']

# ==============================
# Serializers para Ingresos
# ==============================

class DetalleIngresoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    cantidad_total = serializers.ReadOnlyField()
    
    class Meta:
        model = DetalleIngreso
        fields = ['id', 'producto', 'producto_nombre', 'cantidad_lotes', 
                 'lote', 'lote_codigo', 'cantidad_total']

class IngresoProductoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    detalles = DetalleIngresoSerializer(many=True, read_only=True)
    
    class Meta:
        model = IngresoProducto
        fields = ['id', 'proveedor', 'proveedor_nombre', 'bodega', 'bodega_nombre',
                'fecha', 'usuario', 'usuario_nombre', 'descripcion', 'detalles']

# ==============================
# Serializers para Salidas
# ==============================

class DetalleSalidaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='lote.producto.nombre', read_only=True)
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    cantidad_total = serializers.ReadOnlyField()
    
    class Meta:
        model = DetalleSalida
        fields = ['id', 'producto_nombre', 'cantidad_lotes', 
                'lote', 'lote_codigo', 'cantidad_total']

class SalidaProductoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    detalles = DetalleSalidaSerializer(many=True, read_only=True)
    
    class Meta:
        model = SalidaProducto
        fields = ['id', 'cliente', 'cliente_nombre', 'bodega', 'bodega_nombre',
                 'fecha', 'usuario', 'usuario_nombre', 'descripcion', 'detalles']

# ==============================
# Serializers para Sistema de Mermas
# ==============================

class CategoriaMermaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaMerma
        fields = '__all__'

class DetalleMermaSerializer(serializers.ModelSerializer):
    lote_codigo = serializers.CharField(source='lote.codigo_lote', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    valor_merma = serializers.ReadOnlyField()
    porcentaje_merma = serializers.ReadOnlyField()
    
    class Meta:
        model = DetalleMerma
        fields = ['id', 'lote', 'lote_codigo', 'producto', 'producto_nombre',
                'cantidad_merma', 'cantidad_antes', 
                'valor_merma', 'porcentaje_merma']

class RegistroMermaSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    categoria_merma_nombre = serializers.CharField(source='categoria_merma.nombre', read_only=True)
    usuario_registro_nombre = serializers.CharField(source='usuario_registro.username', read_only=True)
    usuario_aprobacion_nombre = serializers.CharField(source='usuario_aprobacion.username', read_only=True)
    detalles_merma = DetalleMermaSerializer(many=True, read_only=True)
    total_productos = serializers.ReadOnlyField()
    valor_total_merma = serializers.ReadOnlyField()
    
    class Meta:
        model = RegistroMerma
        fields = ['id', 'bodega', 'bodega_nombre', 'fecha_registro', 
                'usuario_registro', 'usuario_registro_nombre', 'categoria_merma', 
                'categoria_merma_nombre', 'estado', 'fecha_aprobacion', 
                'usuario_aprobacion', 'usuario_aprobacion_nombre', 
                'observaciones_registro',
                'total_productos', 'valor_total_merma', 'detalles_merma']

# ==============================
# Serializers Simplificados (para dropdowns/selects)
# ==============================

class ProductoSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas desplegables"""
    class Meta:
        model = Producto
        fields = ['id', 'nombre']

class BodegaSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas desplegables"""
    class Meta:
        model = Bodega
        fields = ['id', 'nombre']

class LoteSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas desplegables"""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    
    class Meta:
        model = Lote
        fields = ['id', 'codigo_lote', 'producto_nombre']


class BlockchainTransactionSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = BlockchainTransaction
        fields = ['id', 'producto', 'producto_nombre', 'usuario', 'usuario_nombre', 'tipo_movimiento', 'cantidad', 'timestamp', 'tx_id_blockchain', 'detalle']

