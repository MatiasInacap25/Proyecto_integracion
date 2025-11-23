import { useState, useEffect } from 'react'
import { ProveedoresAdminData } from '../api/api'
import { DesactivarProveedor, ActivarProveedor, EditarProveedor } from '../api/adminapi'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select"
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
import { Badge } from "./ui/badge"
import { toast } from "sonner"

interface Proveedor {
    id: number
    nombre: string
    rut: string
    telefono: string
    direccion: string
    email: string
    es_persona_juridica: boolean
    activo: boolean
}

export default function Proveedores() {
    const [filteredData, setFilteredData] = useState<Proveedor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para AlertDialog de activar/desactivar
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
    const [proveedorAToggle, setProveedorAToggle] = useState<Proveedor | null>(null)

    // Estados para Dialog de edición
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null)
    const [formData, setFormData] = useState({
        nombre: '',
        rut: '',
        telefono: '',
        direccion: '',
        email: '',
        es_persona_juridica: true
    })

    // Estados para tabla
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    // Cargar datos de proveedores
    useEffect(() => {
        cargarProveedores()
    }, [])

    const cargarProveedores = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await ProveedoresAdminData()
            const result = response.data

            if (result.success) {
                setFilteredData(result.proveedores)
            } else {
                setError("Error al cargar los proveedores")
                toast.error("Error al cargar los proveedores")
            }
        } catch (err) {
            setError("Error de conexión al cargar los proveedores")
            toast.error("Error de conexión al cargar los proveedores")
            console.error("Error al cargar proveedores:", err)
        } finally {
            setLoading(false)
        }
    }

    const abrirDialogToggle = (proveedor: Proveedor) => {
        setProveedorAToggle(proveedor)
        setIsToggleDialogOpen(true)
    }

    const confirmarToggleEstado = async () => {
        if (!proveedorAToggle) return

        try {
            const response = proveedorAToggle.activo
                ? await DesactivarProveedor(proveedorAToggle.id)
                : await ActivarProveedor(proveedorAToggle.id)

            if (response.data.success) {
                toast.success(response.data.message || `Proveedor ${proveedorAToggle.activo ? 'desactivado' : 'activado'} correctamente`)
                cargarProveedores()
            } else {
                toast.error(response.data.message || "Error al cambiar el estado del proveedor")
            }
        } catch (error: any) {
            console.error("Error al cambiar estado del proveedor:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al cambiar el estado del proveedor"
            toast.error(errorMessage)
        } finally {
            setIsToggleDialogOpen(false)
            setProveedorAToggle(null)
        }
    }

    const abrirDialogEditar = (proveedor: Proveedor) => {
        setProveedorEditando(proveedor)
        setFormData({
            nombre: proveedor.nombre,
            rut: proveedor.rut,
            telefono: proveedor.telefono || '',
            direccion: proveedor.direccion || '',
            email: proveedor.email || '',
            es_persona_juridica: proveedor.es_persona_juridica
        })
        setIsEditDialogOpen(true)
    }

    const handleEditarProveedor = async () => {
        if (!proveedorEditando) return

        try {
            const response = await EditarProveedor(proveedorEditando.id, formData)
            if (response.data.success) {
                toast.success(response.data.message || "Proveedor actualizado correctamente")
                setIsEditDialogOpen(false)
                cargarProveedores()
            } else {
                toast.error(response.data.message || "Error al actualizar el proveedor")
            }
        } catch (error: any) {
            console.error("Error al editar proveedor:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al actualizar el proveedor"
            toast.error(errorMessage)
        }
    }

    const columns: ColumnDef<Proveedor>[] = [
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
            cell: ({ row }) => <div className="text-left">{row.getValue("telefono")}</div>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <div className="text-left">{row.getValue("email")}</div>,
        },
        {
            accessorKey: "direccion",
            header: "Dirección",
            cell: ({ row }) => <div className="text-left">{row.getValue("direccion")}</div>,
        },
        {
            accessorKey: "es_persona_juridica",
            header: "Tipo",
            cell: ({ row }) => {
                const esJuridica = row.getValue("es_persona_juridica") as boolean
                return (
                    <Badge variant={esJuridica ? "default" : "secondary"}>
                        {esJuridica ? "Jurídica" : "Natural"}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: "Acciones",
            enableHiding: false,
            cell: ({ row }) => {
                const proveedor = row.original

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirDialogEditar(proveedor)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={proveedor.activo ? "destructive" : "default"}
                            size="sm"
                            onClick={() => abrirDialogToggle(proveedor)}
                            className={!proveedor.activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                            {proveedor.activo ? 'Desactivar' : 'Activar'}
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
                <div className="text-lg">Cargando proveedores...</div>
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
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
                <p className="text-gray-600 mt-2">Consulta y administra todos los proveedores registrados</p>
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
                            {proveedorAToggle?.activo ? 'Desactivar Proveedor' : 'Activar Proveedor'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {proveedorAToggle?.activo ? (
                                <>
                                    ¿Estás seguro de que deseas desactivar al proveedor <strong>{proveedorAToggle?.nombre}</strong>?
                                    <br /><br />
                                    <span className="text-yellow-700">
                                        Una vez desactivado, este proveedor no estará disponible para nuevas operaciones.
                                    </span>
                                </>
                            ) : (
                                <>
                                    ¿Estás seguro de que deseas activar al proveedor <strong>{proveedorAToggle?.nombre}</strong>?
                                    <br /><br />
                                    <span className="text-green-700">
                                        Una vez activado, este proveedor estará disponible para nuevas operaciones.
                                    </span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmarToggleEstado}
                            className={proveedorAToggle?.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {proveedorAToggle?.activo ? 'Desactivar' : 'Activar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de Edición */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Proveedor</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del proveedor
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tipo">Tipo de Persona</Label>
                            <Select
                                value={formData.es_persona_juridica ? "juridica" : "natural"}
                                onValueChange={(value) => setFormData({ ...formData, es_persona_juridica: value === "juridica" })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="natural">Persona Natural</SelectItem>
                                    <SelectItem value="juridica">Persona Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nombre">Nombre</Label>
                            <Input
                                id="edit-nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-direccion">Dirección</Label>
                            <Input
                                id="edit-direccion"
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditarProveedor}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}