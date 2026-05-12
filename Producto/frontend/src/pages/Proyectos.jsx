import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getProyectos, cambiarEstadoProyecto } from "../services/api";

// Mapa de tabs del front (Hans) a estados del backend
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

    const handleCambiarEstado = async (proyectoId, nuevoEstado) => {
        try {
            await cambiarEstadoProyecto(proyectoId, nuevoEstado);
            await cargarProyectos();
        } catch (err) {
            setError(err.message || "Error al cambiar el estado del proyecto");
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
                                                onClick={() =>
                                                    handleCambiarEstado(proyecto.id_proyecto, "en_curso")
                                                }
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() =>
                                                    handleCambiarEstado(proyecto.id_proyecto, "cancelado")
                                                }
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}

                                    {tabActivo === "enCurso" && (
                                        <>
                                            <button
                                                className="btn btn-success"
                                                onClick={() =>
                                                    handleCambiarEstado(proyecto.id_proyecto, "finalizado")
                                                }
                                            >
                                                Finalizar
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() =>
                                                    handleCambiarEstado(proyecto.id_proyecto, "cancelado")
                                                }
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
                                            onClick={() =>
                                                handleCambiarEstado(proyecto.id_proyecto, "pendiente")
                                            }
                                        >
                                            Reactivar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}

export default Proyectos;