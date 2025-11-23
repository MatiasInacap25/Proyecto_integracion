import { useState, useEffect } from 'react'
import { ObtenerStocksMinimos, CrearStockMinimo, EditarStockMinimo, EliminarStockMinimo } from '@/api/adminapi'
import { productosData } from '@/api/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { AlertCircle, Plus, Pencil, Trash2, Package } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner'

interface StockMinimo {
    id: number
    producto_id: number
    producto_nombre: string
    cantidad_minima: number
    cantidad_por_lote: number
    unidad_medida: string
    unidad_medida_nombre: string
}

interface Producto {
    id: number
    nombre: string
    cantidad_por_lote: number
    unidad_medida_abreviatura?: string
    unidad_medida?: {
        nombre: string
        abreviatura: string
    }
}

export default function ReglasStock() {
    const [stocks, setStocks] = useState<StockMinimo[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para diálogo de crear
    const [openCreate, setOpenCreate] = useState(false)
    const [selectedProducto, setSelectedProducto] = useState<string>('')
    const [cantidadMinima, setCantidadMinima] = useState<string>('')

    // Estados para diálogo de editar
    const [openEdit, setOpenEdit] = useState(false)
    const [editingStock, setEditingStock] = useState<StockMinimo | null>(null)
    const [editCantidad, setEditCantidad] = useState<string>('')

    // Estado para diálogo de eliminar
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingStock, setDeletingStock] = useState<StockMinimo | null>(null)

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setLoading(true)
        setError(null)
        try {
            const [stocksRes, productosRes] = await Promise.all([
                ObtenerStocksMinimos(),
                productosData()
            ])

            if (stocksRes.data.success) {
                setStocks(stocksRes.data.stocks)
            }

            if (productosRes.data.success && productosRes.data.productos) {
                // Transform productos to include unidad_medida object
                const productosTransformados = productosRes.data.productos.map((p: any) => ({
                    ...p,
                    unidad_medida: {
                        abreviatura: p.unidad_medida_abreviatura || ''
                    }
                }))
                setProductos(productosTransformados)
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    const productosDisponibles = Array.isArray(productos)
        ? productos.filter(p => !stocks.some(s => s.producto_id === p.id))
        : []

    const handleCrear = async () => {
        if (!selectedProducto || !cantidadMinima) {
            toast.error('Por favor completa todos los campos')
            return
        }

        if (parseFloat(cantidadMinima) <= 0) {
            toast.error('La cantidad debe ser mayor a 0')
            return
        }

        try {
            const response = await CrearStockMinimo({
                producto_id: parseInt(selectedProducto),
                cantidad_minima: parseFloat(cantidadMinima)
            })

            if (response.data.success) {
                toast.success(response.data.message)
                setOpenCreate(false)
                setSelectedProducto('')
                setCantidadMinima('')
                cargarDatos()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al crear stock mínimo')
        }
    }

    const abrirDialogEditar = (stock: StockMinimo) => {
        setEditingStock(stock)
        setEditCantidad(stock.cantidad_minima.toString())
        setOpenEdit(true)
    }

    const handleEditar = async () => {
        if (!editingStock || !editCantidad) {
            toast.error('Por favor ingresa una cantidad válida')
            return
        }

        if (parseFloat(editCantidad) <= 0) {
            toast.error('La cantidad debe ser mayor a 0')
            return
        }

        try {
            const response = await EditarStockMinimo(editingStock.id, {
                cantidad_minima: parseFloat(editCantidad)
            })

            if (response.data.success) {
                toast.success(response.data.message)
                setOpenEdit(false)
                setEditingStock(null)
                setEditCantidad('')
                cargarDatos()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al editar stock mínimo')
        }
    }

    const abrirDialogEliminar = (stock: StockMinimo) => {
        setDeletingStock(stock)
        setOpenDelete(true)
    }

    const handleEliminar = async () => {
        if (!deletingStock) return

        try {
            const response = await EliminarStockMinimo(deletingStock.id)

            if (response.data.success) {
                toast.success(response.data.message)
                setOpenDelete(false)
                setDeletingStock(null)
                cargarDatos()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al eliminar stock mínimo')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Cargando datos...</div>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg shadow">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reglas de Stock Mínimo</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Gestiona los niveles mínimos de inventario por producto
                    </p>
                </div>
            </div>

            {/* Tabla */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Productos Configurados
                            </CardTitle>
                            <CardDescription>
                                {stocks.length} {stocks.length === 1 ? 'producto configurado' : 'productos configurados'}
                            </CardDescription>
                        </div>
                        <Button onClick={() => setOpenCreate(true)} className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Regla
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Vista móvil */}
                    <div className="block sm:hidden space-y-4">
                        {stocks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay reglas de stock configuradas
                            </div>
                        ) : (
                            stocks.map((stock) => (
                                <Card key={stock.id} className="p-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="font-semibold text-lg">{stock.producto_nombre}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {stock.cantidad_por_lote} {stock.unidad_medida} por lote
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-t">
                                            <span className="text-sm font-medium">Stock Mínimo:</span>
                                            <span className="text-lg font-bold">
                                                {stock.cantidad_minima} {stock.unidad_medida}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => abrirDialogEditar(stock)}
                                                className="flex-1"
                                            >
                                                <Pencil className="h-3 w-3 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => abrirDialogEliminar(stock)}
                                                className="flex-1"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Vista desktop */}
                    <div className="hidden sm:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Cantidad por Lote</TableHead>
                                    <TableHead className="text-right">Stock Mínimo</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No hay reglas de stock configuradas
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stocks.map((stock) => (
                                        <TableRow key={stock.id}>
                                            <TableCell className="font-medium">{stock.producto_nombre}</TableCell>
                                            <TableCell className="text-right">{stock.cantidad_por_lote} {stock.unidad_medida}</TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-semibold">
                                                    {stock.cantidad_minima} {stock.unidad_medida}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => abrirDialogEditar(stock)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => abrirDialogEliminar(stock)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog Crear */}
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar Regla de Stock Mínimo</DialogTitle>
                        <DialogDescription>
                            Configura el stock mínimo para un producto
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Producto</label>
                            <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productosDisponibles.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">
                                            Todos los productos tienen stock mínimo configurado
                                        </div>
                                    ) : (
                                        productosDisponibles.map((producto) => (
                                            <SelectItem key={producto.id} value={producto.id.toString()}>
                                                {producto.nombre} ({producto.cantidad_por_lote} {producto.unidad_medida?.abreviatura || ''}/lote)
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cantidad Mínima</label>
                            <Input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="Ej: 100"
                                value={cantidadMinima}
                                onChange={(e) => setCantidadMinima(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenCreate(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCrear}>
                            Crear Regla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Editar */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Stock Mínimo</DialogTitle>
                        <DialogDescription>
                            {editingStock?.producto_nombre}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cantidad Mínima</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={editCantidad}
                                    onChange={(e) => setEditCantidad(e.target.value)}
                                    className="flex-1"
                                />
                                <span className="text-sm font-medium text-muted-foreground">
                                    {editingStock?.unidad_medida}
                                </span>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                            <div className="font-medium mb-1">Información del producto:</div>
                            <div>Cantidad por lote: {editingStock?.cantidad_por_lote} {editingStock?.unidad_medida}</div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenEdit(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditar}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Eliminar */}
            <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar Regla de Stock Mínimo</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar la regla de stock mínimo para este producto?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-red-50 p-4 rounded-md border border-red-200">
                            <div className="font-semibold text-red-900 mb-1">
                                {deletingStock?.producto_nombre}
                            </div>
                            <div className="text-sm text-red-700">
                                Stock mínimo actual: {deletingStock?.cantidad_minima} {deletingStock?.unidad_medida}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                            Esta acción no se puede deshacer. El producto dejará de tener un stock mínimo configurado.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDelete(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleEliminar}>
                            Eliminar Regla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
