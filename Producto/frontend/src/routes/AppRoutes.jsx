import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Proyectos from "../pages/Proyectos";
// import DetalleProyecto from "../pages/DetalleProyecto";  // pendiente a hans
import Buscador from "../pages/Buscador";
import RecursosPendientes from "../pages/RecursosPendientes";
// import Inventario from "../pages/Inventario";            
// import AgregarProducto from "../pages/AgregarProducto";  
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Rutas protegidas */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/proyectos"
                    element={
                        <ProtectedRoute>
                            <Proyectos />
                        </ProtectedRoute>
                    }
                />
                {/* Pendientes de Hans:
                <Route
                    path="/proyectos/:id"
                    element={
                        <ProtectedRoute>
                            <DetalleProyecto />
                        </ProtectedRoute>
                    }
                />
                */}
                <Route
                    path="/buscador"
                    element={
                        <ProtectedRoute>
                            <Buscador />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/recursos-pendientes"
                    element={
                        <ProtectedRoute>
                            <RecursosPendientes />
                        </ProtectedRoute>
                    }
                />
                {/* Pendientes de Hans:
                <Route
                    path="/inventario"
                    element={
                        <ProtectedRoute>
                            <Inventario />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/agregar-producto"
                    element={
                        <ProtectedRoute>
                            <AgregarProducto />
                        </ProtectedRoute>
                    }
                />
                */}
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;