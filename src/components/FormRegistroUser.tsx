import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { RegistrarUsuario } from "@/api/adminapi"

// Interfaz para los datos del formulario
interface FormRegistroData {
    nombre: string
    apellido: string
    rut: string
    fecha_nacimiento: string
    email: string
    cargo: number
}

export default function FormRegistroUser() {
    const [loading, setLoading] = useState(false)
    const [cargoSeleccionado, setCargoSeleccionado] = useState<string>("")

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors }
    } = useForm<FormRegistroData>({
        mode: "onChange"
    })

    // Función para enviar el formulario
    const onSubmit = async (data: FormRegistroData) => {
        setLoading(true)

        try {
            // Preparar los datos en el formato requerido
            const userData = {
                nombre: data.nombre,
                apellido: data.apellido,
                fecha_nacimiento: data.fecha_nacimiento,
                rut: data.rut.toUpperCase(), // Convertir la K a mayúscula
                cargo: data.cargo,
                email: data.email
            }

            console.log("Enviando datos:", userData)

            // Llamar a la API
            await RegistrarUsuario(userData)

            toast.success("Usuario registrado correctamente")
            reset()
            setCargoSeleccionado("")

        } catch (error: any) {
            console.error("Error al registrar usuario:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al registrar el usuario"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <UserPlus className="h-6 w-6" />
                        <CardTitle>Registro de Usuario</CardTitle>
                    </div>
                    <CardDescription>
                        Complete el formulario para registrar un nuevo usuario en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre */}
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-sm font-medium">
                                    Nombre
                                </Label>
                                <Input
                                    id="nombre"
                                    placeholder="Ingrese el nombre"
                                    {...register("nombre", {
                                        required: "El nombre es requerido",
                                        minLength: {
                                            value: 2,
                                            message: "El nombre debe tener al menos 2 caracteres"
                                        }
                                    })}
                                    className={errors.nombre ? "border-red-500" : ""}
                                />
                                {errors.nombre && (
                                    <p className="text-sm text-red-600">{errors.nombre.message}</p>
                                )}
                            </div>

                            {/* Apellido */}
                            <div className="space-y-2">
                                <Label htmlFor="apellido" className="text-sm font-medium">
                                    Apellido
                                </Label>
                                <Input
                                    id="apellido"
                                    placeholder="Ingrese el apellido"
                                    {...register("apellido", {
                                        required: "El apellido es requerido",
                                        minLength: {
                                            value: 2,
                                            message: "El apellido debe tener al menos 2 caracteres"
                                        }
                                    })}
                                    className={errors.apellido ? "border-red-500" : ""}
                                />
                                {errors.apellido && (
                                    <p className="text-sm text-red-600">{errors.apellido.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* RUT */}
                            <div className="space-y-2">
                                <Label htmlFor="rut" className="text-sm font-medium">
                                    RUT
                                </Label>
                                <Input
                                    id="rut"
                                    placeholder="12345678-9"
                                    {...register("rut", {
                                        required: "El RUT es requerido",
                                        pattern: {
                                            value: /^[0-9]{8}[-][0-9kK]{1}$/,
                                            message: "El RUT debe tener 8 dígitos, un guión y un dígito verificador (ej: 12345678-9)"
                                        },
                                        setValueAs: (value) => value.toUpperCase() // Convertir K a mayúscula
                                    })}
                                    onChange={(e) => {
                                        e.target.value = e.target.value.toUpperCase()
                                        register("rut").onChange(e)
                                    }}
                                    className={errors.rut ? "border-red-500" : ""}
                                />
                                {errors.rut && (
                                    <p className="text-sm text-red-600">{errors.rut.message}</p>
                                )}
                            </div>

                            {/* Fecha de Nacimiento */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_nacimiento" className="text-sm font-medium">
                                    Fecha de Nacimiento
                                </Label>
                                <Input
                                    id="fecha_nacimiento"
                                    type="date"
                                    {...register("fecha_nacimiento", {
                                        required: "La fecha de nacimiento es requerida",
                                        validate: value => {
                                            if (value && new Date(value) >= new Date()) {
                                                return "Debe ser una fecha pasada";
                                            }

                                            // Validar edad mínima de 18 años
                                            if (value) {
                                                const fechaNacimiento = new Date(value);
                                                const fechaActual = new Date();
                                                const edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
                                                const mesActual = fechaActual.getMonth();
                                                const mesNacimiento = fechaNacimiento.getMonth();

                                                // Ajustar si no ha cumplido años este año
                                                const edadReal = (mesActual < mesNacimiento ||
                                                    (mesActual === mesNacimiento && fechaActual.getDate() < fechaNacimiento.getDate()))
                                                    ? edad - 1 : edad;

                                                if (edadReal < 18) {
                                                    return "Debe ser mayor de 18 años";
                                                }
                                            }

                                            const fechaNacimiento = new Date(value);
                                            const fechaMinima = new Date();
                                            fechaMinima.setFullYear(fechaMinima.getFullYear() - 120);
                                            if (value && fechaNacimiento < fechaMinima) {
                                                return "Fecha de nacimiento no válida";
                                            }
                                            return true;
                                        }
                                    })}
                                    className={errors.fecha_nacimiento ? "border-red-500" : ""}
                                    style={{
                                        colorScheme: 'light'
                                    }}
                                />
                                {errors.fecha_nacimiento && (
                                    <p className="text-sm text-red-600">{errors.fecha_nacimiento.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Correo Electrónico */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Correo Electrónico
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                {...register("email", {
                                    required: "El correo electrónico es requerido",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Formato de correo electrónico inválido"
                                    }
                                })}
                                className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Cargo */}
                        <div className="space-y-2">
                            <Label htmlFor="cargo" className="text-sm font-medium">
                                Cargo
                            </Label>
                            <Select
                                value={cargoSeleccionado}
                                onValueChange={(value) => {
                                    setValue("cargo", parseInt(value), { shouldValidate: true })
                                    setCargoSeleccionado(value)
                                }}
                            >
                                <SelectTrigger className={errors.cargo ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Seleccione un cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Bodeguero</SelectItem>
                                    <SelectItem value="2">Jefe de bodega</SelectItem>
                                    <SelectItem value="3">Auditor</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Campo oculto para el cargo */}
                            <input type="hidden" {...register("cargo", { required: "El cargo es requerido" })} />
                            {errors.cargo && (
                                <p className="text-sm text-red-600">{errors.cargo.message}</p>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset()
                                    setCargoSeleccionado("")
                                }}
                                disabled={loading}
                            >
                                Limpiar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="min-w-[120px]"
                            >
                                {loading ? "Registrando..." : "Registrar Usuario"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}