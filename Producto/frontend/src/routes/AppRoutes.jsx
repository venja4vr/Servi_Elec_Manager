import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Proyectos from "../pages/Proyectos";
import DetalleProyecto from "../pages/DetalleProyecto";
import Buscador from "../pages/Buscador";
import RecursosPendientes from "../pages/RecursosPendientes";
import Inventario from "../pages/Inventario";
import AgregarProducto from "../pages/AgregarProducto";
import ProtectedRoute from "./ProtectedRoute";
import NuevoProyecto from "../pages/NuevoProyecto";
import Solicitudes from "../pages/Solicitudes";
import Plantillas from "../pages/Plantillas";
import Notificaciones from "../pages/Notificaciones";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
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
                <Route
                    path="/proyectos/nuevo"
                    element={
                        <ProtectedRoute>
                         <NuevoProyecto />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/proyectos/:id"
                    element={
                        <ProtectedRoute>
                            <DetalleProyecto />
                        </ProtectedRoute>
                    }
                />
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
                <Route
                    path="/solicitudes"
                    element={
                        <ProtectedRoute>
                            <Solicitudes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/plantillas"
                    element={
                        <ProtectedRoute>
                            <Plantillas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/notificaciones"
                    element={
                        <ProtectedRoute>
                            <Notificaciones />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;