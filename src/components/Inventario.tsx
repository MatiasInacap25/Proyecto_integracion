import { useState, useEffect } from "react"
import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Package, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { inventarioData } from "../api/api"
import { toast } from "sonner"
import jsPDF from 'jspdf'

// Interfaces para los datos del inventario
interface InventarioItem {
    codigo_lote: string;
    cantidad: number;
    producto_nombre: string;
    unidad_medida: string;
}

interface InventarioResponse {
    success: boolean;
    inventario: InventarioItem[];
}

// Definición de las columnas de la tabla
export const columns: ColumnDef<InventarioItem>[] = [
    {
        accessorKey: "codigo_lote",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Código de Lote
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("codigo_lote")}</div>
        ),
    },
    {
        accessorKey: "producto_nombre",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Producto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("producto_nombre")}</div>
        ),
    },
    {
        accessorKey: "cantidad",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="justify-end w-full"
                >
                    Cantidad
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const cantidad = row.getValue("cantidad") as number
            const unidad = row.getValue("unidad_medida") as string

            return (
                <div className="text-right font-medium">
                    {cantidad.toLocaleString()} {unidad}
                </div>
            )
        },
    },
    {
        accessorKey: "unidad_medida",
        header: "Unidad de Medida",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("unidad_medida")}</div>
        ),
    },
]

export default function Inventario() {
    const [data, setData] = useState<InventarioItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    // Cargar datos del inventario
    useEffect(() => {
        cargarInventario()
    }, [])

    const cargarInventario = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await inventarioData()
            const result: InventarioResponse = response.data

            if (result.success) {
                setData(result.inventario)
            } else {
                setError("Error al cargar el inventario")
                toast.error("Error al cargar el inventario")
            }
        } catch (err) {
            setError("Error de conexión al cargar el inventario")
            toast.error("Error de conexión al cargar el inventario")
            console.error("Error al cargar inventario:", err)
        } finally {
            setLoading(false)
        }
    }

    const generarPDFInventario = async () => {
        try {
            toast.info("Generando PDF del inventario...")

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pageWidth = 210
            const pageHeight = 297
            const margin = 20
            let yPosition = margin

            // Función para añadir texto con salto de página automático
            const addText = (text: string, x: number, y: number, options: any = {}) => {
                if (y > pageHeight - margin) {
                    pdf.addPage()
                    y = margin
                }
                pdf.setFontSize(options.size || 10)
                pdf.setFont('helvetica', options.style || 'normal')
                pdf.text(text, x, y)
                return y + (options.lineHeight || 6)
            }

            // Título principal
            yPosition = addText('REPORTE DE INVENTARIO', pageWidth / 2, yPosition, {
                size: 18,
                style: 'bold',
                lineHeight: 10
            })
            yPosition = addText(`Documento generado el ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, yPosition, {
                size: 10,
                lineHeight: 10
            })

            // Estadísticas generales
            const totalProductos = data.length
            const stockTotal = data.reduce((sum, item) => sum + item.cantidad, 0)
            const productosUnicos = new Set(data.map(item => item.producto_nombre)).size

            yPosition += 10
            yPosition = addText('RESUMEN GENERAL', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            yPosition = addText(`Total de lotes: ${totalProductos}`, margin, yPosition)
            yPosition = addText(`Productos únicos: ${productosUnicos}`, margin, yPosition)
            yPosition = addText(`Stock total (unidades): ${stockTotal.toLocaleString()}`, margin, yPosition)

            yPosition += 15

            // Línea separadora
            pdf.setLineWidth(0.5)
            pdf.line(margin, yPosition, pageWidth - margin, yPosition)
            yPosition += 10

            // Encabezados de tabla
            yPosition = addText('DETALLE DEL INVENTARIO', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            // Encabezados de columna
            const colX = [margin, margin + 45, margin + 120, margin + 150]

            // Fondo de encabezado
            pdf.setFillColor(240, 240, 240)
            pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F')

            yPosition = addText('Código Lote', colX[0], yPosition + 6, { style: 'bold' })
            addText('Producto', colX[1], yPosition - 6, { style: 'bold' })
            addText('Cantidad', colX[2], yPosition - 6, { style: 'bold' })
            addText('Unidad', colX[3], yPosition - 6, { style: 'bold' })

            yPosition += 5

            // Datos del inventario
            data.forEach((item, index) => {
                if (yPosition > pageHeight - 40) {
                    pdf.addPage()
                    yPosition = margin
                }

                // Alternar color de fondo
                if (index % 2 === 0) {
                    pdf.setFillColor(249, 249, 249)
                    pdf.rect(margin, yPosition - 4, pageWidth - (2 * margin), 8, 'F')
                }

                yPosition = addText(item.codigo_lote, colX[0], yPosition + 2)
                addText(item.producto_nombre.substring(0, 30), colX[1], yPosition - 6)
                addText(item.cantidad.toLocaleString(), colX[2], yPosition - 6)
                addText(item.unidad_medida, colX[3], yPosition - 6)
                yPosition += 3
            })

            // Footer en todas las páginas
            const totalPaginas = pdf.getNumberOfPages()
            for (let i = 1; i <= totalPaginas; i++) {
                pdf.setPage(i)
                pdf.setFontSize(8)
                pdf.text(`Página ${i} de ${totalPaginas}`, pageWidth - margin - 20, pageHeight - 10)
                pdf.text('Reporte de inventario generado automáticamente', margin, pageHeight - 10)
            }

            // Descargar PDF
            const fechaActual = new Date().toISOString().split('T')[0]
            const nombreArchivo = `inventario_${fechaActual}.pdf`
            pdf.save(nombreArchivo)

            toast.success(`PDF generado: ${totalProductos} productos exportados`)

        } catch (error) {
            console.error('Error al generar PDF:', error)
            toast.error("Error al generar el PDF del inventario")
        }
    }

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <Package className="size-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">Cargando inventario...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <strong>Error:</strong> {error}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
                    <p className="text-gray-600 mt-2">Consulta el estado actual del inventario por lotes</p>
                </div>

                {/* Tabla de Inventario */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="w-full">
                        {/* Filtros y controles */}
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-4">
                                <Input
                                    placeholder="Filtrar por código de lote..."
                                    value={(table.getColumn("codigo_lote")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("codigo_lote")?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                />
                                <Input
                                    placeholder="Filtrar por producto..."
                                    value={(table.getColumn("producto_nombre")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("producto_nombre")?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={generarPDFInventario}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={cargarInventario}
                                    disabled={loading}
                                >
                                    Actualizar
                                </Button>
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
                                                        {column.id === "codigo_lote" ? "Código de Lote" :
                                                            column.id === "producto_nombre" ? "Producto" :
                                                                column.id === "unidad_medida" ? "Unidad de Medida" :
                                                                    column.id}
                                                    </DropdownMenuCheckboxItem>
                                                )
                                            })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-hidden rounded-md border">
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
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Package className="size-8 text-gray-400" />
                                                    <p className="text-gray-500">No hay productos en el inventario</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación y estadísticas */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-muted-foreground flex-1 text-sm">
                                Mostrando {table.getRowModel().rows.length} de{" "}
                                {table.getFilteredRowModel().rows.length} lote(s) filtrado(s).
                                <span className="ml-4">
                                    Total de lotes: {data.length}
                                </span>
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
        </div>
    )
}
