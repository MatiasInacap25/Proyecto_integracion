import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { CrearPassword as CrearPasswordAPI } from "@/api/api";

interface CrearPasswordForm {
    password: string;
    confirmPassword: string;
}

export default function CrearPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset
    } = useForm<CrearPasswordForm>();

    const password = watch("password");

    // Validar que existe el token al cargar el componente
    useEffect(() => {
        if (!token) {
            toast.error("Token no válido o expirado");
            navigate("/login");
        }
    }, [token, navigate]);

    // Función para validar la contraseña
    const validatePassword = (value: string) => {
        // Al menos 8 caracteres
        if (value.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres";
        }

        // Al menos una mayúscula
        if (!/[A-Z]/.test(value)) {
            return "La contraseña debe contener al menos una letra mayúscula";
        }

        // Al menos un número
        if (!/[0-9]/.test(value)) {
            return "La contraseña debe contener al menos un número";
        }

        // Al menos un carácter especial
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
            return "La contraseña debe contener al menos un carácter especial";
        }

        return true;
    };

    const onSubmit = handleSubmit(async (data: CrearPasswordForm) => {
        if (!token) {
            toast.error("Token no válido");
            return;
        }

        try {
            // Preparar los datos en el formato requerido por la API
            const passwordData = {
                token: token,
                new_password: data.password
            };

            console.log("Enviando datos:", passwordData);

            // Llamar a la API
            const response = await CrearPasswordAPI(passwordData);

            // Verificar que la respuesta sea exitosa (status 200)
            if (response.status === 200) {
                toast.success("Contraseña creada exitosamente, redirigiendo al inicio de sesión...");
                reset();

                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (error: any) {
            console.error("Error al crear la contraseña:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Error al crear la contraseña";
            toast.error(errorMessage);
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-black w-full max-w-md mx-auto text-center animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-3xl font-bold text-black mb-2">Crear Contraseña</h1>
                    <p className="text-black text-base">Ingresa y confirma tu nueva contraseña</p>
                </div>
                <form className="text-black space-y-4" onSubmit={onSubmit}>
                    <div className="text-left">
                        <label className="block mb-2 font-semibold text-black" htmlFor="password">Nueva Contraseña</label>
                        <input
                            {...register("password", {
                                required: "La contraseña es requerida",
                                validate: validatePassword
                            })}
                            placeholder="Mínimo 8 caracteres, mayúscula, número y especial"
                            type="password"
                            id="password"
                            className="w-full rounded-lg border border-black focus:border-black focus:ring-2 focus:ring-black transition h-12 text-base"
                        />
                        {errors.password && (
                            <span className="text-black text-sm">{errors.password.message}</span>
                        )}
                    </div>
                    <div className="text-left">
                        <label className="block mb-2 font-semibold text-black" htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input
                            {...register("confirmPassword", {
                                required: "Debes confirmar la contraseña",
                                validate: value => value === password || "Las contraseñas no coinciden"
                            })}
                            placeholder="Repite la contraseña"
                            type="password"
                            id="confirmPassword"
                            className="w-full rounded-lg border border-black focus:border-black focus:ring-2 focus:ring-black transition h-12 text-base"
                        />
                        {errors.confirmPassword && (
                            <span className="text-black text-sm">{errors.confirmPassword.message}</span>
                        )}
                    </div>
                    <Button type="submit" className="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-neutral-800 transition-colors w-full shadow-md border border-black">
                        Crear Contraseña
                    </Button>
                </form>
                <div className="mt-4">
                    <Button
                        type="button"
                        onClick={() => navigate("/login")}
                        variant="outline"
                        className="bg-white text-black font-bold py-2 px-4 rounded-lg border border-black hover:bg-neutral-100 transition-colors w-full shadow-md"
                    >
                        Volver al login
                    </Button>
                </div>
            </div>
        </div>
    );
}