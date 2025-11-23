from django.db import models
from django.contrib.auth.models import AbstractUser

# ==============================
# Datos base
# ==============================

class Cargo(models.Model):
    TIPOS_CARGO = [
        ('bodeguero', 'Bodeguero'),
        ('jefe_bodega', 'Jefe de Bodega'),
        ('auditor', 'Auditor'),
        ('administrador', 'Administrador'),
        ('supervisor', 'Supervisor'),
    ]
    
    nombre = models.CharField(max_length=50)
    tipo = models.CharField(max_length=20, choices=TIPOS_CARGO, null=True, blank=True,
                            help_text="Tipo de cargo que determina permisos automáticos")

    def __str__(self):
        return self.nombre
    
    def requiere_bodega_especifica(self):
        """Determina si este cargo requiere una bodega específica"""
        return self.tipo in ['bodeguero', 'jefe_bodega']

class CustomUser(AbstractUser):
    cargo = models.ForeignKey(Cargo, on_delete=models.SET_NULL, null=True, blank=True)
    bodega = models.ForeignKey('Bodega', on_delete=models.SET_NULL, null=True, blank=True, 
                                help_text="Bodega asignada (requerida para bodegueros y jefes de bodega)")
    rut = models.CharField(max_length=10, unique=True, null=True, blank=True,
                            help_text="RUT del usuario (formato: 12345678-9)")
    fecha_nacimiento = models.DateField(null=True, blank=True,
                                        help_text="Fecha de nacimiento del usuario")
    is_password_set = models.BooleanField(default=False)
    reset_password_token = models.CharField(max_length=100, null=True, blank=True,
                                           help_text="Token para recuperación de contraseña")
    reset_password_expires = models.DateTimeField(null=True, blank=True,
                                                  help_text="Fecha de expiración del token")

    def __str__(self):
        return self.username
    
    @property
    def edad(self):
        """Calcula la edad automáticamente desde la fecha de nacimiento"""
        if self.fecha_nacimiento:
            from datetime import date
            today = date.today()
            return today.year - self.fecha_nacimiento.year - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        return None
    
    def tiene_acceso_bodega(self, bodega):
        """Verifica si el usuario tiene acceso a una bodega específica"""
        # Si no tiene bodega asignada = acceso a todas las bodegas
        if self.bodega is None:
            return True
        # Si tiene bodega asignada = solo acceso a esa bodega
        return self.bodega == bodega
    
    def bodegas_disponibles(self):
        """Retorna las bodegas a las que tiene acceso el usuario"""
        from .models import Bodega  # Import local para evitar circular
        if self.bodega is None:
            # Sin bodega asignada = acceso a todas
            return Bodega.objects.all()
        else:
            # Con bodega asignada = solo esa bodega
            return Bodega.objects.filter(id=self.bodega.id)
    
    def requiere_bodega_asignada(self):
        """Determina si este usuario requiere tener una bodega asignada"""
        return self.cargo and self.cargo.requiere_bodega_especifica()

