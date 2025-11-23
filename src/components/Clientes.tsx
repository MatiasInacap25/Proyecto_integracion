import { useState, useEffect } from 'react'
import { ClientesAdminData } from '../api/api'
import { DesactivarCliente, ActivarCliente, EditarCliente } from '../api/adminapi'
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

interface Cliente {
    id: number
    nombre: string
    rut: string
    telefono: string
    direccion: string
    email: string
    es_persona_juridica: boolean
    activo: boolean
}

export default function Clientes() {
    const [filteredData, setFilteredData] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para AlertDialog de activar/desactivar
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
    const [clienteAToggle, setClienteAToggle] = useState<Cliente | null>(null)

    // Estados para Dialog de edición
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
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

    // Cargar datos de clientes
    useEffect(() => {
        cargarClientes()
    }, [])

    const cargarClientes = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await ClientesAdminData()
            const result = response.data

            if (result.success) {
                setFilteredData(result.clientes)
            } else {
                setError("Error al cargar los clientes")
                toast.error("Error al cargar los clientes")
            }
        } catch (err) {
            setError("Error de conexión al cargar los clientes")
            toast.error("Error de conexión al cargar los clientes")
            console.error("Error al cargar clientes:", err)
        } finally {
            setLoading(false)
        }
    }

    const abrirDialogToggle = (cliente: Cliente) => {
        setClienteAToggle(cliente)
        setIsToggleDialogOpen(true)
    }

    const confirmarToggleEstado = async () => {
        if (!clienteAToggle) return

        try {
            const response = clienteAToggle.activo
                ? await DesactivarCliente(clienteAToggle.id)
                : await ActivarCliente(clienteAToggle.id)

            if (response.data.success) {
                toast.success(response.data.message || `Cliente ${clienteAToggle.activo ? 'desactivado' : 'activado'} correctamente`)
                cargarClientes()
            } else {
                toast.error(response.data.message || "Error al cambiar el estado del cliente")
            }
        } catch (error: any) {
            console.error("Error al cambiar estado del cliente:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al cambiar el estado del cliente"
            toast.error(errorMessage)
        } finally {
            setIsToggleDialogOpen(false)
            setClienteAToggle(null)
        }
    }

    const abrirDialogEditar = (cliente: Cliente) => {
        setClienteEditando(cliente)
        setFormData({
            nombre: cliente.nombre,
            rut: cliente.rut,
            telefono: cliente.telefono || '',
            direccion: cliente.direccion || '',
            email: cliente.email || '',
            es_persona_juridica: cliente.es_persona_juridica
        })
        setIsEditDialogOpen(true)
    }

    const handleEditarCliente = async () => {
        if (!clienteEditando) return

        try {
            const response = await EditarCliente(clienteEditando.id, formData)
            if (response.data.success) {
                toast.success(response.data.message || "Cliente actualizado correctamente")
                setIsEditDialogOpen(false)
                cargarClientes()
            } else {
                toast.error(response.data.message || "Error al actualizar el cliente")
            }
        } catch (error: any) {
            console.error("Error al editar cliente:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al actualizar el cliente"
            toast.error(errorMessage)
        }
    }

    const columns: ColumnDef<Cliente>[] = [
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
                const cliente = row.original

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirDialogEditar(cliente)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={cliente.activo ? "destructive" : "default"}
                            size="sm"
                            onClick={() => abrirDialogToggle(cliente)}
                            className={!cliente.activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                            {cliente.activo ? 'Desactivar' : 'Activar'}
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
                <div className="text-lg">Cargando clientes...</div>
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
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
                <p className="text-gray-600 mt-2">Consulta y administra todos los clientes registrados</p>
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
                            {clienteAToggle?.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {clienteAToggle?.activo ? (
                                <>
                                    ¿Estás seguro de que deseas desactivar al cliente <strong>{clienteAToggle?.nombre}</strong>?
                                    <br /><br />
                                    <span className="text-yellow-700">
                                        Una vez desactivado, este cliente no estará disponible para nuevas operaciones.
                                    </span>
                                </>
                            ) : (
                                <>
                                    ¿Estás seguro de que deseas activar al cliente <strong>{clienteAToggle?.nombre}</strong>?
                                    <br /><br />
                                    <span className="text-green-700">
                                        Una vez activado, este cliente estará disponible para nuevas operaciones.
                                    </span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmarToggleEstado}
                            className={clienteAToggle?.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {clienteAToggle?.activo ? 'Desactivar' : 'Activar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de Edición */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del cliente
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
                        <Button onClick={handleEditarCliente}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
