import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsuariosPendientes, getUsuarioRol } from "../services/api";

const CARRITO_KEY = "recursos_pendientes_carrito";

function Sidebar() {
    const navigate = useNavigate();
    const [cantidadRecursos, setCantidadRecursos] = useState(0);
    const [cantidadPendientes, setCantidadPendientes] = useState(0);
    const rol = getUsuarioRol();
    const esSuperAdmin = rol === "S";

    useEffect(() => {
        actualizarContador();

        // Escuchar cambios en localStorage (otras pestañas)
        const handler = () => actualizarContador();
        window.addEventListener("storage", handler);

        // Refrescar cada vez que la ventana toma foco
        window.addEventListener("focus", handler);

        // Intervalo para actualizar en la misma pestaña
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
            // Si falla, dejamos el contador en 0 silenciosamente
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
        <div
            className="d-flex flex-column p-3 text-white"
            style={{
                width: "250px",
                height: "100vh",
                background: "#1E293B",
            }}
        >
            <h4 className="mb-4">ServiElec</h4>
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <button
                        className="nav-link text-white bg-primary mb-2 w-100 text-start"
                        onClick={() => navigate("/home")}
                    >
                        Home
                    </button>
                </li>

                <li>
                    <button
                        className="nav-link text-white mb-2 w-100 text-start"
                        onClick={() => navigate("/buscador")}
                    >
                        Buscador
                    </button>
                </li>

                <li>
                    <button
                        className="nav-link text-white mb-2 w-100 text-start d-flex justify-content-between align-items-center"
                        onClick={() => navigate("/recursos-pendientes")}
                    >
                        <span>Recursos pendientes</span>
                        {cantidadRecursos > 0 && (
                            <span className="badge bg-warning text-dark rounded-pill">
                                {cantidadRecursos}
                            </span>
                        )}
                    </button>
                </li>

                <li>
                    <button
                        className="nav-link text-white mb-2 w-100 text-start"
                        onClick={() => navigate("/proyectos")}
                    >
                        Proyectos
                    </button>
                </li>

                <li>
                    <button
                        className="nav-link text-white mb-2 w-100 text-start"
                        onClick={() => navigate("/inventario")}
                    >
                        Inventario
                    </button>
                </li>

                {esSuperAdmin && (
                    <li>
                        <button
                            className="nav-link text-white mb-2 w-100 text-start d-flex justify-content-between align-items-center"
                            onClick={() => navigate("/solicitudes")}
                        >
                            <span>Solicitudes</span>
                            {cantidadPendientes > 0 && (
                                <span className="badge bg-danger rounded-pill">
                                    {cantidadPendientes}
                                </span>
                            )}
                        </button>
                    </li>
                )}
            </ul>

            <hr />

            <button className="btn btn-danger" onClick={handleCerrarSesion}>
                Cerrar Sesión
            </button>
        </div>
    );
}

export default Sidebar;