import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { MermasPendientesData } from "../api/jefebodegaapi"
import { CalendarIcon, UserIcon, AlertCircleIcon, PackageIcon } from "lucide-react"
import { AprobarMerma, RechazarMerma } from "../api/jefebodegaapi"
import { toast } from 'sonner'

interface DetalleMerma {
    lote_codigo: string;
    producto_nombre: string;
    cantidad_merma: number;
    valor_merma: number;
}

interface UsuarioRegistro {
    nombre: string;
    apellido: string;
}

interface MermaPendiente {
    id: number;
    fecha: string;
    hora: string;
    categoria_merma: string;
    estado: string;
    observaciones_registro: string;
    usuario_registro: UsuarioRegistro;
    detalles_merma: DetalleMerma[];
    valor_total_merma: number;
}

interface MermasResponse {
    success: boolean;
    mermas_pendientes: MermaPendiente[];
}

export default function MermasPendientes() {
    const [mermas, setMermas] = useState<MermaPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingMerma, setProcessingMerma] = useState<number | null>(null);

    useEffect(() => {
        cargarMermasPendientes();
    }, []);

    const cargarMermasPendientes = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await MermasPendientesData();
            const data: MermasResponse = response.data;

            if (data.success) {
                setMermas(data.mermas_pendientes);
            } else {
                setError("Error al cargar las mermas pendientes");
            }
        } catch (err) {
            setError("Error de conexión al cargar las mermas");
            console.error("Error al cargar mermas:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatearMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(valor);
    };

    const handleAprobarMerma = async (mermaId: number) => {
        try {
            setProcessingMerma(mermaId);
            const response = await AprobarMerma(mermaId);

            if (response.status === 200) {
                toast.success("Merma aprobada exitosamente");
                // Recargar inmediatamente
                cargarMermasPendientes();
            } else {
                toast.error("Error al aprobar la merma");
            }
        } catch (error) {
            toast.error("Error al aprobar la merma");
            console.error("Error al aprobar merma:", error);
        } finally {
            setProcessingMerma(null);
        }
    };

    const handleRechazarMerma = async (mermaId: number) => {
        try {
            setProcessingMerma(mermaId);
            const response = await RechazarMerma(mermaId);

            if (response.status === 200) {
                toast.success("Merma rechazada exitosamente");
                // Recargar inmediatamente
                cargarMermasPendientes();
            } else {
                toast.error("Error al rechazar la merma");
            }
        } catch (error) {
            toast.error("Error al rechazar la merma");
            console.error("Error al rechazar merma:", error);
        } finally {
            setProcessingMerma(null);
        }
    }; if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <p className="text-gray-600">Cargando mermas pendientes...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <strong>Error:</strong> {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Mermas Pendientes de Aprobación</h1>
                    <p className="text-gray-600 mt-2">Revisa y gestiona las mermas que requieren aprobación</p>
                </div>

                {/* Lista de Mermas */}
                <div className="flex w-full flex-col gap-4">
                    {mermas.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <PackageIcon className="size-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No hay mermas pendientes</h3>
                            <p className="text-gray-500">Todas las mermas han sido procesadas</p>
                        </div>
                    ) : (
                        mermas.map((merma, index) => (
                            <Item key={index} variant="outline" className="bg-white shadow-md">
                                <ItemMedia>
                                    <AlertCircleIcon className="size-6 text-orange-500" />
                                </ItemMedia>
                                <ItemContent className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <ItemTitle className="text-lg font-semibold">
                                            Merma por {merma.categoria_merma}
                                        </ItemTitle>
                                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            {merma.estado}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <CalendarIcon className="size-4" />
                                            <span>{merma.fecha} - {merma.hora}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <UserIcon className="size-4" />
                                            <span>{merma.usuario_registro.nombre} {merma.usuario_registro.apellido}</span>
                                        </div>
                                    </div>

                                    <ItemDescription className="mb-3">
                                        <strong>Observaciones:</strong> {merma.observaciones_registro}
                                    </ItemDescription>

                                    {/* Detalles de productos */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700">Productos afectados:</h4>
                                        {merma.detalles_merma.map((detalle, detalleIndex) => (
                                            <div key={detalleIndex} className="bg-gray-50 p-3 rounded border">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                                    <div>
                                                        <span className="font-medium">Producto:</span>
                                                        <p>{detalle.producto_nombre}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Lote:</span>
                                                        <p>{detalle.lote_codigo}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Cantidad:</span>
                                                        <p>{detalle.cantidad_merma}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Valor:</span>
                                                        <p className="text-red-600 font-semibold">{formatearMoneda(detalle.valor_merma)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-2 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Valor Total de la Merma:</span>
                                            <span className="text-lg font-bold text-red-600">
                                                {formatearMoneda(merma.valor_total_merma)}
                                            </span>
                                        </div>
                                    </div>
                                </ItemContent>
                                <ItemActions className="flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleAprobarMerma(merma.id)}
                                        disabled={processingMerma === merma.id}
                                    >
                                        {processingMerma === merma.id ? "Aprobando..." : "Aprobar"}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRechazarMerma(merma.id)}
                                        disabled={processingMerma === merma.id}
                                    >
                                        {processingMerma === merma.id ? "Rechazando..." : "Rechazar"}
                                    </Button>
                                </ItemActions>
                            </Item>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
