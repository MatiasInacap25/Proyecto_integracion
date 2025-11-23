import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ResetearPassword } from "../api/api";
import { toast } from 'sonner'

interface ResetPasswordForm {
    password: string;
    confirmPassword: string;
}

function ResetPassword() {
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();
    // Eliminados: showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordForm>();

    const password = watch("password");

    // Validación igual que CrearPassword
    const validatePassword = (value: string) => {
        if (value.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres";
        }
        if (!/[A-Z]/.test(value)) {
            return "La contraseña debe contener al menos una letra mayúscula";
        }
        if (!/[0-9]/.test(value)) {
            return "La contraseña debe contener al menos un número";
        }
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(value)) {
            return "La contraseña debe contener al menos un carácter especial";
        }
        return true;
    };

    const onSubmit = handleSubmit(async (data) => {
        if (!token) {
            toast.error('Token de recuperación no válido');
            return;
        }

        try {
            const response = await ResetearPassword(token, data.password);
            if (response.data.success) {
                toast.success(response.data.message);
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al cambiar contraseña');
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-black w-full max-w-md mx-auto text-center animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-3xl font-bold text-black mb-2">Nueva Contraseña</h1>
                    <p className="text-black text-base">Ingresa tu nueva contraseña</p>
                </div>
                <form className="text-black space-y-4" onSubmit={onSubmit}>
                    <div className="text-left">
                        <label className="block mb-2 font-semibold text-black" htmlFor="password">Nueva Contraseña</label>
                        <Input
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
                        <Input
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
                        Cambiar Contraseña
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

export default ResetPassword;
