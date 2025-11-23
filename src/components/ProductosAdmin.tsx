import { useState, useEffect } from 'react'
import { ProductosAdminData, UnidadesMedidaData, CategoriasData } from '../api/api'
import { ActivarProducto, DesacativarProducto, EditarProducto } from '../api/adminapi'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Pencil, TriangleAlert } from "lucide-react"
import { Button } from "../components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog"
import { Label } from "../components/ui/label"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Input } from "../components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { toast } from "sonner"

interface Producto {
    id: number
    nombre: string
    precio_unitario: number
    cantidad_por_lote: number
    activo: boolean
    categoria: string
    categoria_id?: number
    unidad_medida: string
    unidad_medida_id?: number
}

export default function ProductosAdmin() {
    const [data, setData] = useState<Producto[]>([])
    const [filteredData, setFilteredData] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para filtros
    const [categoriaFilter, setCategoriaFilter] = useState<string>("todos")
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [categoriasUnicas, setCategoriasUnicas] = useState<string[]>([])

    // Estados para listas de selección
    const [unidadesMedida, setUnidadesMedida] = useState<Array<{ id: number, nombre: string }>>([])
    const [categorias, setCategorias] = useState<Array<{ id: number, nombre: string }>>([])

    // Estados para edición
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
    const [formData, setFormData] = useState({
        nombre: '',
        precio_unitario: 0,
        cantidad_por_lote: 0,
        categoria_id: 0,
        unidad_medida_id: 0
    })

    // Estados para AlertDialog de activar/desactivar
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
    const [productoAToggle, setProductoAToggle] = useState<Producto | null>(null)

    // Estados para tabla
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    // Cargar datos de productos
    useEffect(() => {
        cargarProductos()
        cargarUnidadesMedida()
        cargarCategorias()
    }, [])

    // Aplicar filtros cuando cambien
    useEffect(() => {
        aplicarFiltros()
    }, [data, categoriaFilter, estadoFilter])

    const cargarProductos = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await ProductosAdminData()
            const result = response.data

            if (result.success) {
                setData(result.productos)
                // Extraer categorías únicas
                const categorias = [...new Set(result.productos.map((p: Producto) => p.categoria))] as string[]
                setCategoriasUnicas(categorias)
            } else {
                setError("Error al cargar los productos")
                toast.error("Error al cargar los productos")
            }
        } catch (err) {
            setError("Error de conexión al cargar los productos")
            toast.error("Error de conexión al cargar los productos")
            console.error("Error al cargar productos:", err)
        } finally {
            setLoading(false)
        }
    }

    const cargarUnidadesMedida = async () => {
        try {
            const response = await UnidadesMedidaData()
            if (response.data.success) {
                setUnidadesMedida(response.data.unidades_medida)
            }
        } catch (err) {
            console.error("Error al cargar unidades de medida:", err)
        }
    }

    const cargarCategorias = async () => {
        try {
            const response = await CategoriasData()
            if (response.data.success) {
                setCategorias(response.data.categorias)
            }
        } catch (err) {
            console.error("Error al cargar categorías:", err)
        }
    }

    const aplicarFiltros = () => {
        let datosFiltrados = [...data]

        // Filtrar por categoría
        if (categoriaFilter !== "todos") {
            datosFiltrados = datosFiltrados.filter(producto => producto.categoria === categoriaFilter)
        }

        // Filtrar por estado
        if (estadoFilter !== "todos") {
            const estadoBool = estadoFilter === "activo"
            datosFiltrados = datosFiltrados.filter(producto => producto.activo === estadoBool)
        }

        setFilteredData(datosFiltrados)
    }

    const formatearMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(valor)
    }

    const limpiarFiltros = () => {
        setCategoriaFilter("todos")
        setEstadoFilter("todos")
        table.getColumn("nombre")?.setFilterValue("")
    }

    const abrirDialogToggle = (producto: Producto) => {
        setProductoAToggle(producto)
        setIsToggleDialogOpen(true)
    }

    const confirmarToggleEstado = async () => {
        if (!productoAToggle) return

        try {
            const response = productoAToggle.activo
                ? await DesacativarProducto(productoAToggle.id)
                : await ActivarProducto(productoAToggle.id)

            if (response.data.success) {
                toast.success(response.data.message || `Producto ${productoAToggle.activo ? 'desactivado' : 'activado'} correctamente`)
                cargarProductos()
            } else {
                toast.error(response.data.message || "Error al cambiar el estado del producto")
            }
        } catch (error: any) {
            console.error("Error al cambiar estado:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al cambiar el estado del producto"
            toast.error(errorMessage)
        } finally {
            setIsToggleDialogOpen(false)
            setProductoAToggle(null)
        }
    }

    const abrirDialogEditar = (producto: Producto) => {
        setProductoEditando(producto)

        // Buscar los IDs correspondientes basándose en los nombres
        const categoriaId = producto.categoria_id || categorias.find(c => c.nombre === producto.categoria)?.id || 0
        const unidadMedidaId = producto.unidad_medida_id || unidadesMedida.find(u => u.nombre === producto.unidad_medida)?.id || 0

        setFormData({
            nombre: producto.nombre,
            precio_unitario: producto.precio_unitario,
            cantidad_por_lote: producto.cantidad_por_lote,
            categoria_id: categoriaId,
            unidad_medida_id: unidadMedidaId
        })
        setIsEditDialogOpen(true)
    }

    const handleEditarProducto = async () => {
        if (!productoEditando) return

        try {
            const response = await EditarProducto(productoEditando.id, formData)
            if (response.data.success) {
                toast.success(response.data.message || "Producto actualizado correctamente")
                setIsEditDialogOpen(false)
                cargarProductos()
            } else {
                toast.error(response.data.message || "Error al actualizar el producto")
            }
        } catch (error: any) {
            console.error("Error al editar producto:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al actualizar el producto"
            toast.error(errorMessage)
        }
    }

    const columns: ColumnDef<Producto>[] = [
        {
            accessorKey: "nombre",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-left">{row.getValue("nombre")}</div>,
        },
        {
            accessorKey: "categoria",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Categoría
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-left">{row.getValue("categoria")}</div>,
        },
        {
            accessorKey: "precio_unitario",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Precio Unitario
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const valor = parseFloat(row.getValue("precio_unitario"))
                return <div className="text-left font-medium">{formatearMoneda(valor)}</div>
            },
        },
        {
            accessorKey: "cantidad_por_lote",
            header: "Cantidad por Lote",
            cell: ({ row }) => {
                const producto = row.original
                return <div className="text-left">{producto.cantidad_por_lote} {producto.unidad_medida}</div>
            },
        },
        {
            accessorKey: "unidad_medida",
            header: "Unidad",
            cell: ({ row }) => <div className="text-left">{row.getValue("unidad_medida")}</div>,
        },
        {
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => {
                const activo = row.getValue("activo") as boolean
                return (
                    <Badge className={activo
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }>
                        {activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: "Acciones",
            enableHiding: false,
            cell: ({ row }) => {
                const producto = row.original

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirDialogEditar(producto)}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={producto.activo ? "destructive" : "default"}
                            size="sm"
                            onClick={() => abrirDialogToggle(producto)}
                            className={!producto.activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                            {producto.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Cargando productos...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-600">{error}</div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
                <p className="text-gray-600 mt-2">Consulta y administra todos los productos del inventario</p>
            </div>

            {/* Filtros y controles */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                    {/* Filtro por categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                            <SelectTrigger className="h-10 max-w-40">
                                <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas las categorías</SelectItem>
                                {categoriasUnicas.map((categoria) => (
                                    <SelectItem key={categoria} value={categoria}>
                                        {categoria}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtro por estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                            <SelectTrigger className="h-10 max-w-40">
                                <SelectValue placeholder="Todos los estados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="activo">Activos</SelectItem>
                                <SelectItem value="inactivo">Inactivos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col items-stretch">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Acciones</label>
                        <div className="flex gap-0.5">
                            <Button variant="outline" onClick={limpiarFiltros} className="h-10 px-4 text-sm">
                                Limpiar
                            </Button>
                            <Button onClick={cargarProductos} disabled={loading} className="h-10 px-4 text-sm">
                                Actualizar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-full">
                    {/* Controles de tabla */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-4">
                            <Input
                                placeholder="Buscar por nombre..."
                                value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn("nombre")?.setFilterValue(event.target.value)
                                }
                                className="max-w-sm h-8 text-sm"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Columnas <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Tabla */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No se encontraron resultados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} de{" "}
                            {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog de Edición */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Producto</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del producto y guarda los cambios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nombre" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="categoria" className="text-right">
                                Categoría
                            </Label>
                            <Select
                                value={formData.categoria_id.toString()}
                                onValueChange={(value) => setFormData({ ...formData, categoria_id: Number(value) })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="precio" className="text-right">
                                Precio
                            </Label>
                            <Input
                                id="precio"
                                type="number"
                                value={formData.precio_unitario}
                                onChange={(e) => setFormData({ ...formData, precio_unitario: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cantidad" className="text-right">
                                Cant. por Lote
                            </Label>
                            <Input
                                id="cantidad"
                                type="number"
                                value={formData.cantidad_por_lote}
                                onChange={(e) => setFormData({ ...formData, cantidad_por_lote: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="unidad" className="text-right">
                                Unidad
                            </Label>
                            <Select
                                value={formData.unidad_medida_id.toString()}
                                onValueChange={(value) => {
                                    const unidadSeleccionada = unidadesMedida.find(u => u.id === Number(value))
                                    const nuevaCantidad = unidadSeleccionada && (unidadSeleccionada.nombre === "Litros" || unidadSeleccionada.nombre === "Kilogramos") ? 1 : formData.cantidad_por_lote
                                    setFormData({
                                        ...formData,
                                        unidad_medida_id: Number(value),
                                        cantidad_por_lote: nuevaCantidad
                                    })
                                }}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona una unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unidadesMedida.map((unidad) => (
                                        <SelectItem key={unidad.id} value={unidad.id.toString()}>
                                            {unidad.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditarProducto}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog de Activar/Desactivar */}
            <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <TriangleAlert className="h-5 w-5 text-yellow-600" />
                            {productoAToggle?.activo ? 'Desactivar Producto' : 'Activar Producto'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {productoAToggle?.activo ? (
                                <>
                                    ¿Estás seguro de que deseas desactivar el producto <strong>{productoAToggle?.nombre}</strong>?
                                    <br /><br />
                                    <span className="text-yellow-700">
                                        Una vez desactivado, este producto no se mostrará como opción al registrar un ingreso de productos.
                                    </span>
                                </>
                            ) : (
                                <>
                                    ¿Estás seguro de que deseas activar el producto <strong>{productoAToggle?.nombre}</strong>?
                                    <br /><br />
                                    <span className="text-green-700">
                                        Una vez activado, este producto estará disponible para registrar ingresos.
                                    </span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmarToggleEstado}
                            className={productoAToggle?.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {productoAToggle?.activo ? 'Desactivar' : 'Activar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
