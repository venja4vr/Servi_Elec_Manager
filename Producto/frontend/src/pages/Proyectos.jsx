import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getProyectos, cambiarEstadoProyecto } from "../services/api";
import ConfirmarPasswordModal from "../components/ConfirmarPasswordModal";

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
        const accionesCriticas = ["en_curso", "finalizado", "cancelado"];
        if (accionesCriticas.includes(nuevoEstado)) {
            setAccionPendiente({ proyecto, nuevoEstado });
            setMostrarPassword(true);
            return;
        }
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
        const [year, month, day] = fecha.split("-").map(Number);
        const d = new Date(year, month - 1, day);
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

    const claseEstado = (tab) => {
        // Mapeo del tab interno → clase CSS de Hans
        switch (tab) {
            case "pendientes": return "pendientes";
            case "enCurso": return "enCurso";
            case "finalizado": return "finalizado";
            case "cancelado": return "cancelado";
            default: return "";
        }
    };

    const textoEstado = (tab) => {
        switch (tab) {
            case "pendientes": return "Pendiente";
            case "enCurso": return "En curso";
            case "finalizado": return "Finalizado";
            case "cancelado": return "Cancelado";
            default: return tab;
        }
    };

    return (
        <AppLayout>
            <div className="projects-page">
                <div className="projects-header">
                    <div>
                        <h1>Proyectos</h1>
                        <p>Administra proyectos eléctricos y revisa su estado actual.</p>
                    </div>
                    <button
                        className="primary-btn"
                        onClick={() => navigate("/proyectos/nuevo")}
                    >
                        + Nuevo proyecto
                    </button>
                </div>

                <div className="projects-tabs">
                    <button
                        className={tabActivo === "pendientes" ? "active" : ""}
                        onClick={() => setTabActivo("pendientes")}
                    >
                        Pendientes
                    </button>
                    <button
                        className={tabActivo === "enCurso" ? "active" : ""}
                        onClick={() => setTabActivo("enCurso")}
                    >
                        En curso
                    </button>
                    <button
                        className={tabActivo === "finalizado" ? "active" : ""}
                        onClick={() => setTabActivo("finalizado")}
                    >
                        Finalizados
                    </button>
                    <button
                        className={tabActivo === "cancelado" ? "active" : ""}
                        onClick={() => setTabActivo("cancelado")}
                    >
                        Cancelados
                    </button>
                </div>

                <div className="projects-filters">
                    <input
                        type="text"
                        placeholder="Buscar por nombre del proyecto, cliente o tipo"
                        maxLength={150}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <div className="projects-list">
                    {cargando ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            Cargando proyectos...
                        </div>
                    ) : proyectosFiltrados.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            {busqueda
                                ? "No se encontraron proyectos con esa búsqueda."
                                : `No hay proyectos en estado "${textoEstado(tabActivo)}".`}
                        </div>
                    ) : (
                        proyectosFiltrados.map((proyecto) => (
                            <div className="project-card" key={proyecto.id_proyecto}>
                                <div className="project-info">
                                    <h3>{proyecto.nombre_proyecto}</h3>
                                    <p>Cliente: {proyecto.nombre_cliente}</p>
                                    <p>Tipo: {proyecto.tipo_proyecto || "Sin especificar"}</p>
                                </div>

                                <div className="project-meta">
                                    <p>
                                        <strong>Inicio:</strong>{" "}
                                        {formatearFecha(proyecto.fecha_inicio)}
                                    </p>
                                    <p>
                                        <strong>Término máx.:</strong>{" "}
                                        {formatearFecha(proyecto.fecha_termino_maximo)}
                                    </p>
                                    <p>
                                        <strong>Presupuesto:</strong>{" "}
                                        {formatearPrecio(proyecto.presupuesto_estimado)}
                                    </p>
                                    <span className={`project-status ${claseEstado(tabActivo)}`}>
                                        {textoEstado(tabActivo)}
                                    </span>
                                </div>

                                <div className="project-actions">
                                    <button
                                        className="primary-btn"
                                        onClick={() => navigate(`/proyectos/${proyecto.id_proyecto}`)}
                                    >
                                        Ver detalle
                                    </button>

                                    {tabActivo === "pendientes" && (
                                        <>
                                            <button
                                                className="secondary-btn"
                                                onClick={() => handleCambiarEstado(proyecto, "en_curso")}
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                className="light-btn"
                                                onClick={() => handleCambiarEstado(proyecto, "cancelado")}
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}

                                    {tabActivo === "enCurso" && (
                                        <>
                                            <button
                                                className="secondary-btn"
                                                onClick={() => handleCambiarEstado(proyecto, "finalizado")}
                                            >
                                                Finalizar
                                            </button>
                                            <button
                                                className="light-btn"
                                                onClick={() => handleCambiarEstado(proyecto, "cancelado")}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    )}

                                    {tabActivo === "cancelado" && (
                                        <button
                                            className="light-btn"
                                            onClick={() => handleCambiarEstado(proyecto, "pendiente")}
                                        >
                                            Reactivar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* MODAL DE CONFIRMACIÓN CON CONTRASEÑA */}
                <ConfirmarPasswordModal
                    mostrar={mostrarPassword}
                    titulo={
                        accionPendiente?.nuevoEstado === "en_curso"
                            ? "Aceptar proyecto"
                            : accionPendiente?.nuevoEstado === "finalizado"
                            ? "Finalizar proyecto"
                            : "Cancelar proyecto"
                    }
                    mensaje={
                        accionPendiente
                            ? accionPendiente.nuevoEstado === "en_curso"
                                ? `Estás por iniciar el proyecto "${accionPendiente.proyecto.nombre_proyecto}". Esto descontará los materiales del inventario.`
                                : accionPendiente.nuevoEstado === "finalizado"
                                ? `Estás por finalizar el proyecto "${accionPendiente.proyecto.nombre_proyecto}". Esta acción es importante.`
                                : `Estás por cancelar el proyecto "${accionPendiente.proyecto.nombre_proyecto}".${
                                    accionPendiente.proyecto.estado === "en_curso"
                                        ? " Los materiales serán devueltos al inventario."
                                        : ""
                                }`
                            : ""
                    }
                    colorBoton={
                        accionPendiente?.nuevoEstado === "en_curso"
                            ? "btn-primary"
                            : accionPendiente?.nuevoEstado === "finalizado"
                            ? "btn-success"
                            : "btn-danger"
                    }
                    textoBoton={
                        accionPendiente?.nuevoEstado === "en_curso"
                            ? "Aceptar y descontar"
                            : accionPendiente?.nuevoEstado === "finalizado"
                            ? "Sí, finalizar"
                            : "Sí, cancelar"
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