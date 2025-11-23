import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { BodegueroRoute, JefeBodegaRoute, AdministradorRoute } from './ProtectedRoute'
import { Toaster } from 'sonner'
import './App.css'
import LoginPage from './pages/LoginPage'
import CrearPassword from './pages/CrearPassword'
import RecuperarPassword from './pages/RecuperarPassword'
import ResetPassword from './pages/ResetPassword'
import BodegueroPage from './pages/Bodeguero/BodegueroPage'
import IngresarProducto from './pages/Bodeguero/IngresarProducto'
import SalidaProducto from './pages/Bodeguero/SalidaProducto'
import RegistroMerma from './pages/Bodeguero/RegistroMerma'
import JefeBodegaPage from './pages/Jefe_Bodega/JefeBodegaPage'
import JefeIngresarProducto from './pages/Jefe_Bodega/JefeIngresarProducto'
import JefeSalidaProducto from './pages/Jefe_Bodega/JefeSalidaProducto'
import JefeRegistrarMerma from './pages/Jefe_Bodega/JefeRegistrarMerma'
import JefeMermas from './pages/Jefe_Bodega/JefeMermas'
import AdminPage from './pages/Admin/AdminPage'
import JefeMermasData from './pages/Jefe_Bodega/JefeMermasData'
import ComparacionMermasPage from './pages/Jefe_Bodega/ComparacionMermasPage'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminIngresosPage from './pages/Admin/AdminIngresosPage'
import AdminSalidas from './pages/Admin/AdminSalidas'
import AdminMermasPage from './pages/Admin/AdminMermasPage'
import AdminProductosPage from './pages/Admin/AdminProductosPage'
import AdminProveedoresPage from './pages/Admin/AdminProveedoresPage'
import AdminClientesPage from './pages/Admin/AdminClientesPage'
import AdminConductoresPage from './pages/Admin/AdminConductoresPage'
import ReglasStockPage from './pages/Admin/ReglasStockPage'
import ComparacionMermasAdminPage from './pages/Admin/ComparacionMermasAdminPage'
import AdminBlockchain from './pages/Admin/AdminBlockchain'

// Componente temporal para Dashboard general
const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard General</h1>
      <p>Bienvenido al dashboard</p>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta para login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta para crear contraseña con token */}
        <Route path="/crear-password/:token" element={<CrearPassword />} />

        {/* Rutas de recuperación de contraseña */}
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Rutas por cargo */}

        {/* Rutas de bodeguero - todas protegidas bajo BodegueroRoute */}
        <Route path="/bodeguero/*" element={
          <BodegueroRoute>
            <Routes>
              <Route index element={<BodegueroPage children={undefined} />} />
              <Route path="IngresarProducto" element={<IngresarProducto children={undefined} />} />
              <Route path="SalidaProducto" element={<SalidaProducto children={undefined} />} />
              <Route path="RegistrarMerma" element={<RegistroMerma children={undefined} />} />
            </Routes>
          </BodegueroRoute>
        } />

        <Route path="/jefebodega/*" element={
          <JefeBodegaRoute>
            <Routes>
              <Route index element={<JefeBodegaPage children={undefined} />} />
              <Route path="IngresarProducto" element={<JefeIngresarProducto children={undefined} />} />
              <Route path="SalidaProducto" element={<JefeSalidaProducto children={undefined} />} />
              <Route path="RegistrarMerma" element={<JefeRegistrarMerma children={undefined} />} />
              <Route path="RegistrosMermas" element={<JefeMermas children={undefined} />} />
              <Route path="RegistroMermas" element={<JefeMermasData children={undefined} />} />
              <Route path="ComparacionMermas" element={<ComparacionMermasPage children={undefined} />} />
            </Routes>
          </JefeBodegaRoute>
        } />

        <Route path="/administrador/*" element={
          <AdministradorRoute>
            <Routes>
              <Route index element={<AdminPage children={undefined} />} />
              <Route path="Usuarios" element={<AdminUsers children={undefined} />} />
              <Route path="Ingresos" element={<AdminIngresosPage children={undefined} />} />
              <Route path="Salidas" element={<AdminSalidas children={undefined} />} />
              <Route path="Mermas" element={<AdminMermasPage children={undefined} />} />
              <Route path="Productos" element={<AdminProductosPage children={undefined} />} />
              <Route path="Proveedores" element={<AdminProveedoresPage children={undefined} />} />
              <Route path="Clientes" element={<AdminClientesPage children={undefined} />} />
              <Route path="Conductores" element={<AdminConductoresPage children={undefined} />} />
              <Route path="ReglasStock" element={<ReglasStockPage children={undefined} />} />
              <Route path="ComparacionMermas" element={<ComparacionMermasAdminPage children={undefined} />} />
              <Route path="Blockchain" element={<AdminBlockchain children={undefined} />} />
            </Routes>
          </AdministradorRoute>
        } />

        <Route path="/auditor" element={<DashboardPage />} />

        {/* Ruta por defecto redirige a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        richColors
        expand={true}
        duration={3000}
      />
    </Router>
  )
}

export default App