import { useState, useEffect } from 'react'
import { UnidadesMedidaData, CategoriasData } from '../api/api'
import { RegistrarProducto } from '../api/adminapi'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"

export default function FormProducto() {
    const [unidadesMedida, setUnidadesMedida] = useState<Array<{ id: number, nombre: string }>>([])
    const [categorias, setCategorias] = useState<Array<{ id: number, nombre: string }>>([])
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        categoria_id: 0,
        unidad_medida_id: 0,
        cantidad_por_lote: 1,
        precio_unitario: 0
    })

    useEffect(() => {
        cargarUnidadesMedida()
        cargarCategorias()
    }, [])

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validación
        if (!formData.nombre.trim()) {
            toast.error("El nombre del producto es requerido")
            return
        }
        if (formData.categoria_id === 0) {
            toast.error("Debes seleccionar una categoría")
            return
        }
        if (formData.unidad_medida_id === 0) {
            toast.error("Debes seleccionar una unidad de medida")
            return
        }
        if (formData.cantidad_por_lote <= 0) {
            toast.error("La cantidad por lote debe ser mayor a 0")
            return
        }
        if (formData.precio_unitario <= 0) {
            toast.error("El precio unitario debe ser mayor a 0")
            return
        }

        try {
            setLoading(true)
            const response = await RegistrarProducto(formData)

            if (response.data.success) {
                toast.success(response.data.message || "Producto registrado correctamente")
                // Limpiar formulario
                setFormData({
                    nombre: '',
                    categoria_id: 0,
                    unidad_medida_id: 0,
                    cantidad_por_lote: 1,
                    precio_unitario: 0
                })
            } else {
                toast.error(response.data.message || "Error al registrar el producto")
            }
        } catch (error: any) {
            console.error("Error al registrar producto:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al registrar el producto"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleUnidadChange = (value: string) => {
        const unidadSeleccionada = unidadesMedida.find(u => u.id === Number(value))
        const nuevaCantidad = unidadSeleccionada && (unidadSeleccionada.nombre === "Litros" || unidadSeleccionada.nombre === "Kilogramos") ? 1 : formData.cantidad_por_lote

        setFormData({
            ...formData,
            unidad_medida_id: Number(value),
            cantidad_por_lote: nuevaCantidad
        })
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Producto</CardTitle>
                    <CardDescription>
                        Completa los datos del producto para registrarlo en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Advertencia */}
                    <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <TriangleAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> Una vez registrado, el producto no podrá ser eliminado.
                            Solo podrás desactivarlo o editar su información.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre del Producto *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Arroz Grado 2"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <Select
                                value={formData.categoria_id === 0 ? "" : formData.categoria_id.toString()}
                                onValueChange={(value) => setFormData({ ...formData, categoria_id: Number(value) })}
                            >
                                <SelectTrigger>
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

                        {/* Unidad de Medida */}
                        <div className="space-y-2">
                            <Label htmlFor="unidad">Unidad de Medida *</Label>
                            <Select
                                value={formData.unidad_medida_id === 0 ? "" : formData.unidad_medida_id.toString()}
                                onValueChange={handleUnidadChange}
                            >
                                <SelectTrigger>
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

                        {/* Cantidad por Lote */}
                        <div className="space-y-2">
                            <Label htmlFor="cantidad">Cantidad por Lote *</Label>
                            <Input
                                id="cantidad"
                                type="number"
                                min="1"
                                placeholder="Ej: 25"
                                value={formData.cantidad_por_lote}
                                onChange={(e) => setFormData({ ...formData, cantidad_por_lote: Number(e.target.value) })}
                                disabled={unidadesMedida.find(u => u.id === formData.unidad_medida_id)?.nombre === "Litros" ||
                                    unidadesMedida.find(u => u.id === formData.unidad_medida_id)?.nombre === "Kilogramos"}
                            />
                            {(unidadesMedida.find(u => u.id === formData.unidad_medida_id)?.nombre === "Litros" ||
                                unidadesMedida.find(u => u.id === formData.unidad_medida_id)?.nombre === "Kilogramos") && (
                                    <p className="text-xs text-muted-foreground">
                                        Para Litros y Kilogramos, la cantidad por lote es siempre 1
                                    </p>
                                )}
                        </div>

                        {/* Precio Unitario */}
                        <div className="space-y-2">
                            <Label htmlFor="precio">Precio Unitario *</Label>
                            <Input
                                id="precio"
                                type="number"
                                min="1"
                                placeholder="Ej: 1500"
                                value={formData.precio_unitario === 0 ? '' : formData.precio_unitario}
                                onChange={(e) => setFormData({ ...formData, precio_unitario: Number(e.target.value) })}
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormData({
                                    nombre: '',
                                    categoria_id: 0,
                                    unidad_medida_id: 0,
                                    cantidad_por_lote: 1,
                                    precio_unitario: 0
                                })}
                                disabled={loading}
                            >
                                Limpiar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? "Registrando..." : "Registrar Producto"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
