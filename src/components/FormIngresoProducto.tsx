import { Button } from "@/components/ui/button";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { productosData, proveedoresData } from "../api/api";
import { IngresoProducto as IngresoProductoAPI } from "../api/bodegueroapi";
import Select from 'react-select';
import { toast } from 'sonner';

// Interfaces para los datos de la API
interface Proveedor {
    id: number;
    nombre: string;
}

interface Producto {
    id: number;
    nombre: string;
    cantidad_por_lote: number;
    unidad_medida_abreviatura: string;
}

// Interfaces para las respuestas de la API
interface ProveedoresResponse {
    success: boolean;
    proveedores: Proveedor[];
}

interface ProductosResponse {
    success: boolean;
    productos: Producto[];
}

// Interfaces para opciones de React Select
interface OptionType {
    value: number;
    label: string;
}

// Interfaz para cada producto en el ingreso
interface ProductoIngreso {
    producto_id: number | "";
    cantidad_lotes: number | "";
    codigo_lote: string;
    fecha_vencimiento: string;
}

// Interfaz para el formulario completo
interface IngresoProductoForm {
    proveedor_id: number | "";
    descripcion: string;
    productos: ProductoIngreso[];
}

export default function IngresoProducto() {
    // Estado para los datos de la API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Opciones formateadas para React Select
    const [proveedorOptions, setProveedorOptions] = useState<OptionType[]>([]);
    const [productoOptions, setProductoOptions] = useState<OptionType[]>([]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
        reset
    } = useForm<IngresoProductoForm>({
        defaultValues: {
            proveedor_id: "",
            descripcion: "",
            productos: [
                { producto_id: "", cantidad_lotes: "", codigo_lote: "", fecha_vencimiento: "" }
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
        const cargarDatos = async () => {
            try {
                setLoading(true);
                setError(null);

                // Llamar a las dos funciones por separado
                const [proveedoresResponse, productosResponse] = await Promise.all([
                    proveedoresData(),
                    productosData()
                ]);

                console.log("Proveedores cargados:", proveedoresResponse.data);
                console.log("Productos cargados:", productosResponse.data);

                // Extraer los datos de la respuesta con la estructura conocida
                const proveedoresResult: ProveedoresResponse = proveedoresResponse.data;
                const productosResult: ProductosResponse = productosResponse.data;

                // Verificar que las respuestas sean exitosas y extraer los arrays
                if (proveedoresResult.success && Array.isArray(proveedoresResult.proveedores)) {
                    // Formatear opciones para React Select
                    const proveedoresFormatted = proveedoresResult.proveedores.map(proveedor => ({
                        value: proveedor.id,
                        label: proveedor.nombre
                    }));
                    setProveedorOptions(proveedoresFormatted);
                } else {
                    console.error("Error en respuesta de proveedores:", proveedoresResult);
                    setProveedorOptions([]);
                    setError("Error al cargar proveedores");
                }

                if (productosResult.success && Array.isArray(productosResult.productos)) {
                    // Formatear opciones para React Select
                    const productosFormatted = productosResult.productos.map(producto => ({
                        value: producto.id,
                        label: `${producto.nombre} (${producto.cantidad_por_lote} ${producto.unidad_medida_abreviatura})`
                    }));
                    setProductoOptions(productosFormatted);
                } else {
                    console.error("Error en respuesta de productos:", productosResult);
                    setProductoOptions([]);
                    setError("Error al cargar productos");
                }

            } catch (err) {
                console.error("Error al cargar datos:", err);
                setError("Error de conexión al cargar los datos");
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, []);

    const onSubmit = handleSubmit(async (data: IngresoProductoForm) => {
        // Filtrar productos vacíos (sin producto_id seleccionado)
        const productosValidos = data.productos.filter(p => p.producto_id !== "");

        const dataToSend = {
            proveedor_id: Number(data.proveedor_id), // Convertir a número
            descripcion: data.descripcion,
            productos: productosValidos.map(p => ({
                producto_id: Number(p.producto_id), // Convertir a número
                cantidad_lotes: Number(p.cantidad_lotes), // Convertir a número
                codigo_lote: p.codigo_lote,
                fecha_vencimiento: p.fecha_vencimiento
            }))
        };

        try {
            const rest = await IngresoProductoAPI(dataToSend); // Enviar objeto directo, no FormData
            if (rest.status === 201) {
                toast.success("Ingreso de productos registrado exitosamente");
            } else {
                toast.error("Error al registrar el ingreso de productos");
                console.error("Respuesta inesperada:", rest);
            }
        } catch (error) {
            alert("Error al registrar el ingreso");
        }
    });

    const agregarProducto = () => {
        if (fields.length < 10) {
            append({ producto_id: "", cantidad_lotes: "", codigo_lote: "", fecha_vencimiento: "" });
        }
    };

    const eliminarProducto = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Ingreso de Productos</h1>
                    <p className="text-gray-600 mt-2">Registra el ingreso de productos desde proveedores</p>
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
                                {/* Proveedor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="proveedor_id">
                                        Proveedor
                                    </label>
                                    <Controller
                                        name="proveedor_id"
                                        control={control}
                                        rules={{
                                            required: "Debe seleccionar un proveedor",
                                            validate: value => value !== "" || "Debe seleccionar un proveedor"
                                        }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                options={proveedorOptions}
                                                placeholder={loading ? "Cargando proveedores..." : "Buscar y seleccionar proveedor..."}
                                                isLoading={loading}
                                                isDisabled={loading}
                                                isSearchable
                                                isClearable
                                                value={proveedorOptions.find(option => option.value === field.value) || null}
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
                                    {errors.proveedor_id && (
                                        <span className="text-red-500 text-sm mt-1">{errors.proveedor_id.message}</span>
                                    )}
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="descripcion">
                                        Descripción (Opcional)
                                    </label>
                                    <input
                                        {...register("descripcion")}
                                        type="text"
                                        id="descripcion"
                                        placeholder="Ej: Ingreso de productos semanales"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
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
                                const isProductoSelected = watchedProductos[index]?.producto_id !== "";

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

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Producto ID */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Producto
                                                </label>
                                                <Controller
                                                    name={`productos.${index}.producto_id`}
                                                    control={control}
                                                    rules={{
                                                        validate: value => {
                                                            // Si hay otros campos llenos, el producto es requerido
                                                            const producto = watchedProductos[index];
                                                            const otrosCamposLlenos = producto?.cantidad_lotes || producto?.codigo_lote || producto?.fecha_vencimiento;
                                                            if (otrosCamposLlenos && value === "") {
                                                                return "Debe seleccionar un producto";
                                                            }
                                                            return true;
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <Select
                                                            {...field}
                                                            options={productoOptions}
                                                            placeholder={loading ? "Cargando productos..." : "seleccionar producto"}
                                                            isLoading={loading}
                                                            isDisabled={loading}
                                                            isSearchable
                                                            isClearable
                                                            value={productoOptions.find(option => option.value === field.value) || null}
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
                                                {errors.productos?.[index]?.producto_id && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.producto_id?.message}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Cantidad de Lotes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cantidad
                                                </label>
                                                <input
                                                    {...register(`productos.${index}.cantidad_lotes`, {
                                                        validate: value => {
                                                            const stringValue = String(value);
                                                            const numValue = Number(value);
                                                            if (isProductoSelected && (!value || stringValue === "" || isNaN(numValue) || numValue === 0)) {
                                                                return "Este campo es requerido";
                                                            }
                                                            if (value && numValue <= 0) {
                                                                return "Debe ser mayor a 0";
                                                            }
                                                            return true;
                                                        }
                                                    })}
                                                    type="number"
                                                    min="1"
                                                    placeholder="10"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {errors.productos?.[index]?.cantidad_lotes && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.cantidad_lotes?.message}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Código de Lote */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Código de Lote
                                                </label>
                                                <input
                                                    {...register(`productos.${index}.codigo_lote`, {
                                                        validate: value => {
                                                            if (isProductoSelected && !value) {
                                                                return "Este campo es requerido";
                                                            }
                                                            return true;
                                                        }
                                                    })}
                                                    type="text"
                                                    placeholder="LOT2024-001"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {errors.productos?.[index]?.codigo_lote && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.codigo_lote?.message}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Fecha de Vencimiento */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha de Vencimiento
                                                </label>
                                                <input
                                                    {...register(`productos.${index}.fecha_vencimiento`, {
                                                        validate: value => {
                                                            if (isProductoSelected && !value) {
                                                                return "Este campo es requerido";
                                                            }
                                                            if (value && new Date(value) <= new Date()) {
                                                                return "Debe ser una fecha futura";
                                                            }
                                                            return true;
                                                        }
                                                    })}
                                                    type="date"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{
                                                        colorScheme: 'light'
                                                    }}
                                                />
                                                {errors.productos?.[index]?.fecha_vencimiento && (
                                                    <span className="text-red-500 text-sm mt-1">
                                                        {errors.productos[index]?.fecha_vencimiento?.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
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
                                Registrar Ingreso
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
