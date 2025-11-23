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
import { ArrowUpDown, ChevronDown, Users as UsersIcon, Download, UserX, UserCheck } from "lucide-react"

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UsersData } from "../api/api"
import { DesactivarUsuario, ActivarUsuario } from "../api/adminapi"
import { toast } from "sonner"
import jsPDF from 'jspdf'

// Interface para los datos del usuario
interface Usuario {
    id: number;
    nombre_completo: string;
    email: string;
    rut: string;
    fecha_nacimiento: string;
    fecha_registro: string;
    activo: boolean;
    cargo: string;
}

interface UsuariosResponse {
    success: boolean;
    usuarios: Usuario[];
}

// Definición de las columnas de la tabla
const createColumns = (
    desactivarUsuario: (userId: number) => void,
    activarUsuario: (userId: number) => void
): ColumnDef<Usuario>[] => [
        {
            accessorKey: "nombre_completo",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        Nombre Completo
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="font-medium px-2">{row.getValue("nombre_completo")}</div>
            ),
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        Email
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="lowercase text-sm px-2 max-w-[200px] truncate">{row.getValue("email")}</div>
            ),
        },
        {
            accessorKey: "rut",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        RUT
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="font-medium px-2 text-sm">{row.getValue("rut")}</div>
            ),
        },
        {
            accessorKey: "cargo",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        Cargo
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const cargo = row.getValue("cargo") as string;
                const getCargoColor = (cargo: string) => {
                    switch (cargo) {
                        case "Bodeguero":
                            return "bg-green-100 text-green-800 hover:bg-green-200";
                        case "Jefe de bodega":
                            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
                        case "Auditor":
                            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
                        case "Administrador":
                            return "bg-red-100 text-red-800 hover:bg-red-200";
                        default:
                            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
                    }
                };
                return (
                    <Badge className={`text-xs px-2 py-1 ${getCargoColor(cargo)}`}>
                        {cargo}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "fecha_nacimiento",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        Fecha Nacimiento
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="text-sm px-2">{row.getValue("fecha_nacimiento")}</div>
            ),
        },
        {
            accessorKey: "fecha_registro",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        Fecha Registro
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="text-sm px-2">{row.getValue("fecha_registro")}</div>
            ),
        },
        {
            accessorKey: "activo",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 text-xs font-semibold"
                    >
                        Estado
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const activo = row.getValue("activo") as boolean;
                return (
                    <Badge className={`text-xs px-2 py-1 ${activo
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}>
                        {activo ? "Activo" : "Inactivo"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const usuario = row.original;

                if (usuario.activo) {
                    // Botón de desactivar para usuarios activos
                    return (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 px-3 text-xs cursor-pointer hover:cursor-pointer bg-red-700 hover:bg-red-800 border-red-700"
                                >
                                    <UserX className="h-3 w-3 mr-1" />
                                    Desactivar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <p>
                                            Está a punto de desactivar al usuario <strong>{usuario.nombre_completo}</strong>.
                                        </p>
                                        <p>
                                            Al desactivarse, este usuario <strong>no tendrá acceso al sistema ni a ninguna de sus funciones</strong>.
                                        </p>
                                        <p>
                                            Esta acción puede revertirse más tarde reactivando el usuario.
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => desactivarUsuario(usuario.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Sí, desactivar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    );
                } else {
                    // Botón de activar para usuarios inactivos
                    return (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 px-3 text-xs cursor-pointer hover:cursor-pointer bg-green-600 hover:bg-green-700 border-green-600 text-white"
                                >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Activar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Activar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <p>
                                            Está a punto de activar al usuario <strong>{usuario.nombre_completo}</strong>.
                                        </p>
                                        <p>
                                            Al activarse, este usuario <strong>tendrá acceso completo al sistema y todas sus funciones</strong>.
                                        </p>
                                        <p>
                                            Esta acción puede revertirse más tarde desactivando el usuario.
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => activarUsuario(usuario.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Sí, activar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    );
                }
            },
        },
    ]

export default function Users() {
    const [data, setData] = useState<Usuario[]>([])
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState<string>("todos")

    // Función para desactivar usuario
    const desactivarUsuario = async (userId: number) => {
        try {
            // Llamada a la API para desactivar en el backend
            await DesactivarUsuario(userId)

            // Actualizar el estado local después de la confirmación del backend
            setData(prevData =>
                prevData.map(usuario =>
                    usuario.id === userId
                        ? { ...usuario, activo: false }
                        : usuario
                )
            )

            toast.success("Usuario desactivado correctamente")

        } catch (error) {
            console.error("Error al desactivar usuario:", error)
            toast.error("Error al desactivar el usuario")
        }
    }

    // Función para activar usuario
    const activarUsuario = async (userId: number) => {
        try {
            // Llamada a la API para activar en el backend
            await ActivarUsuario(userId)

            // Actualizar el estado local después de la confirmación del backend
            setData(prevData =>
                prevData.map(usuario =>
                    usuario.id === userId
                        ? { ...usuario, activo: true }
                        : usuario
                )
            )

            toast.success("Usuario activado correctamente")

        } catch (error) {
            console.error("Error al activar usuario:", error)
            toast.error("Error al activar el usuario")
        }
    }

    // Crear las columnas con las funciones de activar y desactivar
    const columns = createColumns(desactivarUsuario, activarUsuario)

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
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    // Función para cargar los datos de usuarios
    const cargarUsuarios = async () => {
        try {
            setLoading(true)
            const response = await UsersData()
            const usuariosData: UsuariosResponse = response.data

            if (usuariosData.success) {
                setData(usuariosData.usuarios)
            } else {
                console.error("Error al cargar los usuarios")
            }
        } catch (error) {
            console.error("Error al cargar usuarios:", error)
        } finally {
            setLoading(false)
        }
    }

    // Función para generar PDF de usuarios
    const generarPDFUsuarios = () => {
        try {
            const doc = new jsPDF()

            // Configuración del documento
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('Reporte de Usuarios', 20, 20)

            // Información del reporte
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 30)
            doc.text(`Hora de generación: ${new Date().toLocaleTimeString('es-ES')}`, 20, 35)

            // Estadísticas
            const totalUsuarios = data.length
            const usuariosActivos = data.filter(u => u.activo).length
            const usuariosInactivos = totalUsuarios - usuariosActivos
            const bodegueros = data.filter(u => u.cargo === 'Bodeguero').length
            const jefesBodega = data.filter(u => u.cargo === 'Jefe de bodega').length
            const auditores = data.filter(u => u.cargo === 'Auditor').length
            const administradores = data.filter(u => u.cargo === 'Administrador').length

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Estadísticas:', 20, 50)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text(`Total de usuarios: ${totalUsuarios}`, 20, 58)
            doc.text(`Usuarios activos: ${usuariosActivos}`, 20, 64)
            doc.text(`Usuarios inactivos: ${usuariosInactivos}`, 20, 70)
            doc.text(`Bodegueros: ${bodegueros}`, 20, 76)
            doc.text(`Jefes de bodega: ${jefesBodega}`, 20, 82)
            doc.text(`Auditores: ${auditores}`, 20, 88)
            doc.text(`Administradores: ${administradores}`, 20, 94)

            // Tabla de usuarios
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Lista de Usuarios:', 20, 111)

            // Headers de la tabla
            const headers = ['Nombre', 'Email', 'RUT', 'Cargo', 'Estado']
            const startY = 121
            const startX = 20
            const columnWidth = 30
            const rowHeight = 8

            // Dibujar headers
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            headers.forEach((header, index) => {
                doc.text(header, startX + (index * columnWidth), startY)
            })

            // Línea debajo de los headers
            doc.line(startX, startY + 2, startX + (headers.length * columnWidth), startY + 2)

            // Datos de la tabla
            doc.setFont('helvetica', 'normal')
            let currentY = startY + 10

            data.forEach((usuario) => {
                // Verificar si necesitamos una nueva página
                if (currentY > 270) {
                    doc.addPage()
                    currentY = 20

                    // Volver a dibujar headers en nueva página
                    doc.setFont('helvetica', 'bold')
                    headers.forEach((header, headerIndex) => {
                        doc.text(header, startX + (headerIndex * columnWidth), currentY)
                    })
                    doc.line(startX, currentY + 2, startX + (headers.length * columnWidth), currentY + 2)
                    currentY += 10
                    doc.setFont('helvetica', 'normal')
                }

                const rowData = [
                    usuario.nombre_completo.length > 15 ? usuario.nombre_completo.substring(0, 12) + '...' : usuario.nombre_completo,
                    usuario.email.length > 20 ? usuario.email.substring(0, 17) + '...' : usuario.email,
                    usuario.rut,
                    usuario.cargo.length > 12 ? usuario.cargo.substring(0, 9) + '...' : usuario.cargo,
                    usuario.activo ? 'Activo' : 'Inactivo'
                ]

                rowData.forEach((data, dataIndex) => {
                    doc.text(data, startX + (dataIndex * columnWidth), currentY)
                })

                currentY += rowHeight
            })

            // Guardar el PDF
            const fechaHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
            doc.save(`usuarios_${fechaHora}.pdf`)
            toast.success("PDF de usuarios generado correctamente")

        } catch (error) {
            console.error("Error al generar PDF:", error)
            toast.error("Error al generar el PDF")
        }
    }

    useEffect(() => {
        cargarUsuarios()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                    <p className="mt-2 text-gray-600">Cargando usuarios...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                        <p className="text-gray-600 mt-2">Consulta y administra todos los usuarios del sistema</p>
                    </div>
                    <Button onClick={generarPDFUsuarios} className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Exportar PDF</span>
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 py-4 flex-wrap">
                {/* Filtro por nombre */}
                <Input
                    placeholder="Filtrar por nombre..."
                    value={(table.getColumn("nombre_completo")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("nombre_completo")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />

                {/* Filtro por RUT */}
                <Input
                    placeholder="Filtrar por RUT..."
                    value={(table.getColumn("rut")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("rut")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />

                {/* Filtro por cargo */}
                <Select
                    value={(table.getColumn("cargo")?.getFilterValue() as string) ?? ""}
                    onValueChange={(value) => {
                        table.getColumn("cargo")?.setFilterValue(value === "todos" ? "" : value)
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por cargo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los cargos</SelectItem>
                        <SelectItem value="Bodeguero">Bodeguero</SelectItem>
                        <SelectItem value="Jefe de bodega">Jefe de bodega</SelectItem>
                        <SelectItem value="Auditor">Auditor</SelectItem>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                    </SelectContent>
                </Select>

                {/* Filtro por estado */}
                <Select
                    value={filtroEstado}
                    onValueChange={(value) => {
                        setFiltroEstado(value)
                        if (value === "todos") {
                            table.getColumn("activo")?.setFilterValue("")
                        } else if (value === "activo") {
                            table.getColumn("activo")?.setFilterValue(true)
                        } else if (value === "inactivo") {
                            table.getColumn("activo")?.setFilterValue(false)
                        }
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="activo">Activos</SelectItem>
                        <SelectItem value="inactivo">Inactivos</SelectItem>
                    </SelectContent>
                </Select>

                {/* Botón de columnas */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
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

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-gray-50">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="px-3 py-2 text-xs font-semibold text-gray-700">
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
                                    className="hover:bg-gray-50 border-b border-gray-100"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-3 py-2">
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
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

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
    )
}
