import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

export const DesactivarUsuario = (idUsuario: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        `admin/usuarios/${idUsuario}/desactivar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
};

export const ActivarUsuario = (idUsuario: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        `admin/usuarios/${idUsuario}/activar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
};

export const RegistrarUsuario = (userData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "admin/usuarios/registrar/",
        userData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const EliminarIngreso = (idIngreso: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.delete(
        `admin/ingresos/${idIngreso}/eliminar/`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const EliminarSalida = (idSalida: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.delete(
        `admin/salidas/${idSalida}/eliminar/`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const EliminarMerma = (idMerma: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.delete(
        `admin/mermas/${idMerma}/eliminar/`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const DesacativarProducto = (idProducto: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        `admin/productos/${idProducto}/desactivar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ActivarProducto = (idProducto: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        `admin/productos/${idProducto}/activar/`,
        {},
        {
            headers: { 
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const EditarProducto = (idProducto: number, productoData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/productos/${idProducto}/editar/`,
        productoData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const RegistrarProducto = (productoData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "admin/productos/crear/",
        productoData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const RegistrarProveedor = (proveedorData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "admin/proveedores/registrar/",
        proveedorData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const ActivarProveedor = (idProveedor: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/proveedores/${idProveedor}/activar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const DesactivarProveedor = (idProveedor: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/proveedores/${idProveedor}/desactivar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const RegistrarCliente = (clienteData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "admin/clientes/registrar/",
        clienteData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const RegistrarConductor = (conductorData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "admin/conductores/registrar/",
        conductorData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const ActivarCliente = (idCliente: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/clientes/${idCliente}/activar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const DesactivarCliente = (idCliente: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/clientes/${idCliente}/desactivar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ActivarConductor = (idConductor: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/conductores/${idConductor}/activar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const DesactivarConductor = (idConductor: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/conductores/${idConductor}/desactivar/`,
        {},
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const EditarProveedor = (idProveedor: number, proveedorData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/proveedores/${idProveedor}/editar/`,
        proveedorData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const EditarCliente = (idCliente: number, clienteData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/clientes/${idCliente}/editar/`,
        clienteData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const EditarConductor = (idConductor: number, conductorData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/conductores/${idConductor}/editar/`,
        conductorData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const ComparacionMermasMensual = (year?: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    const params = year ? `?year=${year}` : ''
    return api.get(
        `admin/mermas/comparacion-mensual/${params}`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ComparacionMermasCategorias = (categoria1: number, categoria2: number, fechaInicio: string, fechaFin: string) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        `admin/mermas/comparacion-categorias/?categoria1=${categoria1}&categoria2=${categoria2}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

// =============== GESTIÓN DE STOCK MÍNIMO ===============

export const ObtenerStocksMinimos = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        'admin/stocks-minimos/',
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const CrearStockMinimo = (stockData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        'admin/stocks-minimos/crear/',
        stockData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const EditarStockMinimo = (stockId: number, stockData: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.put(
        `admin/stocks-minimos/${stockId}/editar/`,
        stockData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const EliminarStockMinimo = (stockId: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.delete(
        `admin/stocks-minimos/${stockId}/eliminar/`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ObtenerHistorialBlockchain = (params?: any) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    const query = params ? Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&') : ''
    const suffix = query ? `blockchain/historial/?${query}` : 'blockchain/historial/'
    return api.get(
        suffix,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const ObtenerHistorialBlockchainProducto = (productoId: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        `blockchain/historial/${productoId}/`,
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}
