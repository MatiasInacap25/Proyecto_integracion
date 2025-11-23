import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RegistrarConductor } from '../api/adminapi'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"

interface FormData {
    nombre: string
    apellido: string
    rut: string
    telefono: string
    fecha_nacimiento: string
}

export default function FormConductor() {
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<FormData>()

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true)

            const response = await RegistrarConductor(data)

            if (response.data.success) {
                toast.success(response.data.message || "Conductor registrado correctamente")
                // Limpiar formulario
                reset()
                // Recargar la página después de 1.5 segundos
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                toast.error(response.data.message || "Error al registrar el conductor")
            }
        } catch (error: any) {
            console.error("Error al registrar conductor:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al registrar el conductor"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Obtener fecha máxima (18 años atrás)
    const getMaxDate = () => {
        const today = new Date()
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
        return maxDate.toISOString().split('T')[0]
    }

    // Obtener fecha mínima (100 años atrás)
    const getMinDate = () => {
        const today = new Date()
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
        return minDate.toISOString().split('T')[0]
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Conductor</CardTitle>
                    <CardDescription>
                        Completa los datos del conductor para registrarlo en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Advertencia */}
                    <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <TriangleAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> Verifica que los datos sean correctos antes de registrar.
                            El conductor debe ser mayor de 18 años para poder registrarse.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre *</Label>
                            <Input
                                id="nombre"
                                placeholder="Ej: Juan"
                                {...register("nombre", {
                                    required: "El nombre es requerido",
                                    minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres" }
                                })}
                            />
                            {errors.nombre && (
                                <p className="text-sm text-red-600">{errors.nombre.message}</p>
                            )}
                        </div>

                        {/* Apellido */}
                        <div className="space-y-2">
                            <Label htmlFor="apellido">Apellido *</Label>
                            <Input
                                id="apellido"
                                placeholder="Ej: Pérez"
                                {...register("apellido", {
                                    required: "El apellido es requerido",
                                    minLength: { value: 2, message: "El apellido debe tener al menos 2 caracteres" }
                                })}
                            />
                            {errors.apellido && (
                                <p className="text-sm text-red-600">{errors.apellido.message}</p>
                            )}
                        </div>

                        {/* RUT */}
                        <div className="space-y-2">
                            <Label htmlFor="rut">RUT *</Label>
                            <Input
                                id="rut"
                                placeholder="Ej: 12345678-9"
                                {...register("rut", {
                                    required: "El RUT es requerido",
                                    pattern: {
                                        value: /^[0-9]+-[0-9kK]{1}$/,
                                        message: "Formato de RUT inválido (Ej: 12345678-9)"
                                    }
                                })}
                            />
                            {errors.rut && (
                                <p className="text-sm text-red-600">{errors.rut.message}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                placeholder="Ej: +56987654321"
                                {...register("telefono", {
                                    pattern: {
                                        value: /^(\+?56)?[0-9]{9}$/,
                                        message: "Formato de teléfono inválido"
                                    }
                                })}
                            />
                            {errors.telefono && (
                                <p className="text-sm text-red-600">{errors.telefono.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Campo opcional
                            </p>
                        </div>

                        {/* Fecha de Nacimiento */}
                        <div className="space-y-2">
                            <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                            <Input
                                id="fecha_nacimiento"
                                type="date"
                                max={getMaxDate()}
                                min={getMinDate()}
                                {...register("fecha_nacimiento", {
                                    required: "La fecha de nacimiento es requerida"
                                })}
                                style={{
                                    colorScheme: 'light'
                                }}
                            />
                            {errors.fecha_nacimiento && (
                                <p className="text-sm text-red-600">{errors.fecha_nacimiento.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                El conductor debe ser mayor de 18 años
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => reset()}
                                disabled={loading}
                            >
                                Limpiar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? "Registrando..." : "Registrar Conductor"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
