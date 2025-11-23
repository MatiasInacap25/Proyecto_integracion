import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

export interface ingresoProductoData {
    proveedor_id: number | "";
    descripcion: string;
    productos: Array<{
        producto_id: number | "";
        cantidad_lotes: number | "";
        codigo_lote: string;
        fecha_vencimiento: string;
    }>;
}

export interface SalidaProductoData {
    cliente_id: number | "";
    descripcion: string;
    productos: Array<{
        lote_id: number | "";
        cantidad_lotes: number | "";
    }>;
}

export interface RegistroMermaData {
    categoria_merma_id: number | "";
    observaciones: string;
    productos: Array<{
        lote_id: number | "";
        cantidad_merma: number | "";
    }>;
}

export const IngresoProducto = (productData: ingresoProductoData) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "bodeguero/ingreso-producto/",
        productData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const SalidaProducto = (productData: SalidaProductoData) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "bodeguero/salida-producto/",
        productData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const RegistroMerma = (mermaData: RegistroMermaData) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "bodeguero/registro-merma/",
        mermaData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}