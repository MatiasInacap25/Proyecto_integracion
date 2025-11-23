import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

// Interfaz para las credenciales que se envían al backend
export interface LoginCredentials {
    rut: string;
    password: string; // El backend espera 'password', no 'contraseña'
}

// Interfaz para la respuesta que devuelve el backend
export interface LoginResponse {
    token: string;
    cargo: number;
    nombre: string;
    apellido: string;
}

// Interfaz para los datos del producto que se envían al backend


export const Login = (credentials: LoginCredentials) => {
    return api.post<LoginResponse>("auth/login/", credentials);
};

export const Logout = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "auth/logout/",
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
};

export const SolicitarRecuperacionPassword = (rut: string) => {
    return api.post("auth/solicitar-recuperacion/", { rut });
};

export const ResetearPassword = (token: string, password: string) => {
    return api.post("auth/resetear-password/", { token, password });
};

export const ingresoproductodata = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/formulario-ingreso/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const productosData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/productos/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const proveedoresData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/proveedores/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const clientesData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/clientes/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const loteData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/lotes/",
        {
            headers: {
                Authorization: `Token ${token}`,    
            },
        }
    );
}

export const categoraisMermaData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/categorias-merma/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const inventarioData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/inventario/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const mermaData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/mermas/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const UsersData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/usuarios/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ConductoresData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/conductores/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const CrearPassword = (passwordData: { token: string; new_password: string }) => {
    return api.post(
        "establecer-password/",
        {
            token: passwordData.token,
            password: passwordData.new_password
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}

export const IngresosData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/ingresos/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const SalidasData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/salidas/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ProductosAdminData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/productos-admin/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const UnidadesMedidaData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/unidades-medida/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const CategoriasData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "data/categorias/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ProveedoresAdminData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "admin/proveedores/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ClientesAdminData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "admin/clientes/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ConductoresAdminData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "admin/conductores/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}