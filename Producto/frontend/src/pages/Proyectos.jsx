import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getProyectos, cambiarEstadoProyecto } from "../services/api";
import ConfirmarPasswordModal from "../components/ConfirmarPasswordModal";

// Mapa de tabs del front a estados del backend
const TABS = {
    pendientes: "pendiente",
    enCurso: "en_curso",
    finalizado: "finalizado",
    cancelado: "cancelado",
};

function Proyectos() {
    const navigate = useNavigate();
    const [tabActivo, setTabActivo] = useState("pendientes");
    const [proyectos, setProyectos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    // Modal de stock insuficiente
    const [mostrarStockInsuficiente, setMostrarStockInsuficiente] = useState(false);
    const [faltantesStock, setFaltantesStock] = useState([]);
    const [proyectoConFalta, setProyectoConFalta] = useState(null);

    // Modal de confirmación con contraseña
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [accionPendiente, setAccionPendiente] = useState(null);

    useEffect(() => {
        cargarProyectos();
    }, [tabActivo]);

    const cargarProyectos = async () => {
        setCargando(true);
        setError("");
        try {
            const estado = TABS[tabActivo];
            const data = await getProyectos(estado);
            setProyectos(data);
        } catch (err) {
            setError(err.message || "Error al cargar proyectos");
        } finally {
            setCargando(false);
        }
    };

    const handleCambiarEstado = async (proyecto, nuevoEstado) => {
        // Si la acción es crítica (aceptar o cancelar en_curso), pedir contraseña
        const accionesCriticas = ["en_curso", "cancelado"];
        if (accionesCriticas.includes(nuevoEstado)) {
            setAccionPendiente({ proyecto, nuevoEstado });
            setMostrarPassword(true);
            return;
        }

        // Acciones no críticas (finalizar, reactivar) → ejecutar directamente
        await ejecutarCambioEstado(proyecto, nuevoEstado);
    };

const ejecutarCambioEstado = async (proyecto, nuevoEstado) => {
    try {
        await cambiarEstadoProyecto(proyecto.id_proyecto, nuevoEstado);
        await cargarProyectos();
    } catch (err) {
        if (err.faltantes && Array.isArray(err.faltantes)) {
            setFaltantesStock(err.faltantes);
            setProyectoConFalta(proyecto);
            setMostrarStockInsuficiente(true);
        } else {
            setError(err.message || "Error al cambiar el estado del proyecto");
        }
    }
};
    // Helper para parsear el error de stock insuficiente desde el mensaje del backend
    const mostrarFaltantesDesdeError = async (err, proyecto) => {
        // Intentar obtener faltantes desde err.faltantes directamente
        if (err.faltantes && Array.isArray(err.faltantes)) {
            setFaltantesStock(err.faltantes);
            setProyectoConFalta(proyecto);
            setMostrarStockInsuficiente(true);
            return;
        }

        // Si no, mostrar mensaje genérico
        setError(err.message || "Stock insuficiente para aceptar el proyecto");
    };

    const formatearPrecio = (precio) => {
        if (precio === null || precio === undefined) return "Sin estimar";
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "Sin definir";
        const d = new Date(fecha);
        return d.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const proyectosFiltrados = proyectos.filter((p) => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase();
        return (
            p.nombre_proyecto.toLowerCase().includes(q) ||
            p.nombre_cliente.toLowerCase().includes(q) ||
            (p.tipo_proyecto && p.tipo_proyecto.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">Proyectos</h2>
                    <button
                        className="btn btn-success px-4"
                        onClick={() => navigate("/proyectos/nuevo")}
                    >
                        + Nuevo proyecto
                    </button>
                </div>

                <div className="d-flex gap-2 mb-3">
                    <button
                        className={`btn ${tabActivo === "pendientes" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setTabActivo("pendientes")}
                    >
                        Pendientes
                    </button>
                    <button
                        className={`btn ${tabActivo === "enCurso" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setTabActivo("enCurso")}
                    >
                        En curso
                    </button>
                    <button
                        className={`btn ${tabActivo === "finalizado" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setTabActivo("finalizado")}
                    >
                        Finalizado
                    </button>
                    <button
                        className={`btn ${tabActivo === "cancelado" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setTabActivo("cancelado")}
                    >
                        Cancelado
                    </button>
                </div>

                <div className="row mb-4">
                    <div className="col-md-12">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por nombre del proyecto, cliente o tipo"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {cargando ? (
                    <div className="text-center text-muted py-5">Cargando proyectos...</div>
                ) : proyectosFiltrados.length === 0 ? (
                    <div className="text-center text-muted py-5">
                        {busqueda
                            ? "No se encontraron proyectos con esa búsqueda."
                            : `No hay proyectos en estado "${tabActivo}".`}
                    </div>
                ) : (
                    proyectosFiltrados.map((proyecto) => (
                        <div className="card mb-3 border-0 shadow-sm" key={proyecto.id_proyecto}>
                            <div className="row g-0 p-3 align-items-center">
                                <div className="col-md-5">
                                    <h5 className="fw-bold mb-2">{proyecto.nombre_proyecto}</h5>
                                    <p className="mb-1">
                                        <strong>Cliente:</strong> {proyecto.nombre_cliente}
                                    </p>
                                    <p className="mb-0">
                                        <strong>Tipo:</strong>{" "}
                                        {proyecto.tipo_proyecto || "Sin especificar"}
                                    </p>
                                </div>

                                <div className="col-md-4">
                                    <p className="mb-1">
                                        <strong>Inicio:</strong> {formatearFecha(proyecto.fecha_inicio)}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Término máx.:</strong>{" "}
                                        {formatearFecha(proyecto.fecha_termino_maximo)}
                                    </p>
                                    <p className="mb-0">
                                        <strong>Presupuesto:</strong>{" "}
                                        {formatearPrecio(proyecto.presupuesto_estimado)}
                                    </p>
                                </div>

                                <div className="col-md-3 d-flex flex-column gap-2">
                                    <button
                                        className="btn btn-dark"
                                        onClick={() => navigate(`/proyectos/${proyecto.id_proyecto}`)}
                                    >
                                        Ver detalle
                                    </button>

                                    {tabActivo === "pendientes" && (
                                        <>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleCambiarEstado(proyecto, "en_curso")}
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => handleCambiarEstado(proyecto, "cancelado")}
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}

                                    {tabActivo === "enCurso" && (
                                        <>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleCambiarEstado(proyecto, "finalizado")}
                                            >
                                                Finalizar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => handleCambiarEstado(proyecto, "cancelado")}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    )}

                                    {tabActivo === "finalizado" && (
                                        <span className="badge bg-success p-2 text-center">
                                            Proyecto finalizado
                                        </span>
                                    )}

                                    {tabActivo === "cancelado" && (
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={() => handleCambiarEstado(proyecto, "pendiente")}
                                        >
                                            Reactivar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* MODAL DE CONFIRMACIÓN CON CONTRASEÑA */}
                <ConfirmarPasswordModal
                    mostrar={mostrarPassword}
                    titulo={
                        accionPendiente?.nuevoEstado === "en_curso"
                            ? "Aceptar proyecto"
                            : "Cancelar proyecto"
                    }
                    mensaje={
                        accionPendiente
                            ? accionPendiente.nuevoEstado === "en_curso"
                                ? `Vas a aceptar el proyecto "${accionPendiente.proyecto.nombre_proyecto}". Esto descontará los materiales del inventario.`
                                : `Vas a cancelar el proyecto "${accionPendiente.proyecto.nombre_proyecto}".${
                                    accionPendiente.proyecto.estado === "en_curso"
                                        ? " Los materiales serán devueltos al inventario."
                                        : ""
                                }`
                            : ""
                    }
                    colorBoton={
                        accionPendiente?.nuevoEstado === "en_curso" ? "btn-primary" : "btn-danger"
                    }
                    textoBoton={
                        accionPendiente?.nuevoEstado === "en_curso" ? "Aceptar y descontar" : "Sí, cancelar"
                    }
                    onConfirmar={async () => {
                        if (accionPendiente) {
                            await ejecutarCambioEstado(
                                accionPendiente.proyecto,
                                accionPendiente.nuevoEstado
                            );
                        }
                        setMostrarPassword(false);
                        setAccionPendiente(null);
                    }}
                    onCancelar={() => {
                        setMostrarPassword(false);
                        setAccionPendiente(null);
                    }}
                />

                {/* MODAL STOCK INSUFICIENTE */}
                {mostrarStockInsuficiente && (
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content">
                                <div className="modal-header bg-warning">
                                    <h5 className="modal-title">No se puede aceptar el proyecto</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setMostrarStockInsuficiente(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p className="mb-3">
                                        El proyecto <strong>{proyectoConFalta?.nombre_proyecto}</strong> no
                                        se puede aceptar porque <strong>faltan materiales en el inventario</strong>.
                                        Debes reponer el stock antes de continuar.
                                    </p>

                                    <div className="table-responsive">
                                        <table className="table align-middle">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>Material</th>
                                                    <th className="text-center">Planeado</th>
                                                    <th className="text-center">Disponible</th>
                                                    <th className="text-center text-danger">Falta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {faltantesStock.map((f) => (
                                                    <tr key={f.material_id}>
                                                        <td>
                                                            <strong>{f.nombre}</strong>
                                                        </td>
                                                        <td className="text-center">{f.planeado}</td>
                                                        <td className="text-center">{f.disponible}</td>
                                                        <td className="text-center fw-bold text-danger">
                                                            {f.faltan}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setMostrarStockInsuficiente(false)}
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setMostrarStockInsuficiente(false);
                                            navigate("/buscador");
                                        }}
                                    >
                                        Ir al buscador para reponer stock
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default Proyectos;