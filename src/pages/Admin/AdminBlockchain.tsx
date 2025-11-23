import AdminSidebar from "@/components/AdminSidebar";
import { useEffect, useState } from "react";
import { ObtenerHistorialBlockchain } from "@/api/adminapi";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminBlockchain() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ producto_id: '', tipo_movimiento: '', fecha_desde: '', fecha_hasta: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.producto_id) params.producto_id = filters.producto_id;
      if (filters.tipo_movimiento) params.tipo_movimiento = filters.tipo_movimiento;
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
      const resp = await ObtenerHistorialBlockchain(params);
      if (resp.data && resp.data.success) {
        setData(resp.data.results || []);
      }
    } catch (error) {
      console.error('Error fetching blockchain history', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AdminSidebar />
        <div className="p-6 w-full bg-neutral-50">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold mb-4">Historial en Blockchain</h1>

          <div className="mb-4 flex gap-2">
            <input placeholder="Producto ID" value={filters.producto_id} onChange={e=>setFilters({...filters, producto_id: e.target.value})} className="border p-2" />
            <input placeholder="Tipo de movimiento" value={filters.tipo_movimiento} onChange={e=>setFilters({...filters, tipo_movimiento: e.target.value})} className="border p-2" />
            <input type="date" value={filters.fecha_desde} onChange={e=>setFilters({...filters, fecha_desde: e.target.value})} className="border p-2" />
            <input type="date" value={filters.fecha_hasta} onChange={e=>setFilters({...filters, fecha_hasta: e.target.value})} className="border p-2" />
            <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded">Filtrar</button>
          </div>

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Producto</th>
                  <th className="border px-2 py-1">Tipo</th>
                  <th className="border px-2 py-1">Cantidad</th>
                  <th className="border px-2 py-1">Usuario</th>
                  <th className="border px-2 py-1">Fecha</th>
                  <th className="border px-2 py-1">TX ID</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row:any) => (
                  <tr key={row.id}>
                    <td className="border px-2 py-1">{row.producto_nombre || row.producto}</td>
                    <td className="border px-2 py-1">{row.tipo_movimiento}</td>
                    <td className="border px-2 py-1">{row.cantidad}</td>
                    <td className="border px-2 py-1">{row.usuario_nombre || row.usuario}</td>
                    <td className="border px-2 py-1">{row.timestamp}</td>
                    <td className="border px-2 py-1">{row.tx_id_blockchain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SidebarProvider>
  )
}
