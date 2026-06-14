import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    getUsuariosPendientes,
    getUsuarioRol,
    getUsuarioNombre,
    contadorNoLeidas,
} from "../services/api";

const CARRITO_KEY = "recursos_pendientes_carrito";

const ROL_LABEL = { S: "SuperAdmin", A: "Administrador", T: "Técnico" };

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const [cantidadRecursos, setCantidadRecursos] = useState(0);
    const [cantidadPendientes, setCantidadPendientes] = useState(0);
    const [cantidadNotificaciones, setCantidadNotificaciones] = useState(0);

    const rol = getUsuarioRol();
    const nombre = getUsuarioNombre();
    const esSuperAdmin = rol === "S";
    const esAdmin = rol === "A" || rol === "S";

    // Carrito de recursos (1.5s)
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

    // Solicitudes pendientes para SuperAdmin (10s)
    useEffect(() => {
        if (!esSuperAdmin) return;
        cargarPendientes();
        const intervalo = setInterval(cargarPendientes, 10000);
        return () => clearInterval(intervalo);
    }, [esSuperAdmin]);

    // Contador de notificaciones no leídas (30s exactos)
    useEffect(() => {
        cargarContadorNotificaciones();
        const intervalo = setInterval(cargarContadorNotificaciones, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const actualizarContador = () => {
        const raw = localStorage.getItem(CARRITO_KEY);
        const carrito = raw ? JSON.parse(raw) : [];
        setCantidadRecursos(carrito.length);
    };

    const cargarPendientes = async () => {
        try {
            const pendientes = await getUsuariosPendientes();
            setCantidadPendientes(pendientes.length);
        } catch {
            // silencioso
        }
    };

    const cargarContadorNotificaciones = async () => {
        try {
            const data = await contadorNoLeidas();
            setCantidadNotificaciones(data.total ?? 0);
        } catch {
            // silencioso hasta que el backend esté disponible
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

            <div className="sidebar-user">
                <span className="sidebar-user-nombre">{nombre}</span>
                <span className="sidebar-user-rol">{ROL_LABEL[rol] ?? rol}</span>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`sidebar-item ${isActive("/home") ? "active" : ""}`}
                    onClick={() => navigate("/home")}
                >
                    Home
                </button>

                <button
                    className={`sidebar-item ${isActive("/notificaciones") ? "active" : ""}`}
                    onClick={() => navigate("/notificaciones")}
                >
                    <span>Notificaciones</span>
                    {cantidadNotificaciones > 0 && (
                        <span className="sidebar-badge warning">{cantidadNotificaciones}</span>
                    )}
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

                <button
                    className={`sidebar-item ${isActive("/inventario") ? "active" : ""}`}
                    onClick={() => navigate("/inventario")}
                >
                    Inventario
                </button>

                <button
                    className={`sidebar-item ${isActive("/buscador") ? "active" : ""}`}
                    onClick={() => navigate("/buscador")}
                >
                    Comparador
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

                {esAdmin && (
                    <button
                        className={`sidebar-item ${isActive("/plantillas") ? "active" : ""}`}
                        onClick={() => navigate("/plantillas")}
                    >
                        Plantillas
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
