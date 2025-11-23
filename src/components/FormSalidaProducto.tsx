import { Button } from "@/components/ui/button";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { clientesData, loteData, ConductoresData } from "../api/api";
import Select from 'react-select';
import { toast } from 'sonner';
import { SalidaProducto } from "../api/bodegueroapi";

// Interfaces para los datos de la API
interface Cliente {
    id: number;
    nombre: string;
}

interface Conductor {
    id: number;
    nombre: string;
    apellido: string;
    rut: string;
}

interface Lote {
    id: number;
    codigo_lote: string;
    cantidad: number;
    producto_nombre: string;
}

// Interfaces para las respuestas de la API
interface ClientesResponse {
    success: boolean;
    clientes: Cliente[];
}

interface ConductoresResponse {
    success: boolean;
    conductores: Conductor[];
}

interface LotesResponse {
    success: boolean;
    lotes: Lote[];
}

// Interfaces para opciones de React Select
interface OptionType {
    value: number;
    label: string;
}

interface LoteOptionType extends OptionType {
    stock: number;
    codigo: string;
    producto: string;
}

// Interfaz para cada producto en la salida
interface ProductoSalida {
    lote_id: number | "";
    cantidad_lotes: number | "";
}

// Interfaz para el formulario completo
interface SalidaProductoForm {
    cliente_id: number | "";
    conductor_id: number | "";
    descripcion: string;
    productos: ProductoSalida[];
}

