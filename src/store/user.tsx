import { create } from "zustand";

// Interfaz para los datos del login
interface LoginData {
    token: string;
    cargo: number;
    nombre: string;
    apellido: string;
}

// Interfaz para el estado del usuario
interface UserState {
    token: string;
    cargo: number;
    nombre: string;
    apellido: string;
}

// Interfaz completa del store (estado + acciones)
interface UserStore extends UserState {
    login: (data: LoginData) => void;
    logout: () => void;
}

// Función para obtener el estado inicial del almacenamiento local
const getInitialUserState = (): UserState => {
    const storedUser = localStorage.getItem("user");
    return storedUser
        ? JSON.parse(storedUser)
        : { token: "", cargo: 0, nombre: "", apellido: "" }; // Corregido: usar cargo en lugar de userType
};

export const userStore = create<UserStore>((set) => ({
    ...getInitialUserState(), // Carga el estado inicial desde localStorage
    login: (data: LoginData) => { // Corregido: usar LoginData en lugar de UserState
        const { token, cargo, nombre, apellido } = data;
        set({
            token: token,
            cargo: cargo,
            nombre: nombre,
            apellido: apellido,
        });

        // Guarda los datos en localStorage
        localStorage.setItem("user", JSON.stringify({ token, cargo, nombre, apellido }));
        console.log(token, cargo, nombre, apellido);
    },
    logout: () => {
        set({ token: "", cargo: 0, nombre: "", apellido: "" });
        localStorage.removeItem("user");
    }
}));

// Exporta la tienda para su uso
export const useUserStore = () => userStore((state) => state);