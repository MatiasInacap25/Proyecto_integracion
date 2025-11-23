import { Navigate } from "react-router-dom";
import { userStore } from "./store/user";


interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredCargo?: number; // El cargo requerido para acceder a la ruta (opcional)
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { cargo } = userStore.getState();  // Obtén el estado actual directamente
    // Verifica si el cargo es 0 (sin permisos)
    if (cargo === 0) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Ruta protegida específica para bodegueros (cargo = 1)
export const BodegueroRoute = ({ children }: { children: React.ReactNode }) => {
    const { cargo } = userStore.getState();

    // Verifica si el cargo es específicamente 1 (bodeguero)
    if (cargo !== 1) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export const JefeBodegaRoute = ({ children }: { children: React.ReactNode }) => {
    const { cargo } = userStore.getState();
    if (cargo !== 2) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

export const AdministradorRoute = ({ children }: { children: React.ReactNode }) => {
    const { cargo } = userStore.getState();
    if (cargo !== 4) {
        return <Navigate to="/login" replace />;
    }
    return children;
};