export default function FormSalidaProducto() {
    // Estado para los datos de la API (mantenemos para la función getLoteInfo)
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Opciones formateadas para React Select
    const [clienteOptions, setClienteOptions] = useState<OptionType[]>([]);
    const [conductorOptions, setConductorOptions] = useState<OptionType[]>([]);
    const [loteOptions, setLoteOptions] = useState<LoteOptionType[]>([]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
        reset
    } = useForm<SalidaProductoForm>({
        defaultValues: {
            cliente_id: "",
            conductor_id: "",
            descripcion: "",
            productos: [
                { lote_id: "", cantidad_lotes: "" }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "productos"
    });

    const watchedProductos = watch("productos");

    // Cargar datos de la API al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    // Función para cargar datos de clientes y lotes
    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Llamar a las tres funciones por separado
            const [clientesResponse, conductoresResponse, lotesResponse] = await Promise.all([
                clientesData(),
                ConductoresData(),
                loteData()
            ]);

            console.log("Clientes cargados:", clientesResponse.data);
            console.log("Conductores cargados:", conductoresResponse.data);
            console.log("Lotes cargados:", lotesResponse.data);

            // Extraer los datos de la respuesta
            const clientesResult: ClientesResponse = clientesResponse.data;
            const conductoresResult: ConductoresResponse = conductoresResponse.data;
            const lotesResult: LotesResponse = lotesResponse.data;

            // Verificar que las respuestas sean exitosas y extraer los arrays
            if (clientesResult.success && Array.isArray(clientesResult.clientes)) {
                // Formatear opciones para React Select
                const clientesFormatted = clientesResult.clientes.map(cliente => ({
                    value: cliente.id,
                    label: cliente.nombre
                }));
                setClienteOptions(clientesFormatted);
            } else {
                console.error("Error en respuesta de clientes:", clientesResult);
                setClienteOptions([]);
                setError("Error al cargar clientes");
            }

            if (conductoresResult.success && Array.isArray(conductoresResult.conductores)) {
                // Formatear opciones para React Select
                const conductoresFormatted = conductoresResult.conductores.map(conductor => ({
                    value: conductor.id,
                    label: `${conductor.nombre} ${conductor.apellido} - ${conductor.rut}`
                }));
                setConductorOptions(conductoresFormatted);
            } else {
                console.error("Error en respuesta de conductores:", conductoresResult);
                setConductorOptions([]);
                setError("Error al cargar conductores");
            }

            if (lotesResult.success && Array.isArray(lotesResult.lotes)) {
                setLotes(lotesResult.lotes);
                // Formatear opciones para React Select
                const lotesFormatted = lotesResult.lotes.map(lote => ({
                    value: lote.id,
                    label: `${lote.producto_nombre} - ${lote.codigo_lote} (Stock: ${lote.cantidad})`,
                    stock: lote.cantidad,
                    codigo: lote.codigo_lote,
                    producto: lote.producto_nombre
                }));
                setLoteOptions(lotesFormatted);
            } else {
                console.error("Error en respuesta de lotes:", lotesResult);
                setLotes([]);
                setLoteOptions([]);
                setError("Error al cargar lotes");
            }

        } catch (err) {
            console.error("Error al cargar datos:", err);
            setError("Error de conexión al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = handleSubmit(async (data: SalidaProductoForm) => {
        // Filtrar productos vacíos (sin lote_id seleccionado)
        const productosValidos = data.productos.filter(p => p.lote_id !== "");

        const dataToSend = {
            cliente_id: Number(data.cliente_id), // Convertir a número
            conductor_id: Number(data.conductor_id), // Convertir a número
            bodega_id: 1, // Valor fijo por ahora, puedes cambiarlo según sea necesario
            productos: productosValidos.map(p => ({
                lote_id: Number(p.lote_id), // Convertir a número
                cantidad_lotes: Number(p.cantidad_lotes) // Convertir a número
            })),
            descripcion: data.descripcion
        };

        console.log("Datos a enviar:", JSON.stringify(dataToSend, null, 2));

        try {
            const rest = await SalidaProducto(dataToSend);
            console.log("Respuesta de la API:", rest);
            if (rest.status === 201) {
                toast.success("Salida de productos registrada exitosamente");
                reset();
                // Recargar los datos de lotes para mostrar el stock actualizado
                console.log("Recargando datos de lotes...");
                await cargarDatos();
            } else {
                toast.error("Error al registrar la salida de productos");
                console.error("Respuesta inesperada:", rest);
            }
        } catch (error) {
            alert("Error al registrar la salida");
            console.error("Error al registrar salida:", error);
        }
    });

    const agregarProducto = () => {
        if (fields.length < 10) {
            append({ lote_id: "", cantidad_lotes: "" });
        }
    };

    const eliminarProducto = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    // Función para obtener la información del lote seleccionado
    const getLoteInfo = (loteId: number | "") => {
        if (loteId === "") return null;
        return lotes.find(lote => lote.id === loteId);
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Salida de Productos</h1>
                    <p className="text-gray-600 mt-2">Registra la salida de productos a clientes</p>
                </div>

                {/* Error de carga */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Formulario */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={onSubmit} className="space-y-6">
                        {/* Información General */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Información General</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Cliente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="cliente_id">
                                        Cliente
                                    </label>
                                    <Controller
                                        name="cliente_id"
                                        control={control}
                                        rules={{
                                            required: "Debe seleccionar un cliente",
                                            validate: value => value !== "" || "Debe seleccionar un cliente"
                                        }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                options={clienteOptions}
                                                placeholder={loading ? "Cargando clientes..." : "Buscar y seleccionar cliente..."}
                                                isLoading={loading}
                                                isDisabled={loading}
                                                isSearchable
                                                isClearable
                                                value={clienteOptions.find(option => option.value === field.value) || null}
                                                onChange={(selectedOption) => field.onChange(selectedOption?.value || "")}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={{
                                                    control: (provided) => ({
                                                        ...provided,
                                                        borderColor: '#d1d5db',
                                                        '&:hover': {
                                                            borderColor: '#d1d5db'
                                                        },
                                                        boxShadow: 'none',
                                                        '&:focus': {
                                                            borderColor: '#3b82f6',
                                                            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                                                        }
                                                    })
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.cliente_id && (
                                        <span className="text-red-500 text-sm mt-1">{errors.cliente_id.message}</span>
                                    )}
                                </div>

                                {/* Conductor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="conductor_id">
                                        Conductor
                                    </label>
                                    <Controller
                                        name="conductor_id"
                                        control={control}
                                        rules={{
                                            required: "Debe seleccionar un conductor",
                                            validate: value => value !== "" || "Debe seleccionar un conductor"
                                        }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                options={conductorOptions}
                                                placeholder={loading ? "Cargando conductores..." : "Buscar y seleccionar conductor..."}
                                                isLoading={loading}
                                                isDisabled={loading}
                                                isSearchable
                                                isClearable
                                                value={conductorOptions.find(option => option.value === field.value) || null}
                                                onChange={(selectedOption) => field.onChange(selectedOption?.value || "")}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={{
                                                    control: (provided) => ({
                                                        ...provided,
                                                        borderColor: '#d1d5db',
                                                        '&:hover': {
                                                            borderColor: '#d1d5db'
                                                        },
                                                        boxShadow: 'none',
                                                        '&:focus': {
                                                            borderColor: '#3b82f6',
                                                            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                                                        }
                                                    })
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.conductor_id && (
                                        <span className="text-red-500 text-sm mt-1">{errors.conductor_id.message}</span>
                                    )}
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="descripcion">
                                        Descripción
                                    </label>
                                    <input
                                        {...register("descripcion", {
                                            required: "La descripción es requerida"
                                        })}
                                        type="text"
                                        id="descripcion"
                                        placeholder="Ej: Venta de productos"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.descripcion && (
                                        <span className="text-red-500 text-sm mt-1">{errors.descripcion.message}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Productos */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Productos</h2>
                                <Button
                                    type="button"
                                    onClick={agregarProducto}
                                    disabled={fields.length >= 10}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
                                >
                                    + Agregar Producto ({fields.length}/10)
                                </Button>
                            </div>

                            {fields.map((field, index) => {
                                const isLoteSelected = watchedProductos[index]?.lote_id !== "";
                                const loteInfo = getLoteInfo(watchedProductos[index]?.lote_id);

                                return (
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-medium text-gray-700">Producto {index + 1}</h3>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    onClick={() => eliminarProducto(index)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                                                >
                                                    Eliminar
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Lote */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Lote
                                                </label>
                                                <Controller
                                                    name={`productos.${index}.lote_id`}
                                                    control={control}
                                                    rules={{
                                                        validate: value => {
                                                            // Si hay cantidad, el lote es requerido
                                                            const producto = watchedProductos[index];
                                                            if (producto?.cantidad_lotes && value === "") {
                                                                return "Debe seleccionar un lote";
                                                            }
                                                            return true;
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            {...field}
                                                            options={loteOptions}
                                                            placeholder={loading ? "Cargando lotes..." : "Buscar y seleccionar lote..."}
                                                            isLoading={loading}
                                                            isDisabled={loading}
                                                            isSearchable
                                                            isClearable
                                                            value={loteOptions.find(option => option.value === field.value) || null}
                                                            onChange={(selectedOption) => field.onChange(selectedOption?.value || "")}
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            styles={{
                                                                control: (provided) => ({
                                                                    ...provided,
                                                                    borderColor: '#d1d5db',
                                                                    '&:hover': {
                                                                        borderColor: '#d1d5db'
                                                                    },
                                                                    boxShadow: 'none',
                                                                    '&:focus': {
                                                                        borderColor: '#3b82f6',
                                                                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                                                                    }
                                                                })
                                                            }}
                                                        />
                                                    )}
                                                />
                                                {errors.productos?.[index]?.lote_id && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.lote_id?.message}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Cantidad de Lotes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cantidad
                                                    {loteInfo && (
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            (Stock disponible: {loteInfo.cantidad})
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    {...register(`productos.${index}.cantidad_lotes`, {
                                                        validate: value => {
                                                            const stringValue = String(value);
                                                            const numValue = Number(value);

                                                            if (isLoteSelected && (!value || stringValue === "" || isNaN(numValue) || numValue === 0)) {
                                                                return "Este campo es requerido";
                                                            }

                                                            if (value && numValue <= 0) {
                                                                return "Debe ser mayor a 0";
                                                            }

                                                            if (value && !Number.isInteger(numValue)) {
                                                                return "Debe ser un número entero";
                                                            }

                                                            // Validar que no exceda el stock disponible
                                                            if (loteInfo && numValue > loteInfo.cantidad) {
                                                                return `No puede exceder el stock disponible (${loteInfo.cantidad})`;
                                                            }

                                                            return true;
                                                        }
                                                    })}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="10"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {errors.productos?.[index]?.cantidad_lotes && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.cantidad_lotes?.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Información adicional del lote */}
                                        {loteInfo && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Producto:</strong> {loteInfo.producto_nombre} |
                                                    <strong> Código:</strong> {loteInfo.codigo_lote} |
                                                    <strong> Stock:</strong> {loteInfo.cantidad}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 pt-6 border-t">
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md"
                            >
                                Registrar Salida
                            </Button>
                            <Button
                                type="button"
                                onClick={() => reset()}
                                variant="outline"
                                className="flex-1 py-3 px-6 rounded-md"
                            >
                                Limpiar Formulario
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