class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    rut = models.CharField(max_length=10, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    es_persona_juridica = models.BooleanField(default=True, help_text="True para persona jurídica, False para persona natural")
    activo = models.BooleanField(default=True, help_text="True si el proveedor está activo, False si está inactivo")

    def __str__(self):
        return self.nombre


class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    rut = models.CharField(max_length=10, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    es_persona_juridica = models.BooleanField(default=True, help_text="True para persona jurídica, False para persona natural")
    activo = models.BooleanField(default=True, help_text="True si el cliente está activo, False si está inactivo")

    def __str__(self):
        return self.nombre

class Conductor(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    rut = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField(null=True, blank=True, help_text="Fecha de nacimiento del conductor")
    activo = models.BooleanField(default=True, help_text="True si el conductor está activo, False si está inactivo")

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

# ==============================
# UBICACIONES
# ==============================

class Region(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

class Bodega(models.Model):
    nombre = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)
    comuna = models.CharField(max_length=100)
    calle = models.CharField(max_length=255)
    numero = models.CharField(max_length=10)

    def __str__(self):
        return self.nombre

# ==============================
# Productos y Lotes
# ==============================

class UnidadMedida(models.Model):
    """Unidades de medida para productos"""
    nombre = models.CharField(max_length=50)  # Ej: "Kilogramo", "Unidad", "Litro"
    abreviatura = models.CharField(max_length=10)  # Ej: "KG", "UN", "LT"
    
    def __str__(self):
        return f"{self.nombre} ({self.abreviatura})"

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    unidad_medida = models.ForeignKey(UnidadMedida, on_delete=models.CASCADE)
    cantidad_por_lote = models.IntegerField(default=1)  # Cambiar a IntegerField
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    activo = models.BooleanField(default=True, help_text="True si el producto está activo, False si está inactivo")

    def __str__(self):
        return self.nombre

class StockMinimo(models.Model):
    """Define el stock mínimo requerido para cada producto"""
    producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='stock_minimo')
    cantidad_minima = models.DecimalField(max_digits=10, decimal_places=3, help_text="Cantidad mínima de stock requerida")
    
    def __str__(self):
        return f"Stock mínimo de {self.producto.nombre}: {self.cantidad_minima} {self.producto.unidad_medida.abreviatura}"
    
    class Meta:
        verbose_name = "Stock Mínimo"
        verbose_name_plural = "Stocks Mínimos"

class Lote(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    codigo_lote = models.CharField(max_length=100)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)  
    fecha_vencimiento = models.DateField(null=True, blank=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True, help_text="True si el lote está activo, False si está inactivo")
    fecha_inactivacion = models.DateTimeField(null=True, blank=True, help_text="Fecha cuando el lote se volvió inactivo")

    def __str__(self):
        return f"Lote {self.codigo_lote} de {self.producto.nombre}"
    
    def inactivar(self):
        """Marca el lote como inactivo y registra la fecha"""
        from django.utils import timezone
        self.activo = False
        self.fecha_inactivacion = timezone.now()
        self.save()
    
    def reactivar(self):
        """Reactiva el lote si vuelve a tener stock"""
        self.activo = True
        self.fecha_inactivacion = None
        self.save()

class InventarioLote(models.Model):
    bodega = models.ForeignKey(Bodega, on_delete=models.CASCADE)
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['bodega', 'lote']  # Un lote solo puede estar una vez por bodega

    def __str__(self):
        return f"{self.lote.cantidad} de {self.lote.producto.nombre} en {self.bodega.nombre}"


# ----------------------------
# Ingresos (desde proveedores)
# ----------------------------


class IngresoProducto(models.Model):
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE)
    bodega = models.ForeignKey(Bodega, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Ingreso {self.id} - {self.proveedor.nombre} ({self.fecha.date()})"


class DetalleIngreso(models.Model):
    ingreso = models.ForeignKey(IngresoProducto, on_delete=models.CASCADE, related_name="detalles")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad_lotes = models.PositiveIntegerField()
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)

    @property
    def cantidad_total(self):
        return self.cantidad_lotes * self.producto.cantidad_por_lote

    def __str__(self):
        return f"{self.producto.nombre} - {self.cantidad_total} {self.producto.unidad_medida.abreviatura}"
    
# ----------------------------
# Salidas (hacia clientes)
# ----------------------------

class SalidaProducto(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    bodega = models.ForeignKey(Bodega, on_delete=models.CASCADE)
    conductor = models.ForeignKey(Conductor, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Salida {self.id} - {self.cliente.nombre} ({self.fecha.date()})"

class DetalleSalida(models.Model):
    salida = models.ForeignKey(SalidaProducto, on_delete=models.CASCADE, related_name="detalles")
    cantidad_lotes = models.PositiveIntegerField()
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)

    @property
    def cantidad_total(self):
        return self.cantidad_lotes * self.lote.producto.cantidad_por_lote

    def __str__(self):
        return f"{self.lote.producto.nombre} - {self.cantidad_total} {self.lote.producto.unidad_medida.abreviatura}"
# ----------------------------
# Sistema de Mermas
# ----------------------------

class CategoriaMerma(models.Model):
    """Categorías de mermas para clasificar los tipos de pérdidas"""
    nombre = models.CharField(max_length=100)  # Ej: "Vencimiento", "Rotura", "Robo", "Error de conteo"

    def __str__(self):
        return self.nombre

class RegistroMerma(models.Model):
    """Registro principal de mermas"""
    ESTADOS = [
        ('pendiente', 'Pendiente de Aprobación'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]
    
    # Información básica
    bodega = models.ForeignKey(Bodega, on_delete=models.CASCADE)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    usuario_registro = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='mermas_registradas')
    categoria_merma = models.ForeignKey(CategoriaMerma, on_delete=models.CASCADE)
    # Estado y aprobación
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    usuario_aprobacion = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='mermas_aprobadas')
    
    # Observaciones
    observaciones_registro = models.TextField(help_text="Observaciones del bodeguero")
    
    # Valor monetario de la merma
    valor_total_merma = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Valor total monetario de la merma")
    
    # Totales calculados
    @property
    def total_productos(self):
        return self.detalles_merma.count()
    
    def calcular_valor_total(self):
        """Calcula y actualiza el valor total de la merma"""
        total = sum(detalle.valor_merma for detalle in self.detalles_merma.all())
        self.valor_total_merma = total
        return total

    def __str__(self):
        return f"Merma {self.id} - {self.bodega.nombre} ({self.estado})"

    class Meta:
        ordering = ['-fecha_registro']

class DetalleMerma(models.Model):
    """Detalle de cada producto con merma"""
    registro_merma = models.ForeignKey(RegistroMerma, on_delete=models.CASCADE, related_name="detalles_merma")
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)  # Redundante pero útil para consultas
    
    # Cantidades
    cantidad_merma = models.DecimalField(max_digits=10, decimal_places=3, help_text="Cantidad perdida")
    cantidad_antes = models.DecimalField(max_digits=10, decimal_places=3, help_text="Stock antes de la merma")
    
    # Valor monetario
    valor_merma = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Valor monetario de la merma calculado")
    
    def calcular_valor_merma(self):
        """Calcula el valor monetario: precio_unitario * cantidad_por_lote * cantidad_merma"""
        valor = self.producto.precio_unitario * self.producto.cantidad_por_lote * self.cantidad_merma
        self.valor_merma = valor
        return valor
    
    @property
    def porcentaje_merma(self):
        """Porcentaje de merma respecto al stock anterior"""
        if self.cantidad_antes > 0:
            return (self.cantidad_merma / self.cantidad_antes) * 100
        return 0

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validar que el lote pertenezca al producto
        if self.lote and self.producto and self.lote.producto != self.producto:
            raise ValidationError('El lote no pertenece al producto seleccionado')
        
        # Validar que la cantidad de merma no sea mayor al stock
        if self.cantidad_merma > self.cantidad_antes:
            raise ValidationError('La cantidad de merma no puede ser mayor al stock disponible')

    def save(self, *args, **kwargs):
        # Auto-completar el producto desde el lote
        if self.lote and not self.producto:
            self.producto = self.lote.producto
        
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.producto.nombre} - {self.cantidad_merma} {self.producto.unidad_medida.abreviatura} ({self.registro_merma.categoria_merma.nombre})"


# ----------------------------
# Registro de transacciones en Blockchain (réplica local)
# ----------------------------
class BlockchainTransaction(models.Model):
    """Modelo que refleja en la base de datos local las transacciones registradas en la blockchain.

    Nota: la blockchain es la fuente de inmutabilidad; este modelo es una copia de consulta.
    """
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True, blank=True)
    usuario = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    tipo_movimiento = models.CharField(max_length=50)
    cantidad = models.DecimalField(max_digits=20, decimal_places=6)
    timestamp = models.DateTimeField(auto_now_add=True)
    tx_id_blockchain = models.CharField(max_length=200, unique=True)
    detalle = models.JSONField(null=True, blank=True, help_text='Payload original enviado a la blockchain')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        prod = self.producto.nombre if self.producto else 'Sin producto'
        return f"TX {self.tx_id_blockchain} - {prod} - {self.tipo_movimiento}"

