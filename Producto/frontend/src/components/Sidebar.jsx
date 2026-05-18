import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUsuariosPendientes, getUsuarioRol } from "../services/api";

const CARRITO_KEY = "recursos_pendientes_carrito";

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const [cantidadRecursos, setCantidadRecursos] = useState(0);
    const [cantidadPendientes, setCantidadPendientes] = useState(0);
    const rol = getUsuarioRol();
    const esSuperAdmin = rol === "S";

    useEffect(() => {
        actualizarContador();

        const handler = () => actualizarContador();
        window.addEventListener("storage", handler);
        window.addEventListener("focus", handler);

        const intervalo = setInterval(actualizarContador, 1500);

        return () => {
            window.removeEventListener("storage", handler);
            window.removeEventListener("focus", handler);
            clearInterval(intervalo);
        };
    }, []);

    useEffect(() => {
        if (!esSuperAdmin) return;

        cargarPendientes();
        const intervalo = setInterval(cargarPendientes, 10000);
        return () => clearInterval(intervalo);
    }, [esSuperAdmin]);

    const actualizarContador = () => {
        const raw = localStorage.getItem(CARRITO_KEY);
        const carrito = raw ? JSON.parse(raw) : [];
        setCantidadRecursos(carrito.length);
    };

    const cargarPendientes = async () => {
        try {
            const pendientes = await getUsuariosPendientes();
            setCantidadPendientes(pendientes.length);
        } catch (err) {
            console.error("Error al cargar pendientes:", err);
        }
    };

    const handleCerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario_nombre");
        localStorage.removeItem("usuario_rol");
        localStorage.removeItem("usuario_id");
        navigate("/");
    };

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">S</div>
                <div>
                    <h4>ServiElec</h4>
                    <span>Manager</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`sidebar-item ${isActive("/home") ? "active" : ""}`}
                    onClick={() => navigate("/home")}
                >
                    Home
                </button>

                <button
                    className={`sidebar-item ${isActive("/buscador") ? "active" : ""}`}
                    onClick={() => navigate("/buscador")}
                >
                    Buscador
                </button>

                <button
                    className={`sidebar-item ${isActive("/recursos-pendientes") ? "active" : ""}`}
                    onClick={() => navigate("/recursos-pendientes")}
                >
                    <span>Recursos pendientes</span>
                    {cantidadRecursos > 0 && (
                        <span className="sidebar-badge warning">{cantidadRecursos}</span>
                    )}
                </button>

                <button
                    className={`sidebar-item ${isActive("/proyectos") ? "active" : ""}`}
                    onClick={() => navigate("/proyectos")}
                >
                    Proyectos
                </button>

                <button
                    className={`sidebar-item ${isActive("/inventario") ? "active" : ""}`}
                    onClick={() => navigate("/inventario")}
                >
                    Inventario
                </button>

                {esSuperAdmin && (
                    <button
                        className={`sidebar-item ${isActive("/solicitudes") ? "active" : ""}`}
                        onClick={() => navigate("/solicitudes")}
                    >
                        <span>Solicitudes</span>
                        {cantidadPendientes > 0 && (
                            <span className="sidebar-badge danger">{cantidadPendientes}</span>
                        )}
                    </button>
                )}
            </nav>

            <div className="sidebar-bottom">
                <button className="sidebar-exit" onClick={handleCerrarSesion}>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;