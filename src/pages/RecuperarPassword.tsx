import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { SolicitarRecuperacionPassword } from "../api/api";
import { toast } from 'sonner'

interface RecuperarPasswordForm {
    rut: string;
}

function RecuperarPassword() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RecuperarPasswordForm>();

    const onSubmit = handleSubmit(async (data) => {
        try {
            const response = await SolicitarRecuperacionPassword(data.rut);
            if (response.data.success) {
                toast.success(response.data.message);
                setTimeout(() => {
                    navigate("/");
                }, 3000);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al solicitar recuperación');
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="bg-white p-8 rounded-2xl shadow-xl  border-black w-full max-w-md mx-auto text-center animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-3xl font-bold text-black mb-2">Recuperar Contraseña</h1>
                    <p className="text-black text-base">Ingresa tu RUT y te enviaremos un correo para restablecer tu contraseña</p>
                </div>
                <form className="text-black space-y-4" onSubmit={onSubmit}>
                    <div className="text-left">
                        <label className="block mb-2 font-semibold text-black" htmlFor="rut">RUT</label>
                        <Input
                            {...register("rut", {
                                required: "El RUT es requerido",
                                pattern: {
                                    value: /^\d{7,8}-[\dkK]$/,
                                    message: "Formato de RUT inválido (ej: 12345678-9)"
                                }
                            })}
                            placeholder="Ej: 12345678-9"
                            type="text"
                            id="rut"
                            className="w-full rounded-lg border border-black focus:border-black focus:ring-2 focus:ring-black transition"
                        />
                        {errors.rut && (
                            <span className="text-black text-sm">{errors.rut.message}</span>
                        )}
                    </div>
                    <Button type="submit" className="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-neutral-800 transition-colors w-full shadow-md border border-black">
                        Enviar Correo de Recuperación
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

export default RecuperarPassword;
