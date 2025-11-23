import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RegistrarCliente } from '../api/adminapi'
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

interface FormData {
    nombre: string
    rut: string
    telefono: string
    direccion: string
    email: string
    es_persona_juridica: boolean
}

const regionesChile = [
    "Región de Arica y Parinacota",
    "Región de Tarapacá",
    "Región de Antofagasta",
    "Región de Atacama",
    "Región de Coquimbo",
    "Región de Valparaíso",
    "Región Metropolitana de Santiago",
    "Región del Libertador General Bernardo O'Higgins",
    "Región del Maule",
    "Región de Ñuble",
    "Región del Biobío",
    "Región de La Araucanía",
    "Región de Los Ríos",
    "Región de Los Lagos",
    "Región de Aysén del General Carlos Ibáñez del Campo",
    "Región de Magallanes y de la Antártica Chilena"
]

export default function FormCliente() {
    const [loading, setLoading] = useState(false)
    const [tipoPersona, setTipoPersona] = useState<string>("")
    const [regionSeleccionada, setRegionSeleccionada] = useState<string>("")

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<FormData>()

    const onSubmit = async (data: FormData) => {
        // Validar que se haya seleccionado el tipo de persona
        if (tipoPersona === "") {
            toast.error("Debes seleccionar el tipo de persona")
            return
        }

        // Validar que se haya seleccionado una región
        if (regionSeleccionada === "") {
            toast.error("Debes seleccionar una región")
            return
        }

        try {
            setLoading(true)

            // Construir dirección completa con región
            const direccionCompleta = `${data.direccion}, ${regionSeleccionada}`

            const clienteData = {
                ...data,
                direccion: direccionCompleta,
                es_persona_juridica: tipoPersona === "juridica"
            }

            const response = await RegistrarCliente(clienteData)

            if (response.data.success) {
                toast.success(response.data.message || "Cliente registrado correctamente")
                // Limpiar formulario
                reset()
                setTipoPersona("")
                setRegionSeleccionada("")
                // Recargar la página después de 1.5 segundos
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                toast.error(response.data.message || "Error al registrar el cliente")
            }
        } catch (error: any) {
            console.error("Error al registrar cliente:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al registrar el cliente"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Cliente</CardTitle>
                    <CardDescription>
                        Completa los datos del cliente para registrarlo en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Advertencia */}
                    <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <TriangleAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> Verifica que los datos sean correctos antes de registrar.
                            Una vez registrado, el cliente podrá ser desactivado o editado.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Tipo de Persona */}
                        <div className="space-y-2">
                            <Label htmlFor="tipoPersona">Tipo de Persona *</Label>
                            <Select
                                value={tipoPersona}
                                onValueChange={(value) => setTipoPersona(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el tipo de persona" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="natural">Persona Natural</SelectItem>
                                    <SelectItem value="juridica">Persona Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">
                                {tipoPersona === "juridica" ? "Razón Social *" : "Nombre Completo *"}
                            </Label>
                            <Input
                                id="nombre"
                                placeholder={tipoPersona === "juridica" ? "Ej: Empresa XYZ S.A." : "Ej: María González López"}
                                {...register("nombre", {
                                    required: "El nombre es requerido",
                                    minLength: { value: 3, message: "El nombre debe tener al menos 3 caracteres" }
                                })}
                            />
                            {errors.nombre && (
                                <p className="text-sm text-red-600">{errors.nombre.message}</p>
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
                            <Label htmlFor="telefono">Teléfono *</Label>
                            <Input
                                id="telefono"
                                placeholder="Ej: +56987654321"
                                {...register("telefono", {
                                    required: "El teléfono es requerido",
                                    pattern: {
                                        value: /^(\+?56)?[0-9]{9}$/,
                                        message: "Formato de teléfono inválido"
                                    }
                                })}
                            />
                            {errors.telefono && (
                                <p className="text-sm text-red-600">{errors.telefono.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Ej: cliente@email.com"
                                {...register("email", {
                                    required: "El email es requerido",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Email inválido"
                                    }
                                })}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Región */}
                        <div className="space-y-2">
                            <Label htmlFor="region">Región *</Label>
                            <Select
                                value={regionSeleccionada}
                                onValueChange={(value) => setRegionSeleccionada(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una región" />
                                </SelectTrigger>
                                <SelectContent>
                                    {regionesChile.map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dirección */}
                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección *</Label>
                            <Input
                                id="direccion"
                                placeholder="Ej: Avenida Principal 123"
                                {...register("direccion", {
                                    required: "La dirección es requerida",
                                    minLength: { value: 5, message: "La dirección debe tener al menos 5 caracteres" }
                                })}
                            />
                            {errors.direccion && (
                                <p className="text-sm text-red-600">{errors.direccion.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Se agregará automáticamente la región seleccionada
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset()
                                    setTipoPersona("")
                                    setRegionSeleccionada("")
                                }}
                                disabled={loading}
                            >
                                Limpiar
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? "Registrando..." : "Registrar Cliente"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
