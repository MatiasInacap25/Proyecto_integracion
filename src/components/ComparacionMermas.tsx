import { ComparacionMermasMensual, ComparacionMermasCategorias } from '@/api/adminapi'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { AlertCircle, TrendingDown, DollarSign, Package, Filter } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { categoraisMermaData } from '@/api/api'

interface DatosMensuales {
    mes: string
    mes_num: number
    total_mermas: number
    perdida_economica: number
}

interface ProductoMayorPerdida {
    mes: string
    mes_num: number
    producto: string
    producto_id: number | null
    perdida_economica: number
    cantidad: number
}

interface TopProducto {
    producto: string
    producto_id: number
    perdida_economica: number
    cantidad: number
}

interface Resumen {
    total_anual: number
    total_mermas: number
    promedio_mensual: number
}

interface DataComparacion {
    success: boolean
    year: number
    año_minimo: number
    datos_mensuales: DatosMensuales[]
    productos_mayor_perdida_mes: ProductoMayorPerdida[]
    top_productos_año: TopProducto[]
    resumen: Resumen
}

interface DataCategoria {
    nombre: string
    datos_mensuales: any[]
    total_perdida: number
    total_registros: number
}

interface DataComparacionCategorias {
    success: boolean
    categoria1: DataCategoria
    categoria2: DataCategoria
    datos_comparativos: any[]
    fecha_inicio: string
    fecha_fin: string
}

