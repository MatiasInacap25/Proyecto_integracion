import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

export interface RegistroMermaData {
    categoria_merma_id: number | "";
    observaciones: string;
    productos: Array<{
        lote_id: number | "";
        cantidad_merma: number | "";
    }>;
}

export const RegistroMermaAprobada = (mermaData: RegistroMermaData) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        "jefe-bodega/registrar-merma-aprobada/",
        mermaData,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
}

export const MermasPendientesData = () => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.get(
        "jefe-bodega/mermas-pendientes/",
        {
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const AprobarMerma = (idMerma: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        `jefe-bodega/aprobar-merma/${idMerma}/`,
        {}, // ← Body vacío (segundo parámetro)
        {   // ← Configuración con headers (tercer parámetro)
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}

export const RechazarMerma = (idMerma: number) => {
    const token = JSON.parse(localStorage.getItem("user") || "{}").token
    return api.post(
        `jefe-bodega/rechazar-merma/${idMerma}/`,
        {}, // ← Body vacío (segundo parámetro)
        {   // ← Configuración con headers (tercer parámetro)
            headers: {
                Authorization: `Token ${token}`,
            },
        }
    );
}