import { useState, useEffect } from 'react'
import { IngresosData } from '../api/api'
import { EliminarIngreso } from '../api/adminapi'
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
import { ArrowUpDown, ChevronDown, FileText, Printer, Trash2, TriangleAlert } from "lucide-react"
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
    AlertDialogTrigger,
} from "../components/ui/alert-dialog"
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
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { toast } from "sonner"
import jsPDF from 'jspdf'

interface Producto {
    producto_nombre: string
    unidad_medida: string
    cantidad_por_lote: number
    cantidad_lotes: number
    cantidad_total: number
    codigo_lote: string
    precio_compra: number
    valor_detalle: number
}

interface Ingreso {
    id: number
    fecha_ingreso: string
    hora_ingreso: string
    proveedor: string
    usuario_registro: string
    descripcion: string
    valor_total_ingreso: number
    productos: Producto[]
}

export default function Ingresos() {
    const [data, setData] = useState<Ingreso[]>([])
    const [filteredData, setFilteredData] = useState<Ingreso[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para filtros
    const [fechaDesde, setFechaDesde] = useState<string>("")
    const [fechaHasta, setFechaHasta] = useState<string>("")

    // Estado para controlar filas expandidas
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

    // Estados para tabla
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    // Cargar datos de ingresos
    useEffect(() => {
        cargarIngresos()
    }, [])

    // Aplicar filtros cuando cambien
    useEffect(() => {
        aplicarFiltros()
    }, [data, fechaDesde, fechaHasta])

    const cargarIngresos = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await IngresosData()
            const result = response.data

            if (result.success) {
                setData(result.ingresos)
            } else {
                setError("Error al cargar los ingresos")
                toast.error("Error al cargar los ingresos")
            }
        } catch (err) {
            setError("Error de conexión al cargar los ingresos")
            toast.error("Error de conexión al cargar los ingresos")
            console.error("Error al cargar ingresos:", err)
        } finally {
            setLoading(false)
        }
    }

    const aplicarFiltros = () => {
        let datosFiltrados = [...data]

        // Filtrar por rango de fechas
        if (fechaDesde) {
            datosFiltrados = datosFiltrados.filter(ingreso => {
                const fechaIngreso = new Date(ingreso.fecha_ingreso.split('/').reverse().join('-'))
                const desde = new Date(fechaDesde)
                return fechaIngreso >= desde
            })
        }

        if (fechaHasta) {
            datosFiltrados = datosFiltrados.filter(ingreso => {
                const fechaIngreso = new Date(ingreso.fecha_ingreso.split('/').reverse().join('-'))
                const hasta = new Date(fechaHasta)
                return fechaIngreso <= hasta
            })
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
        setFechaDesde("")
        setFechaHasta("")
        table.getColumn("descripcion")?.setFilterValue("")
        table.getColumn("proveedor")?.setFilterValue("")
        table.getColumn("usuario_registro")?.setFilterValue("")
    }

    const toggleRowExpansion = (rowIndex: number) => {
        const newExpandedRows = new Set(expandedRows)
        if (newExpandedRows.has(rowIndex)) {
            newExpandedRows.delete(rowIndex)
        } else {
            newExpandedRows.add(rowIndex)
        }
        setExpandedRows(newExpandedRows)
    }

    const generarPDFTodosLosIngresos = () => {
        try {
            toast.info("Generando PDF de todos los ingresos...")

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            })

            // Configuración del documento
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(16)
            pdf.text('Reporte de Ingresos', 20, 20)

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(10)
            pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CL')}`, 20, 30)
            pdf.text(`Total de ingresos: ${filteredData.length}`, 20, 36)

            // Calcular valor total
            const valorTotal = filteredData.reduce((sum, ingreso) => sum + ingreso.valor_total_ingreso, 0)
            pdf.text(`Valor total: ${formatearMoneda(valorTotal)}`, 20, 42)

            // Configuración de la tabla
            const headers = [
                'Fecha',
                'Hora',
                'Proveedor',
                'Usuario',
                'Descripción',
                'Valor Total'
            ]

            // Crear tabla manualmente
            let yPos = 55
            const colWidths = [30, 20, 40, 40, 60, 35]
            let xPos = 20

            // Encabezados
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(9)
            headers.forEach((header, i) => {
                pdf.rect(xPos, yPos, colWidths[i], 8)
                pdf.text(header, xPos + 2, yPos + 6)
                xPos += colWidths[i]
            })
            yPos += 8

            // Datos
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8)
            filteredData.forEach((ingreso) => {
                if (yPos > 180) { // Nueva página si es necesario
                    pdf.addPage()
                    yPos = 20
                }

                xPos = 20
                const rowData = [
                    ingreso.fecha_ingreso,
                    ingreso.hora_ingreso,
                    ingreso.proveedor,
                    ingreso.usuario_registro,
                    ingreso.descripcion.substring(0, 25) + (ingreso.descripcion.length > 25 ? '...' : ''),
                    formatearMoneda(ingreso.valor_total_ingreso)
                ]

                rowData.forEach((data, i) => {
                    pdf.rect(xPos, yPos, colWidths[i], 6)
                    pdf.text(data.toString(), xPos + 2, yPos + 4)
                    xPos += colWidths[i]
                })
                yPos += 6
            })

            pdf.save(`ingresos_${new Date().toISOString().slice(0, 10)}.pdf`)
            toast.success("PDF generado correctamente")
        } catch (error) {
            console.error('Error al generar PDF:', error)
            toast.error("Error al generar el PDF")
        }
    }

    const generarPDFIngresoIndividual = (ingreso: Ingreso) => {
        try {
            toast.info(`Generando PDF del ingreso del ${ingreso.fecha_ingreso}...`)

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            // Encabezado
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(18)
            pdf.text('Detalle de Ingreso', 20, 25)

            // Información general
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(12)
            let yPos = 40

            pdf.text(`Fecha: ${ingreso.fecha_ingreso}`, 20, yPos)
            pdf.text(`Hora: ${ingreso.hora_ingreso}`, 100, yPos)
            yPos += 8

            pdf.text(`Proveedor: ${ingreso.proveedor}`, 20, yPos)
            yPos += 8

            pdf.text(`Usuario: ${ingreso.usuario_registro}`, 20, yPos)
            yPos += 8

            pdf.text(`Descripción: ${ingreso.descripcion}`, 20, yPos)
            yPos += 8

            pdf.setFont('helvetica', 'bold')
            pdf.text(`Valor Total: ${formatearMoneda(ingreso.valor_total_ingreso)}`, 20, yPos)
            yPos += 15

            // Tabla de productos
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(14)
            pdf.text('Productos', 20, yPos)
            yPos += 10

            const headers = [
                'Producto',
                'U.M.',
                'Cant. Lotes',
                'Cant. Total',
                'Código Lote',
                'Precio Compra',
                'Valor Total'
            ]

            // Crear tabla de productos manualmente
            const colWidths = [45, 15, 20, 20, 25, 25, 25]
            let xPos = 20

            // Encabezados
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(9)
            headers.forEach((header, i) => {
                pdf.rect(xPos, yPos, colWidths[i], 8)
                pdf.text(header, xPos + 2, yPos + 6)
                xPos += colWidths[i]
            })
            yPos += 8

            // Datos de productos
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8)
            ingreso.productos.forEach((producto) => {
                if (yPos > 260) { // Nueva página si es necesario
                    pdf.addPage()
                    yPos = 20
                }

                xPos = 20
                const rowData = [
                    producto.producto_nombre.substring(0, 15) + (producto.producto_nombre.length > 15 ? '...' : ''),
                    producto.unidad_medida,
                    producto.cantidad_lotes.toString(),
                    producto.cantidad_total.toString(),
                    producto.codigo_lote,
                    formatearMoneda(producto.precio_compra),
                    formatearMoneda(producto.valor_detalle)
                ]

                rowData.forEach((data, i) => {
                    pdf.rect(xPos, yPos, colWidths[i], 6)
                    if (i >= 5) { // Alinear precios a la derecha
                        pdf.text(data.toString(), xPos + colWidths[i] - 2, yPos + 4, { align: 'right' })
                    } else if (i >= 1 && i <= 4) { // Centrar unidades y cantidades
                        pdf.text(data.toString(), xPos + colWidths[i] / 2, yPos + 4, { align: 'center' })
                    } else {
                        pdf.text(data.toString(), xPos + 2, yPos + 4)
                    }
                    xPos += colWidths[i]
                })
                yPos += 6
            })

            pdf.save(`ingreso_${ingreso.fecha_ingreso.replace(/\//g, '-')}_${ingreso.hora_ingreso.replace(':', '')}.pdf`)
            toast.success("PDF del ingreso generado correctamente")
        } catch (error) {
            console.error('Error al generar PDF:', error)
            toast.error("Error al generar el PDF")
        }
    }

    const handleEliminarIngreso = async (id: number) => {
        try {
            const response = await EliminarIngreso(id)
            if (response.data.success) {
                toast.success(response.data.message || "Ingreso eliminado correctamente")
                cargarIngresos()
            } else {
                toast.error(response.data.message || "Error al eliminar el ingreso")
            }
        } catch (error: any) {
            console.error("Error al eliminar ingreso:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al eliminar el ingreso"
            toast.error(errorMessage)
        }
    }

    const columns: ColumnDef<Ingreso>[] = [
        {
            accessorKey: "fecha_ingreso",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-left">{row.getValue("fecha_ingreso")}</div>,
        },
        {
            accessorKey: "hora_ingreso",
            header: "Hora",
            cell: ({ row }) => <div className="text-left">{row.getValue("hora_ingreso")}</div>,
        },
        {
            accessorKey: "proveedor",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Proveedor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-left">{row.getValue("proveedor")}</div>,
        },
        {
            accessorKey: "usuario_registro",
            header: "Usuario",
            cell: ({ row }) => <div className="text-left">{row.getValue("usuario_registro")}</div>,
        },
        {
            accessorKey: "descripcion",
            header: "Descripción",
            cell: ({ row }) => <div className="text-left max-w-xs truncate">{row.getValue("descripcion")}</div>,
        },
        {
            accessorKey: "valor_total_ingreso",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Valor Total
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const valor = parseFloat(row.getValue("valor_total_ingreso"))
                return <div className="text-left font-medium">{formatearMoneda(valor)}</div>
            },
        },
        {
            id: "actions",
            header: "Acciones",
            enableHiding: false,
            size: 120,
            cell: ({ row }) => {
                const ingreso = row.original
                const isExpanded = expandedRows.has(row.index)

                return (
                    <div className="flex gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                generarPDFIngresoIndividual(ingreso)
                            }}
                            title="Generar PDF"
                        >
                            <Printer className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-l-0"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <TriangleAlert className="h-5 w-5 text-red-600" />
                                        ¿Eliminar este ingreso?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará permanentemente este ingreso del sistema.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => handleEliminarIngreso(ingreso.id)}
                                    >
                                        Eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleRowExpansion(row.index)
                            }}
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                <div className="text-lg">Cargando ingresos...</div>
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
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Ingresos</h1>
                <p className="text-gray-600 mt-2">Consulta y administra todos los ingresos de productos registrados</p>
            </div>

            {/* Filtros y controles */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                    {/* Filtros de fecha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full max-w-40 h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                                colorScheme: 'light'
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full max-w-40 h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                                colorScheme: 'light'
                            }}
                        />
                    </div>

                    {/* Filtro por proveedor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                        <Input
                            placeholder="Buscar por proveedor"
                            value={(table.getColumn("proveedor")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("proveedor")?.setFilterValue(event.target.value)
                            }
                            className="h-10 max-w-40"
                        />
                    </div>

                    {/* Filtro por usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                        <Input
                            placeholder="Buscar por usuario"
                            value={(table.getColumn("usuario_registro")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("usuario_registro")?.setFilterValue(event.target.value)
                            }
                            className="h-10 max-w-40"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col items-stretch">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Acciones</label>
                        <div className="flex gap-0.5">
                            <Button variant="outline" onClick={limpiarFiltros} className="h-10 px-4 text-sm">
                                Limpiar
                            </Button>
                            <Button onClick={cargarIngresos} disabled={loading} className="h-10 px-4 text-sm">
                                Actualizar
                            </Button>
                        </div>
                    </div>

                    {/* Botón Exportar */}
                    <div className="flex flex-col items-stretch">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exportar</label>
                        <Button onClick={generarPDFTodosLosIngresos} variant="outline" className="h-10 px-4 text-sm max-w-[140px]">
                            <FileText className="mr-1 h-4 w-4" />
                            Exportar
                        </Button>
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
                                placeholder="Buscar por descripción..."
                                value={(table.getColumn("descripcion")?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn("descripcion")?.setFilterValue(event.target.value)
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
                                    table.getRowModel().rows.map((row) => {
                                        const isExpanded = expandedRows.has(row.index)
                                        return (
                                            <>
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => toggleRowExpansion(row.index)}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell
                                                            key={cell.id}
                                                            onClick={(e) => {
                                                                // Evitar propagación si se hace click en el menú de acciones
                                                                if (cell.column.id === 'actions') {
                                                                    e.stopPropagation()
                                                                }
                                                            }}
                                                        >
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={columns.length} className="bg-gray-50">
                                                            <Card className="m-2">
                                                                <CardHeader>
                                                                    <CardTitle className="text-lg">
                                                                        Productos del Ingreso
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="grid gap-4">
                                                                        {row.original.productos.map((producto, index) => (
                                                                            <div key={index} className="border rounded-lg p-4 bg-white">
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                                    <div>
                                                                                        <span className="font-semibold">Producto:</span>
                                                                                        <p>{producto.producto_nombre} ({producto.cantidad_por_lote} {producto.unidad_medida})</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="font-semibold">Cantidad Lotes:</span>
                                                                                        <p>{producto.cantidad_lotes} {producto.unidad_medida}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="font-semibold">Cantidad Total:</span>
                                                                                        <p>{producto.cantidad_total} {producto.unidad_medida}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="font-semibold">Código Lote:</span>
                                                                                        <p>{producto.codigo_lote}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="font-semibold">Precio Compra:</span>
                                                                                        <p className="font-medium text-green-600">
                                                                                            {formatearMoneda(producto.precio_compra)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="font-semibold">Valor Total:</span>
                                                                                        <p className="font-medium text-blue-600">
                                                                                            {formatearMoneda(producto.valor_detalle)}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        )
                                    })
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
        </div>
    )
}
