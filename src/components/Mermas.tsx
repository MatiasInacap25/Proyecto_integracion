import React, { useState, useEffect } from "react"
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
import { ArrowUpDown, ChevronDown, Package, Printer, Download, Trash2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { mermaData } from "../api/api"
import { EliminarMerma } from "../api/adminapi"
import { toast } from "sonner"
import jsPDF from 'jspdf'

// Interfaces para los datos de mermas
interface ProductoMerma {
    producto_nombre: string;
    unidad_medida: string;
    cantidad_merma: number;
    valor_merma: number;  // Nuevo campo
    codigo_lote: string;
}

interface MermaItem {
    id: number;
    fecha_registro: string;
    hora_registro: string;
    fecha_aprobacion: string;
    hora_aprobacion: string;
    estado: string;
    observaciones: string;
    usuario_registro: string;
    usuario_aprobacion: string;
    categoria_merma: string;
    bodega: string;
    valor_total_merma: number;  // Nuevo campo
    productos: ProductoMerma[];
}

interface MermaResponse {
    success: boolean;
    mermas: MermaItem[];
}

// Componente para mostrar el estado con colores
const EstadoBadge = ({ estado }: { estado: string }) => {
    const getEstadoColor = (estado: string) => {
        switch (estado.toLowerCase()) {
            case 'aprobado':
                return 'bg-green-100 text-green-800 hover:bg-green-100'
            case 'rechazado':
                return 'bg-red-100 text-red-800 hover:bg-red-100'
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        }
    }

    return (
        <Badge className={getEstadoColor(estado)}>
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
        </Badge>
    )
}

// Definición de las columnas de la tabla
export const columns: ColumnDef<MermaItem>[] = [
    {
        accessorKey: "fecha_registro",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fecha Registro
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const fecha = row.getValue("fecha_registro") as string
            const hora = row.original.hora_registro
            return (
                <div className="font-medium">
                    <div>{fecha}</div>
                    <div className="text-sm text-gray-500">{hora}</div>
                </div>
            )
        },
    },
    {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
            const estado = row.getValue("estado") as string
            return <EstadoBadge estado={estado} />
        },
    },
    {
        accessorKey: "categoria_merma",
        header: "Categoría",
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("categoria_merma")}</div>
        ),
    },
    {
        accessorKey: "usuario_registro",
        header: "Usuario",
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("usuario_registro")}</div>
        ),
    },
    {
        accessorKey: "valor_total_merma",
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
            const valor = row.getValue("valor_total_merma") as number
            return (
                <div className="text-left font-medium">
                    <span className="text-red-600">
                        ${valor.toLocaleString('es-CL')}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "productos",
        header: "Productos",
        cell: ({ row }) => {
            const productos = row.getValue("productos") as ProductoMerma[]
            return (
                <div className="text-left">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {productos.length} producto{productos.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )
        },
    },
]

export default function Mermas() {
    const [data, setData] = useState<MermaItem[]>([])
    const [filteredData, setFilteredData] = useState<MermaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Obtener cargo del usuario
    const userCargo = JSON.parse(localStorage.getItem("user") || "{}").cargo || 0

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    // Filtros adicionales
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [fechaDesde, setFechaDesde] = useState<string>("")
    const [fechaHasta, setFechaHasta] = useState<string>("")

    // Estados únicos para filtros
    const [estadosUnicos, setEstadosUnicos] = useState<string[]>([])    // Estado para controlar filas expandidas
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

    // Cargar datos de mermas
    useEffect(() => {
        cargarMermas()
    }, [])

    // Aplicar filtros cuando cambien
    useEffect(() => {
        aplicarFiltros()
    }, [data, estadoFilter, fechaDesde, fechaHasta])

    const cargarMermas = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await mermaData()
            const result: MermaResponse = response.data

            if (result.success) {
                setData(result.mermas)

                // Extraer estados únicos para filtros
                const estados = [...new Set(result.mermas.map(m => m.estado))]

                setEstadosUnicos(estados)
            } else {
                setError("Error al cargar las mermas")
                toast.error("Error al cargar las mermas")
            }
        } catch (err) {
            setError("Error de conexión al cargar las mermas")
            toast.error("Error de conexión al cargar las mermas")
            console.error("Error al cargar mermas:", err)
        } finally {
            setLoading(false)
        }
    }

    const aplicarFiltros = () => {
        let datosFiltrados = [...data]

        // Filtrar por estado
        if (estadoFilter !== "todos") {
            datosFiltrados = datosFiltrados.filter(merma => merma.estado === estadoFilter)
        }

        // Filtrar por rango de fechas
        if (fechaDesde) {
            datosFiltrados = datosFiltrados.filter(merma => {
                const fechaMerma = new Date(merma.fecha_registro.split('/').reverse().join('-'))
                const desde = new Date(fechaDesde)
                return fechaMerma >= desde
            })
        }

        if (fechaHasta) {
            datosFiltrados = datosFiltrados.filter(merma => {
                const fechaMerma = new Date(merma.fecha_registro.split('/').reverse().join('-'))
                const hasta = new Date(fechaHasta)
                return fechaMerma <= hasta
            })
        }

        setFilteredData(datosFiltrados)
    }

    const exportarDatos = () => {
        generarPDFTodasLasMermas()
    }

    const generarPDFTodasLasMermas = async () => {
        try {
            toast.info("Generando PDF de todas las mermas...")

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
            yPosition = addText('REPORTE GENERAL DE MERMAS', pageWidth / 2, yPosition, {
                size: 18,
                style: 'bold',
                lineHeight: 10
            })
            yPosition = addText(`Documento generado el ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, yPosition, {
                size: 10,
                lineHeight: 10
            })

            // Estadísticas generales
            const totalMermas = filteredData.length
            const aprobadas = filteredData.filter(m => m.estado === 'aprobado').length
            const rechazadas = filteredData.filter(m => m.estado === 'rechazado').length
            const pendientes = filteredData.filter(m => m.estado === 'pendiente').length

            // Cálculo de valores monetarios
            const valorTotalTodasMermas = filteredData.reduce((total, merma) => total + (merma.valor_total_merma || 0), 0)
            const valorTotalAprobadas = filteredData
                .filter(m => m.estado === 'aprobado')
                .reduce((total, merma) => total + (merma.valor_total_merma || 0), 0)
            const valorTotalRechazadas = filteredData
                .filter(m => m.estado === 'rechazado')
                .reduce((total, merma) => total + (merma.valor_total_merma || 0), 0)
            const valorTotalPendientes = filteredData
                .filter(m => m.estado === 'pendiente')
                .reduce((total, merma) => total + (merma.valor_total_merma || 0), 0)

            yPosition += 10
            yPosition = addText('RESUMEN GENERAL', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            yPosition = addText(`Total de mermas: ${totalMermas}`, margin, yPosition)
            yPosition = addText(`Aprobadas: ${aprobadas} (${totalMermas > 0 ? ((aprobadas / totalMermas) * 100).toFixed(1) : 0}%)`, margin, yPosition)
            yPosition = addText(`Rechazadas: ${rechazadas} (${totalMermas > 0 ? ((rechazadas / totalMermas) * 100).toFixed(1) : 0}%)`, margin, yPosition)
            yPosition = addText(`Pendientes: ${pendientes} (${totalMermas > 0 ? ((pendientes / totalMermas) * 100).toFixed(1) : 0}%)`, margin, yPosition)

            yPosition += 5
            yPosition = addText('RESUMEN DE VALORES', margin, yPosition, {
                size: 12,
                style: 'bold',
                lineHeight: 8
            })
            yPosition = addText(`Valor total de todas las mermas: $${valorTotalTodasMermas.toLocaleString('es-CL')}`, margin, yPosition)
            yPosition = addText(`Valor total mermas aprobadas: $${valorTotalAprobadas.toLocaleString('es-CL')}`, margin, yPosition)
            yPosition = addText(`Valor total mermas rechazadas: $${valorTotalRechazadas.toLocaleString('es-CL')}`, margin, yPosition)
            yPosition = addText(`Valor total mermas pendientes: $${valorTotalPendientes.toLocaleString('es-CL')}`, margin, yPosition)

            yPosition += 15

            // Línea separadora
            pdf.setLineWidth(0.5)
            pdf.line(margin, yPosition, pageWidth - margin, yPosition)
            yPosition += 10

            // Lista de mermas
            yPosition = addText('DETALLE DE MERMAS', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            // Procesar cada merma
            filteredData.forEach((merma, index) => {
                // Verificar si necesitamos nueva página
                if (yPosition > pageHeight - 60) {
                    pdf.addPage()
                    yPosition = margin
                }

                // Encabezado de merma
                yPosition = addText(`MERMA ${index + 1}`, margin, yPosition, {
                    size: 12,
                    style: 'bold',
                    lineHeight: 8
                })

                // Información básica en una línea
                const infoBasica = `${merma.fecha_registro} | ${merma.estado.toUpperCase()} | ${merma.categoria_merma} | ${merma.usuario_registro}`
                yPosition = addText(infoBasica, margin, yPosition, { size: 9, lineHeight: 6 })

                // Valor total de la merma
                yPosition = addText(`Valor total merma: $${(merma.valor_total_merma || 0).toLocaleString('es-CL')}`, margin, yPosition, {
                    size: 10,
                    style: 'bold',
                    lineHeight: 6
                })

                // Productos con sus valores
                yPosition = addText('Productos:', margin, yPosition, { size: 9, style: 'bold', lineHeight: 6 })
                merma.productos.forEach((producto) => {
                    const productoInfo = `• ${producto.producto_nombre} (${producto.codigo_lote}): ${producto.cantidad_merma} ${producto.unidad_medida} - $${(producto.valor_merma || 0).toLocaleString('es-CL')}`

                    // Si la línea es muy larga, dividirla
                    if (productoInfo.length > 90) {
                        const parte1 = productoInfo.substring(0, 90) + '...'
                        yPosition = addText(parte1, margin + 5, yPosition, { size: 8, lineHeight: 5 })
                    } else {
                        yPosition = addText(productoInfo, margin + 5, yPosition, { size: 8, lineHeight: 5 })
                    }
                })

                // Observaciones (resumido)
                const obsResumido = merma.observaciones.length > 80 ?
                    merma.observaciones.substring(0, 80) + '...' : merma.observaciones
                yPosition = addText(`Observaciones: ${obsResumido}`, margin, yPosition, { size: 8, lineHeight: 8 })

                yPosition += 3 // Espacio entre mermas
            })

            // Footer en última página
            const totalPaginas = pdf.getNumberOfPages()
            for (let i = 1; i <= totalPaginas; i++) {
                pdf.setPage(i)
                pdf.setFontSize(8)
                pdf.text(`Página ${i} de ${totalPaginas}`, pageWidth - margin - 20, pageHeight - 10)
                pdf.text('Reporte generado automáticamente', margin, pageHeight - 10)
            }

            // Descargar PDF
            const fechaActual = new Date().toISOString().split('T')[0]
            const nombreArchivo = `reporte_mermas_${fechaActual}.pdf`
            pdf.save(nombreArchivo)

            toast.success(`PDF generado: ${totalMermas} mermas exportadas`)

        } catch (error) {
            console.error('Error al generar PDF:', error)
            toast.error("Error al generar el PDF")
        }
    }

    const limpiarFiltros = () => {
        setEstadoFilter("todos")
        setFechaDesde("")
        setFechaHasta("")
        table.getColumn("categoria_merma")?.setFilterValue("")
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

    const handleEliminarMerma = async (id: number) => {
        try {
            const response = await EliminarMerma(id)
            if (response.data.success) {
                toast.success(response.data.message || "Merma eliminada correctamente")
                cargarMermas()
            } else {
                toast.error(response.data.message || "Error al eliminar la merma")
            }
        } catch (error: any) {
            console.error("Error al eliminar merma:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al eliminar la merma"
            toast.error(errorMessage)
        }
    }

    const generarPDFMerma = async (merma: MermaItem) => {
        try {
            toast.info("Generando PDF...")

            // Crear PDF directamente con jsPDF sin html2canvas
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pageWidth = 210
            const pageHeight = 297
            const margin = 20
            const usableWidth = pageWidth - (2 * margin)
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

            // Título
            yPosition = addText('REPORTE DE MERMA', pageWidth / 2, yPosition, {
                size: 18,
                style: 'bold',
                lineHeight: 10
            })
            yPosition = addText(`Documento generado el ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, yPosition, {
                size: 10,
                lineHeight: 15
            })

            // Línea separadora
            pdf.setLineWidth(1)
            pdf.line(margin, yPosition, pageWidth - margin, yPosition)
            yPosition += 15

            // Información General
            yPosition = addText('INFORMACIÓN GENERAL', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            const infoData = [
                ['Fecha de Registro:', `${merma.fecha_registro} - ${merma.hora_registro}`],
                ['Fecha de Aprobación:', `${merma.fecha_aprobacion} - ${merma.hora_aprobacion}`],
                ['Estado:', merma.estado.toUpperCase()],
                ['Categoría:', merma.categoria_merma],
                ['Bodega:', merma.bodega],
                ['Valor Total Merma:', `$${merma.valor_total_merma.toLocaleString('es-CL')}`],
                ['Registrado por:', merma.usuario_registro],
                ['Aprobado por:', merma.usuario_aprobacion]
            ]

            infoData.forEach(([label, value]) => {
                yPosition = addText(label, margin, yPosition, { style: 'bold' })
                yPosition = addText(value, margin + 50, yPosition - 6, { lineHeight: 8 })
            })

            yPosition += 10

            // Productos Afectados
            yPosition = addText('PRODUCTOS AFECTADOS', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            // Encabezados de tabla
            const colX = [margin, margin + 50, margin + 85, margin + 110, margin + 140]

            // Fondo de encabezado
            pdf.setFillColor(240, 240, 240)
            pdf.rect(margin, yPosition, usableWidth, 8, 'F')

            yPosition = addText('Producto', colX[0], yPosition + 6, { style: 'bold' })
            addText('Código Lote', colX[1], yPosition - 6, { style: 'bold' })
            addText('Cantidad', colX[2], yPosition - 6, { style: 'bold' })
            addText('Unidad', colX[3], yPosition - 6, { style: 'bold' })
            addText('Valor Merma', colX[4], yPosition - 6, { style: 'bold' })

            yPosition += 5

            // Datos de productos
            merma.productos.forEach((producto, index) => {
                if (yPosition > pageHeight - 40) {
                    pdf.addPage()
                    yPosition = margin
                }

                // Alternar color de fondo
                if (index % 2 === 0) {
                    pdf.setFillColor(249, 249, 249)
                    pdf.rect(margin, yPosition - 4, usableWidth, 8, 'F')
                }

                yPosition = addText(producto.producto_nombre.substring(0, 20), colX[0], yPosition + 2)
                addText(producto.codigo_lote, colX[1], yPosition - 6)
                addText(producto.cantidad_merma.toLocaleString(), colX[2], yPosition - 6)
                addText(producto.unidad_medida, colX[3], yPosition - 6)
                addText(`$${producto.valor_merma.toLocaleString('es-CL')}`, colX[4], yPosition - 6)
                yPosition += 3
            })

            yPosition += 10

            // Observaciones
            yPosition = addText('OBSERVACIONES', margin, yPosition, {
                size: 14,
                style: 'bold',
                lineHeight: 10
            })

            // Dividir observaciones en líneas si es muy largo
            const observaciones = merma.observaciones
            const maxCharsPerLine = 80
            const observacionesLineas = []

            for (let i = 0; i < observaciones.length; i += maxCharsPerLine) {
                observacionesLineas.push(observaciones.substring(i, i + maxCharsPerLine))
            }

            observacionesLineas.forEach(linea => {
                yPosition = addText(linea, margin, yPosition)
            })

            yPosition += 20

            // Área de firmas
            if (yPosition > pageHeight - 60) {
                pdf.addPage()
                yPosition = margin
            }

            pdf.setLineWidth(0.5)
            pdf.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin)

            yPosition = addText('FIRMAS', margin, pageHeight - 50, {
                size: 14,
                style: 'bold'
            })

            // Líneas para firmas
            const firmaY = pageHeight - 35
            pdf.line(margin, firmaY, margin + 70, firmaY)
            pdf.line(pageWidth - margin - 70, firmaY, pageWidth - margin, firmaY)

            addText('Responsable Registro', margin, firmaY + 5, { size: 8 })
            addText('Responsable Aprobación', pageWidth - margin - 70, firmaY + 5, { size: 8 })

            addText(merma.usuario_registro, margin, firmaY + 10, { size: 8 })
            addText(merma.usuario_aprobacion, pageWidth - margin - 70, firmaY + 10, { size: 8 })

            // Descargar PDF
            const nombreArchivo = `merma_${merma.fecha_registro.replace(/\//g, '-')}_${merma.categoria_merma.replace(/\s+/g, '_')}.pdf`
            pdf.save(nombreArchivo)

            toast.success("PDF generado exitosamente")

        } catch (error) {
            console.error('Error al generar PDF:', error)
            toast.error("Error al generar el PDF")
        }
    }

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
                        <p className="text-gray-600">Cargando mermas...</p>
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
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Mermas</h1>
                    <p className="text-gray-600 mt-2">Consulta y administra todas las mermas registradas</p>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{filteredData.length}</div>
                        <div className="text-gray-600">Total</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {filteredData.filter(m => m.estado === 'aprobado').length}
                        </div>
                        <div className="text-gray-600">Aprobadas</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {filteredData.filter(m => m.estado === 'rechazado').length}
                        </div>
                        <div className="text-gray-600">Rechazadas</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                            {filteredData.filter(m => m.estado === 'Pendiente').length}
                        </div>
                        <div className="text-gray-600">Pendientes</div>
                    </div>
                </div>

                {/* Filtros y controles */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {/* Filtros de fecha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{
                                    colorScheme: 'light'
                                }}
                            />
                        </div>

                        {/* Filtro por estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="aprobado">Aprobado</SelectItem>
                                    <SelectItem value="rechazado">Rechazado</SelectItem>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    {estadosUnicos.filter(estado => !['aprobado', 'rechazado', 'Pendiente'].includes(estado)).map(estado => (
                                        <SelectItem key={estado} value={estado}>
                                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-end gap-2">
                            <Button variant="outline" onClick={limpiarFiltros}>
                                Limpiar
                            </Button>
                            <Button onClick={cargarMermas} disabled={loading}>
                                Actualizar
                            </Button>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                variant="outline"
                                onClick={exportarDatos}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabla de Mermas con Acordeón */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="w-full">
                        {/* Controles de tabla */}
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center space-x-4">
                                <Input
                                    placeholder="Buscar por categoría..."
                                    value={(table.getColumn("categoria_merma")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("categoria_merma")?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                />
                                <Input
                                    placeholder="Buscar por usuario..."
                                    value={(table.getColumn("usuario_registro")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("usuario_registro")?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
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

                        {/* Tabla con acordeón integrado */}
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
                                            <TableHead className="w-24">Acciones</TableHead>
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row, index) => {
                                            const merma = row.original
                                            const isExpanded = expandedRows.has(index)

                                            return (
                                                <React.Fragment key={`row-${row.id}`}>
                                                    {/* Fila principal clickeable */}
                                                    <TableRow
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => toggleRowExpansion(index)}
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell key={cell.id}>
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell>
                                                            <div className="flex gap-0">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        generarPDFMerma(merma)
                                                                    }}
                                                                    title="Generar PDF"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                </Button>
                                                                {userCargo === 4 && (
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
                                                                                    ¿Eliminar esta merma?
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Esta acción no se puede deshacer. Se eliminará permanentemente esta merma del sistema.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    className="bg-red-600 hover:bg-red-700"
                                                                                    onClick={() => handleEliminarMerma(merma.id)}
                                                                                >
                                                                                    Eliminar
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleRowExpansion(index)
                                                                    }}
                                                                >
                                                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Fila expandible con detalles */}
                                                    {isExpanded && (
                                                        <TableRow key={`expanded-${row.id}`}>
                                                            <TableCell colSpan={columns.length + 1} className="p-0">
                                                                <div className="bg-gray-50 p-6 space-y-4">
                                                                    {/* Información general */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="bg-white rounded-lg p-4">
                                                                            <h4 className="font-semibold text-gray-700 mb-3">Información de Registro</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <p><span className="font-medium">Fecha:</span> {merma.fecha_registro} - {merma.hora_registro}</p>
                                                                                <p><span className="font-medium">Registrado por:</span> {merma.usuario_registro}</p>
                                                                                <p><span className="font-medium">Bodega:</span> {merma.bodega}</p>
                                                                                <p><span className="font-medium">Categoría:</span> {merma.categoria_merma}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="bg-white rounded-lg p-4">
                                                                            <h4 className="font-semibold text-gray-700 mb-3">Información de Aprobación</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <p><span className="font-medium">Fecha:</span> {merma.fecha_aprobacion} - {merma.hora_aprobacion}</p>
                                                                                <p><span className="font-medium">Aprobado por:</span> {merma.usuario_aprobacion}</p>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium">Estado:</span>
                                                                                    <EstadoBadge estado={merma.estado} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Observaciones */}
                                                                    <div className="bg-white rounded-lg p-4">
                                                                        <h4 className="font-semibold text-gray-700 mb-3">Observaciones</h4>
                                                                        <p className="text-sm bg-gray-50 p-3 rounded border">{merma.observaciones}</p>
                                                                    </div>

                                                                    {/* Productos afectados */}
                                                                    <div className="bg-white rounded-lg p-4">
                                                                        <div className="flex justify-between items-center mb-3">
                                                                            <h4 className="font-semibold text-gray-700">Productos Afectados ({merma.productos.length})</h4>
                                                                            <div className="text-right">
                                                                                <div className="text-sm text-gray-600">Valor Total de Merma:</div>
                                                                                <div className="text-lg font-bold text-red-600">
                                                                                    ${merma.valor_total_merma.toLocaleString('es-CL')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="overflow-hidden rounded border">
                                                                            <table className="w-full">
                                                                                <thead className="bg-gray-100">
                                                                                    <tr>
                                                                                        <th className="px-4 py-2 text-left text-sm font-medium">Producto</th>
                                                                                        <th className="px-4 py-2 text-left text-sm font-medium">Código de Lote</th>
                                                                                        <th className="px-4 py-2 text-right text-sm font-medium">Cantidad</th>
                                                                                        <th className="px-4 py-2 text-left text-sm font-medium">Unidad</th>
                                                                                        <th className="px-4 py-2 text-right text-sm font-medium">Valor Merma</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {merma.productos.map((producto, idx) => (
                                                                                        <tr key={`${row.id}-producto-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                                            <td className="px-4 py-2 text-sm font-medium">{producto.producto_nombre}</td>
                                                                                            <td className="px-4 py-2 text-sm text-gray-600">{producto.codigo_lote}</td>
                                                                                            <td className="px-4 py-2 text-sm text-right font-medium">
                                                                                                {producto.cantidad_merma.toLocaleString()}
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-sm text-gray-600">{producto.unidad_medida}</td>
                                                                                            <td className="px-4 py-2 text-sm text-right font-bold text-red-600">
                                                                                                ${producto.valor_merma.toLocaleString('es-CL')}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length + 1}
                                                className="h-24 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Package className="size-8 text-gray-400" />
                                                    <p className="text-gray-500">No hay mermas registradas</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>



                        {/* Paginación */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-muted-foreground flex-1 text-sm">
                                Mostrando {table.getRowModel().rows.length} de{" "}
                                {table.getFilteredRowModel().rows.length} merma(s) filtrada(s).
                                <span className="ml-4">
                                    Total de mermas: {data.length}
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
