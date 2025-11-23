import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Login } from "../api/api";
import { userStore } from "../store/user";
import { toast } from 'sonner'

// Interfaz para el formulario (lo que ve el usuario)
interface LoginForm {
    rut: string;
    password: string; // Cambiado a 'password' para que coincida con el backend
}

function LoginPage() {
    const loginUser = userStore((state) => state.login);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>();

    // Función para redirigir según el cargo
    const redirectBasedOnRole = (cargo: number) => {
        switch (cargo) {
            case 1:
                navigate("/bodeguero");
                break;
            case 2:
                navigate("/jefebodega");
                break;
            case 3:
                navigate("/auditor");
                break;
            default:
                navigate("/administrador"); // Ruta por defecto
                break;
        }
    };

    const onSubmit = handleSubmit(async (data) => {
        try {
            const rest = await Login(data);
            if (rest.status === 200) {
                const { token, cargo, nombre, apellido } = rest.data;
                loginUser({ token, cargo: cargo, nombre, apellido }); // Asegúrate de que `user.role` sea el tipo de usuario
                redirectBasedOnRole(cargo);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error);
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="bg-white p-8 rounded-2xl shadow-2xl  border-black  w-full max-w-md mx-auto text-center animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                    <h1 className="text-4xl font-extrabold mb-1 text-black tracking-tight">Bienvenido</h1>
                    <p className="text-gray-700 text-base">Accede al sistema de inventario</p>
                </div>
                <form className="text-black space-y-4" onSubmit={onSubmit}>
                    <div className="text-left">
                        <label className="block mb-2 font-semibold text-black" htmlFor="rut">RUT</label>
                        <input
                            {...register("rut", { required: "Este campo es requerido" })}
                            placeholder="Ej: 12345678-9"
                            type="text"
                            id="rut"
                            name="rut"
                            className="w-full p-2 rounded-lg border border-black focus:border-black focus:ring-2 focus:ring-black transition bg-white text-black"
                        />
                        {errors.rut && <span className="text-red-500 text-sm">{errors.rut.message}</span>}
                    </div>
                    <div className="text-left">
                        <label className="block mb-2 font-semibold text-black" htmlFor="password">Contraseña</label>
                        <input
                            {...register("password", { required: "Este campo es requerido" })}
                            placeholder="Contraseña"
                            type="password"
                            id="password"
                            name="password"
                            className="w-full p-2 rounded-lg border border-black focus:border-black focus:ring-2 focus:ring-black transition bg-white text-black"
                        />
                        {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                    </div>
                    <Button type="submit" className="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors w-full shadow-md">
                        Iniciar Sesión
                    </Button>
                </form>
                <div className="mt-4">
                    <Button
                        type="button"
                        onClick={() => navigate("/recuperar-password")}
                        variant="outline"
                        className="bg-white text-black font-bold py-2 px-4 rounded-lg border border-black hover:bg-gray-100 transition-colors w-full shadow-md"
                    >
                        ¿Olvidaste tu contraseña?
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default LoginPage;