export default function ComparacionMermas() {
    const currentYear = new Date().getFullYear()
    const [selectedYear, setSelectedYear] = useState<number>(currentYear)
    const [data, setData] = useState<DataComparacion | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para comparación por categorías
    const [categorias, setCategorias] = useState<any[]>([])
    const [categoria1, setCategoria1] = useState<string>('')
    const [categoria2, setCategoria2] = useState<string>('')
    const [fechaInicio, setFechaInicio] = useState<string>('')
    const [fechaFin, setFechaFin] = useState<string>('')
    const [dataComparacion, setDataComparacion] = useState<DataComparacionCategorias | null>(null)
    const [loadingComparacion, setLoadingComparacion] = useState(false)
    const [errorComparacion, setErrorComparacion] = useState<string | null>(null)

    // Generar años disponibles desde el año mínimo hasta el actual
    const añoMinimo = data?.año_minimo || currentYear
    const years = Array.from({ length: currentYear - añoMinimo + 1 }, (_, i) => currentYear - i)

    useEffect(() => {
        cargarDatos()
        cargarCategorias()
    }, [selectedYear])

    const cargarCategorias = async () => {
        try {
            const response = await categoraisMermaData()
            if (response.data.success && response.data.categorias) {
                setCategorias(response.data.categorias)
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error)
        }
    }

    const compararCategorias = async () => {
        if (!categoria1 || !categoria2 || !fechaInicio || !fechaFin) {
            setErrorComparacion('Por favor completa todos los campos')
            return
        }

        setLoadingComparacion(true)
        setErrorComparacion(null)
        try {
            const response = await ComparacionMermasCategorias(
                parseInt(categoria1),
                parseInt(categoria2),
                fechaInicio,
                fechaFin
            )
            if (response.data.success) {
                setDataComparacion(response.data)
            } else {
                setErrorComparacion(response.data.error || 'Error al comparar categorías')
            }
        } catch (error: any) {
            setErrorComparacion(error.response?.data?.error || 'Error al comparar categorías')
        } finally {
            setLoadingComparacion(false)
        }
    }

    const cargarDatos = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await ComparacionMermasMensual(selectedYear)
            if (response.data.success) {
                setData(response.data)
            } else {
                setError(response.data.error || 'Error al cargar datos')
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Error al cargar comparación de mermas')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(value)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Cargando datos...</div>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (!data) return null

    return (
        <div className="space-y-6">
            {/* Header con selector de año */}
            <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Comparación de Mermas</h2>
                    <p className="text-muted-foreground">
                        Análisis de pérdidas económicas mensuales
                    </p>
                </div>
                <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Cards de resumen */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pérdida Total Anual</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data.resumen.total_anual)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Mermas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.resumen.total_mermas}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Promedio Mensual</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(data.resumen.promedio_mensual)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de barras - Pérdidas mensuales */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolución de Pérdidas Económicas</CardTitle>
                    <CardDescription>
                        Comparación mensual de pérdidas en mermas durante {selectedYear}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.datos_mensuales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelStyle={{ color: '#000' }}
                            />
                            <Legend />
                            <Bar dataKey="perdida_economica" fill="#ef4444" name="Pérdida Económica" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Gráfico de línea - Cantidad de mermas */}
            <Card>
                <CardHeader>
                    <CardTitle>Cantidad de Registros de Merma</CardTitle>
                    <CardDescription>
                        Tendencia de registros de merma por mes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.datos_mensuales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip labelStyle={{ color: '#000' }} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="total_mermas"
                                stroke="#f97316"
                                strokeWidth={2}
                                name="Total Mermas"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Tabla de productos con mayor pérdida por mes */}
            <Card>
                <CardHeader>
                    <CardTitle>Productos con Mayor Pérdida por Mes</CardTitle>
                    <CardDescription>
                        Identificación de productos que generan mayor pérdida económica cada mes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mes</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Pérdida Económica</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.productos_mayor_perdida_mes.map((item) => (
                                <TableRow key={item.mes_num}>
                                    <TableCell className="font-medium">{item.mes}</TableCell>
                                    <TableCell>{item.producto}</TableCell>
                                    <TableCell className="text-right">
                                        {item.cantidad > 0 ? Math.round(item.cantidad) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                        {item.perdida_economica > 0 ? formatCurrency(item.perdida_economica) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Top 5 productos del año */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 Productos con Mayor Pérdida en {selectedYear}</CardTitle>
                    <CardDescription>
                        Productos que acumularon las mayores pérdidas económicas durante el año
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Pos.</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Cantidad Total</TableHead>
                                <TableHead className="text-right">Pérdida Económica</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.top_productos_año.map((producto, index) => (
                                <TableRow key={producto.producto_id}>
                                    <TableCell className="font-bold text-lg">#{index + 1}</TableCell>
                                    <TableCell className="font-medium">{producto.producto}</TableCell>
                                    <TableCell className="text-right">{Math.round(producto.cantidad)}</TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                        {formatCurrency(producto.perdida_economica)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.top_productos_año.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No hay datos disponibles para este año
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Comparación por Categorías */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Comparación por Categorías de Merma
                    </CardTitle>
                    <CardDescription>
                        Compara las pérdidas económicas entre dos categorías de merma en un rango de fechas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría 1</label>
                            <Select value={categoria1} onValueChange={setCategoria1}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría 2</label>
                            <Select value={categoria2} onValueChange={setCategoria2}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha Inicio</label>
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                style={{ colorScheme: 'light' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha Fin</label>
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                style={{ colorScheme: 'light' }}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={compararCategorias}
                        disabled={loadingComparacion}
                        className="w-full md:w-auto"
                    >
                        {loadingComparacion ? 'Comparando...' : 'Comparar Categorías'}
                    </Button>

                    {errorComparacion && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errorComparacion}</AlertDescription>
                        </Alert>
                    )}

                    {dataComparacion && (
                        <div className="mt-6 space-y-6">
                            {/* Resumen comparativo */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{dataComparacion.categoria1.nombre}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Total Pérdida:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(dataComparacion.categoria1.total_perdida)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Registros:</span>
                                                <span className="font-semibold">{dataComparacion.categoria1.total_registros}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{dataComparacion.categoria2.nombre}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Total Pérdida:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(dataComparacion.categoria2.total_perdida)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Registros:</span>
                                                <span className="font-semibold">{dataComparacion.categoria2.total_registros}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráfico comparativo */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comparación de Pérdidas Económicas</CardTitle>
                                    <CardDescription>
                                        {dataComparacion.fecha_inicio} - {dataComparacion.fecha_fin}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={dataComparacion.datos_comparativos}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="mes" />
                                            <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                labelStyle={{ color: '#000' }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey={dataComparacion.categoria1.nombre}
                                                fill="#3b82f6"
                                                name={dataComparacion.categoria1.nombre}
                                            />
                                            <Bar
                                                dataKey={dataComparacion.categoria2.nombre}
                                                fill="#ef4444"
                                                name={dataComparacion.categoria2.nombre}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Tabla comparativa de cantidades */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cantidad de Registros por Mes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mes</TableHead>
                                                <TableHead className="text-right">{dataComparacion.categoria1.nombre}</TableHead>
                                                <TableHead className="text-right">{dataComparacion.categoria2.nombre}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataComparacion.datos_comparativos.map((item: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{item.mes}</TableCell>
                                                    <TableCell className="text-right">
                                                        {item[`${dataComparacion.categoria1.nombre}_cantidad`]}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item[`${dataComparacion.categoria2.nombre}_cantidad`]}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
