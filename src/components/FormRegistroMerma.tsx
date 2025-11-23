import { Button } from "@/components/ui/button";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { categoraisMermaData, loteData } from "../api/api";
import Select from 'react-select';
import { RegistroMerma } from "../api/bodegueroapi";
import { RegistroMermaAprobada } from "../api/jefebodegaapi";
import { toast } from 'sonner';
import { userStore } from "../store/user";

// Interfaces para los datos de la API
interface CategoriaMerma {
    id: number;
    nombre: string;
}

interface Lote {
    id: number;
    codigo_lote: string;
    cantidad: number;
    producto_nombre: string;
}

// Interfaces para las respuestas de la API
interface CategoriasResponse {
    success: boolean;
    categorias: CategoriaMerma[];
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

// Interfaz para cada producto en el registro de merma
interface ProductoMerma {
    lote_id: number | "";
    cantidad_merma: number | "";
}

// Interfaz para el formulario completo
interface RegistroMermaForm {
    categoria_merma_id: number | "";
    observaciones: string;
    productos: ProductoMerma[];
}

export default function FormRegistroMerma() {
    // Estado para los datos de la API (mantenemos para la función getLoteInfo)
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Opciones formateadas para React Select
    const [categoriaOptions, setCategoriaOptions] = useState<OptionType[]>([]);
    const [loteOptions, setLoteOptions] = useState<LoteOptionType[]>([]);

    // Ref para el textarea de observaciones
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Función para ajustar automáticamente la altura del textarea
    const autoResize = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto';
        element.style.height = Math.max(42, element.scrollHeight) + 'px';
    };

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
        reset
    } = useForm<RegistroMermaForm>({
        defaultValues: {
            categoria_merma_id: "",
            observaciones: "",
            productos: [
                { lote_id: "", cantidad_merma: "" }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "productos"
    });

    const watchedProductos = watch("productos");
    const watchedObservaciones = watch("observaciones") || "";

    // Obtener el cargo del usuario para mostrar el texto apropiado
    const { cargo } = userStore.getState();

    // Cargar datos de la API al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    // Función para cargar datos de categorías y lotes
    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Llamar a las dos funciones por separado
            const [categoriasResponse, lotesResponse] = await Promise.all([
                categoraisMermaData(),
                loteData()
            ]);

            console.log("Categorías cargadas:", categoriasResponse.data);
            console.log("Lotes cargados:", lotesResponse.data);

            // Extraer los datos de la respuesta
            const categoriasResult: CategoriasResponse = categoriasResponse.data;
            const lotesResult: LotesResponse = lotesResponse.data;

            // Verificar que las respuestas sean exitosas y extraer los arrays
            if (categoriasResult.success && Array.isArray(categoriasResult.categorias)) {
                // Formatear opciones para React Select
                const categoriasFormatted = categoriasResult.categorias.map(categoria => ({
                    value: categoria.id,
                    label: categoria.nombre
                }));
                setCategoriaOptions(categoriasFormatted);
            } else {
                console.error("Error en respuesta de categorías:", categoriasResult);
                setCategoriaOptions([]);
                setError("Error al cargar categorías");
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

    const onSubmit = handleSubmit(async (data: RegistroMermaForm) => {
        // Filtrar productos vacíos (sin lote_id seleccionado)
        const productosValidos = data.productos.filter(p => p.lote_id !== "");

        const dataToSend = {
            categoria_merma_id: Number(data.categoria_merma_id), // Convertir a número
            observaciones: data.observaciones,
            productos: productosValidos.map(p => ({
                lote_id: Number(p.lote_id), // Convertir a número
                cantidad_merma: Number(p.cantidad_merma) // Convertir a número
            }))
        };

        try {
            // Obtener el cargo del usuario desde el store
            const { cargo } = userStore.getState();

            let rest;

            if (cargo === 2) {
                // Jefe de bodega - Merma aprobada directamente
                rest = await RegistroMermaAprobada(dataToSend);
                if (rest.status === 201) {
                    toast.success("Merma registrada y aprobada exitosamente");
                    reset();
                    // Recargar los datos para actualizar los stocks
                    cargarDatos();
                } else {
                    toast.error("Error al registrar la merma");
                    console.error("Respuesta inesperada:", rest);
                }
            } else if (cargo === 1) {
                // Bodeguero - Merma pendiente de aprobación
                rest = await RegistroMerma(dataToSend);
                if (rest.status === 201) {
                    toast.success("Merma registrada a espera de aprobación");
                    reset();
                    // Recargar los datos para actualizar los stocks
                    cargarDatos();
                } else {
                    toast.error("Error al registrar la merma");
                    console.error("Respuesta inesperada:", rest);
                }
            } else {
                toast.error("No tienes permisos para registrar mermas");
                return;
            }
        } catch (error) {
            toast.error("Error al registrar la merma");
            console.error("Error al registrar merma:", error);
        }
    });

    const agregarProducto = () => {
        if (fields.length < 10) {
            append({ lote_id: "", cantidad_merma: "" });
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Registro de Merma</h1>
                    <p className="text-gray-600 mt-2">Registra las mermas de productos del inventario</p>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Categoría de Merma */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="categoria_merma_id">
                                        Categoría de Merma
                                    </label>
                                    <Controller
                                        name="categoria_merma_id"
                                        control={control}
                                        rules={{
                                            required: "Debe seleccionar una categoría",
                                            validate: value => value !== "" || "Debe seleccionar una categoría"
                                        }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                options={categoriaOptions}
                                                placeholder={loading ? "Cargando categorías..." : "Buscar y seleccionar categoría..."}
                                                isLoading={loading}
                                                isDisabled={loading}
                                                isSearchable
                                                isClearable
                                                value={categoriaOptions.find(option => option.value === field.value) || null}
                                                onChange={(selectedOption) => field.onChange(selectedOption?.value || "")}
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                styles={{
                                                    control: (provided) => ({
                                                        ...provided,
                                                        minHeight: '42px',
                                                        height: '42px',
                                                        borderColor: '#d1d5db',
                                                        '&:hover': {
                                                            borderColor: '#d1d5db'
                                                        },
                                                        boxShadow: 'none',
                                                        '&:focus': {
                                                            borderColor: '#3b82f6',
                                                            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                                                        }
                                                    }),
                                                    valueContainer: (provided) => ({
                                                        ...provided,
                                                        height: '40px',
                                                        padding: '0 12px'
                                                    }),
                                                    input: (provided) => ({
                                                        ...provided,
                                                        margin: '0px'
                                                    }),
                                                    indicatorsContainer: (provided) => ({
                                                        ...provided,
                                                        height: '40px'
                                                    })
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.categoria_merma_id && (
                                        <span className="text-red-500 text-sm mt-1">{errors.categoria_merma_id.message}</span>
                                    )}
                                </div>

                                {/* Observaciones */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700" htmlFor="observaciones">
                                            Observaciones
                                        </label>
                                        <span className={`text-xs ${watchedObservaciones.trim().length >= 10 ? 'text-gray-500' : 'text-red-500'}`}>
                                            {watchedObservaciones.trim().length} / mín. 10 caracteres
                                        </span>
                                    </div>
                                    <Controller
                                        name="observaciones"
                                        control={control}
                                        rules={{
                                            required: "Las observaciones son requeridas",
                                            validate: (value) => {
                                                if (!value || value.trim().length === 0) {
                                                    return "Las observaciones son requeridas";
                                                }
                                                if (value.trim().length < 10) {
                                                    return "Las observaciones deben tener al menos 10 caracteres";
                                                }
                                                return true;
                                            }
                                        }}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                ref={textareaRef}
                                                id="observaciones"
                                                rows={1}
                                                placeholder="Describe brevemente la causa o detalles de la merma..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[42px] overflow-hidden"
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    autoResize(e.currentTarget);
                                                }}
                                                style={{ height: '42px' }}
                                            />
                                        )}
                                    />
                                    {errors.observaciones && (
                                        <span className="text-red-500 text-sm mt-1">{errors.observaciones.message}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Productos */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Productos con Merma</h2>
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
                                                            if (producto?.cantidad_merma && value === "") {
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
                                                                    minHeight: '42px',
                                                                    height: '42px',
                                                                    borderColor: '#d1d5db',
                                                                    '&:hover': {
                                                                        borderColor: '#d1d5db'
                                                                    },
                                                                    boxShadow: 'none',
                                                                    '&:focus': {
                                                                        borderColor: '#3b82f6',
                                                                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
                                                                    }
                                                                }),
                                                                valueContainer: (provided) => ({
                                                                    ...provided,
                                                                    height: '40px',
                                                                    padding: '0 12px'
                                                                }),
                                                                input: (provided) => ({
                                                                    ...provided,
                                                                    margin: '0px'
                                                                }),
                                                                indicatorsContainer: (provided) => ({
                                                                    ...provided,
                                                                    height: '40px'
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

                                            {/* Cantidad de Merma */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cantidad de Merma
                                                    {loteInfo && (
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            (Stock disponible: {loteInfo.cantidad})
                                                        </span>
                                                    )}
                                                </label>
                                                <input
                                                    {...register(`productos.${index}.cantidad_merma`, {
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
                                                    placeholder="Ingrese la cantidad"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {errors.productos?.[index]?.cantidad_merma && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.cantidad_merma?.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Información adicional del lote */}
                                        {loteInfo && (
                                            <div className="mt-3 p-3 bg-amber-50 rounded-md">
                                                <p className="text-sm text-amber-700">
                                                    <strong>Producto:</strong> {loteInfo.producto_nombre} |
                                                    <strong> Código:</strong> {loteInfo.codigo_lote} |
                                                    <strong> Stock:</strong> {loteInfo.cantidad} unidades
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
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-md"
                            >
                                {cargo === 2 ? "Registrar y Aprobar Merma" : "Registrar Merma"}
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
