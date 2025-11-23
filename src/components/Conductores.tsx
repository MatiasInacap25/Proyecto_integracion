import { useState, useEffect } from 'react'
import { ConductoresAdminData } from '../api/api'
import { DesactivarConductor, ActivarConductor, EditarConductor } from '../api/adminapi'
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
import { ArrowUpDown, ChevronDown, TriangleAlert, Pencil } from "lucide-react"
import { Button } from "./ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog"
import { Label } from "./ui/label"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Input } from "./ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table"
import { toast } from "sonner"

interface Conductor {
    id: number
    nombre: string
    apellido: string
    rut: string
    telefono: string
    fecha_nacimiento: string | null
    activo: boolean
}

export default function Conductores() {
    const [filteredData, setFilteredData] = useState<Conductor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para AlertDialog de activar/desactivar
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
    const [conductorAToggle, setConductorAToggle] = useState<Conductor | null>(null)

    // Estados para Dialog de edición
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [conductorEditando, setConductorEditando] = useState<Conductor | null>(null)
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        rut: '',
        telefono: '',
        fecha_nacimiento: ''
    })

    // Estados para tabla
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    // Cargar datos de conductores
    useEffect(() => {
        cargarConductores()
    }, [])

    const cargarConductores = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await ConductoresAdminData()
            const result = response.data

            if (result.success) {
                setFilteredData(result.conductores)
            } else {
                setError("Error al cargar los conductores")
                toast.error("Error al cargar los conductores")
            }
        } catch (err) {
            setError("Error de conexión al cargar los conductores")
            toast.error("Error de conexión al cargar los conductores")
            console.error("Error al cargar conductores:", err)
        } finally {
            setLoading(false)
        }
    }

    const abrirDialogToggle = (conductor: Conductor) => {
        setConductorAToggle(conductor)
        setIsToggleDialogOpen(true)
    }

    const confirmarToggleEstado = async () => {
        if (!conductorAToggle) return

        try {
            const response = conductorAToggle.activo
                ? await DesactivarConductor(conductorAToggle.id)
                : await ActivarConductor(conductorAToggle.id)

            if (response.data.success) {
                toast.success(response.data.message || `Conductor ${conductorAToggle.activo ? 'desactivado' : 'activado'} correctamente`)
                cargarConductores()
            } else {
                toast.error(response.data.message || "Error al cambiar el estado del conductor")
            }
        } catch (error: any) {
            console.error("Error al cambiar estado del conductor:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al cambiar el estado del conductor"
            toast.error(errorMessage)
        } finally {
            setIsToggleDialogOpen(false)
            setConductorAToggle(null)
        }
    }

    const abrirDialogEditar = (conductor: Conductor) => {
        setConductorEditando(conductor)
        setFormData({
            nombre: conductor.nombre,
            apellido: conductor.apellido,
            rut: conductor.rut,
            telefono: conductor.telefono || '',
            fecha_nacimiento: conductor.fecha_nacimiento || ''
        })
        setIsEditDialogOpen(true)
    }

    const handleEditarConductor = async () => {
        if (!conductorEditando) return

        try {
            const response = await EditarConductor(conductorEditando.id, formData)
            if (response.data.success) {
                toast.success(response.data.message || "Conductor actualizado correctamente")
                setIsEditDialogOpen(false)
                cargarConductores()
            } else {
                toast.error(response.data.message || "Error al actualizar el conductor")
            }
        } catch (error: any) {
            console.error("Error al editar conductor:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al actualizar el conductor"
            toast.error(errorMessage)
        }
    }

    const formatearFecha = (fecha: string | null) => {
        if (!fecha) return 'N/A'
        const date = new Date(fecha)
        return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }

    const columns: ColumnDef<Conductor>[] = [
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
            accessorKey: "apellido",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Apellido
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-left">{row.getValue("apellido")}</div>,
        },
        {
            accessorKey: "rut",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        RUT
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-left">{row.getValue("rut")}</div>,
        },
        {
            accessorKey: "telefono",
            header: "Teléfono",
            cell: ({ row }) => <div className="text-left">{row.getValue("telefono") || 'N/A'}</div>,
        },
        {
            accessorKey: "fecha_nacimiento",
            header: "Fecha Nacimiento",
            cell: ({ row }) => <div className="text-left">{formatearFecha(row.getValue("fecha_nacimiento"))}</div>,
        },
        {
            id: "actions",
            header: "Acciones",
            enableHiding: false,
            cell: ({ row }) => {
                const conductor = row.original

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirDialogEditar(conductor)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={conductor.activo ? "destructive" : "default"}
                            size="sm"
                            onClick={() => abrirDialogToggle(conductor)}
                            className={!conductor.activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                            {conductor.activo ? 'Desactivar' : 'Activar'}
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
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Cargando conductores...</div>
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
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Conductores</h1>
                <p className="text-gray-600 mt-2">Consulta y administra todos los conductores registrados</p>
            </div>

            {/* Filtros y controles */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center gap-4">
                    {/* Filtro por nombre */}
                    <Input
                        placeholder="Buscar por nombre..."
                        value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("nombre")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm h-10"
                    />

                    {/* Visibilidad de columnas */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto h-10">
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
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-md">
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
                <div className="flex items-center justify-end space-x-2 py-4 px-4">
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

            {/* AlertDialog de Activar/Desactivar */}
            <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <TriangleAlert className="h-5 w-5 text-yellow-600" />
                            {conductorAToggle?.activo ? 'Desactivar Conductor' : 'Activar Conductor'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {conductorAToggle?.activo ? (
                                <>
                                    ¿Estás seguro de que deseas desactivar al conductor <strong>{conductorAToggle?.nombre} {conductorAToggle?.apellido}</strong>?
                                    <br /><br />
                                    <span className="text-yellow-700">
                                        Una vez desactivado, este conductor no estará disponible para nuevas operaciones.
                                    </span>
                                </>
                            ) : (
                                <>
                                    ¿Estás seguro de que deseas activar al conductor <strong>{conductorAToggle?.nombre} {conductorAToggle?.apellido}</strong>?
                                    <br /><br />
                                    <span className="text-green-700">
                                        Una vez activado, este conductor estará disponible para nuevas operaciones.
                                    </span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmarToggleEstado}
                            className={conductorAToggle?.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {conductorAToggle?.activo ? 'Desactivar' : 'Activar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de Edición */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Conductor</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del conductor
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nombre">Nombre</Label>
                            <Input
                                id="edit-nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-apellido">Apellido</Label>
                            <Input
                                id="edit-apellido"
                                value={formData.apellido}
                                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-rut">RUT</Label>
                            <Input
                                id="edit-rut"
                                value={formData.rut}
                                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-telefono">Teléfono</Label>
                            <Input
                                id="edit-telefono"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-fecha">Fecha de Nacimiento</Label>
                            <Input
                                id="edit-fecha"
                                type="date"
                                value={formData.fecha_nacimiento}
                                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                style={{
                                    colorScheme: 'light'
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditarConductor}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
