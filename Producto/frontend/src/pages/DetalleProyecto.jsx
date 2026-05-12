import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getProyecto,
    getMaterialesPlaneadosDeProyecto,
} from "../services/api";

function DetalleProyecto() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [proyecto, setProyecto] = useState(null);
    const [materiales, setMateriales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        cargarDatos();
    }, [id]);

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [datosProyecto, datosMateriales] = await Promise.all([
                getProyecto(id),
                getMaterialesPlaneadosDeProyecto(id),
            ]);
            setProyecto(datosProyecto);
            setMateriales(datosMateriales);
        } catch (err) {
            setError(err.message || "Error al cargar el proyecto");
        } finally {
            setCargando(false);
        }
    };

    const formatearPrecio = (precio) => {
        if (precio === null || precio === undefined) return "Sin definir";
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

    const getBadgeEstado = (estado) => {
        switch (estado) {
            case "pendiente":
                return "bg-warning text-dark";
            case "en_curso":
                return "bg-primary";
            case "finalizado":
                return "bg-success";
            case "cancelado":
                return "bg-secondary";
            default:
                return "bg-secondary";
        }
    };

    const formatearEstado = (estado) => {
        const mapa = {
            pendiente: "Pendiente",
            en_curso: "En curso",
            finalizado: "Finalizado",
            cancelado: "Cancelado",
        };
        return mapa[estado] || estado;
    };

    if (cargando) {
        return (
            <AppLayout>
                <div className="text-center py-5">
                    <p className="text-muted">Cargando detalle del proyecto...</p>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className="container-fluid">
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                    <button
                        className="btn btn-dark"
                        onClick={() => navigate("/proyectos")}
                    >
                        Volver a proyectos
                    </button>
                </div>
            </AppLayout>
        );
    }

    if (!proyecto) return null;

    // Cálculos
    const costoMateriales = materiales.reduce(
        (sum, m) => sum + Number(m.precio_unitario || 0) * Number(m.cantidad_planeada || 0),
        0
    );
    const materialesConFalta = materiales.filter((m) => !m.suficiente_stock).length;

    return (
        <AppLayout>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h1 className="fw-bold mb-1">{proyecto.nombre_proyecto}</h1>
                        <p className="text-muted fs-5 mb-0">
                            Proyecto #{proyecto.id_proyecto.substring(0, 8)} —{" "}
                            <span className={`badge ${getBadgeEstado(proyecto.estado)} ms-1`}>
                                {formatearEstado(proyecto.estado)}
                            </span>
                        </p>
                    </div>

                    <button
                        className="btn btn-dark rounded-pill px-4"
                        onClick={() => navigate("/proyectos")}
                    >
                        Volver
                    </button>
                </div>

                <div className="row g-4">
                    {/* DATOS GENERALES */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div
                                className="card-header text-white fw-bold"
                                style={{
                                    background: "#2563EB",
                                    borderTopLeftRadius: "10px",
                                    borderTopRightRadius: "10px",
                                }}
                            >
                                Datos generales
                            </div>

                            <div className="card-body">
                                <p>
                                    <strong>ID Proyecto:</strong>{" "}
                                    <small className="text-muted">{proyecto.id_proyecto}</small>
                                </p>
                                <hr />

                                <p>
                                    <strong>Cliente:</strong> {proyecto.nombre_cliente}
                                </p>
                                <hr />

                                <p>
                                    <strong>Teléfono:</strong>{" "}
                                    {proyecto.telefono_cliente || "Sin definir"}
                                </p>
                                <hr />

                                <p>
                                    <strong>Dirección:</strong>{" "}
                                    {proyecto.direccion_cliente || "Sin definir"}
                                </p>
                                <hr />

                                <p>
                                    <strong>Tipo de servicio:</strong>{" "}
                                    {proyecto.tipo_proyecto || "Sin especificar"}
                                </p>
                                <hr />

                                <p>
                                    <strong>Plantilla aplicada:</strong>{" "}
                                    {proyecto.plantilla
                                        ? proyecto.plantilla.nombre_servicio
                                        : "Sin plantilla"}
                                </p>
                                <hr />

                                <p>
                                    <strong>Fecha inicio:</strong>{" "}
                                    {formatearFecha(proyecto.fecha_inicio)}
                                </p>
                                <hr />

                                <p className="mb-0">
                                    <strong>Fecha término máxima:</strong>{" "}
                                    {formatearFecha(proyecto.fecha_termino_maximo)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* COSTOS Y RECURSOS */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div
                                className="card-header text-white fw-bold"
                                style={{
                                    background: "#2563EB",
                                    borderTopLeftRadius: "10px",
                                    borderTopRightRadius: "10px",
                                }}
                            >
                                Costos y recursos
                            </div>

                            <div className="card-body">
                                <p>
                                    <strong>Presupuesto estimado:</strong>{" "}
                                    {formatearPrecio(proyecto.presupuesto_estimado)}
                                </p>
                                <hr />

                                <p>
                                    <strong>Costo de materiales (interno):</strong>{" "}
                                    {formatearPrecio(costoMateriales)}
                                </p>
                                <hr />

                                <p>
                                    <strong>Presupuesto final:</strong>{" "}
                                    {formatearPrecio(proyecto.presupuesto_final)}
                                </p>
                                <hr />

                                <p>
                                    <strong>Total materiales:</strong> {materiales.length}
                                </p>
                                <hr />

                                <p className={materialesConFalta > 0 ? "text-warning fw-bold" : ""}>
                                    <strong>Recursos pendientes:</strong> {materialesConFalta}
                                </p>

                                {proyecto.estado === "en_curso" && (
                                    <div className="alert alert-info mt-3 mb-0 small">
                                        Proyecto en ejecución. Los materiales ya fueron descontados del inventario.
                                    </div>
                                )}

                                {proyecto.estado === "pendiente" && (
                                    <div className="alert alert-warning mt-3 mb-0 small">
                                        Proyecto pendiente. Stock aún no descontado.
                                    </div>
                                )}

                                {proyecto.estado === "cancelado" && (
                                    <div className="alert alert-secondary mt-3 mb-0 small">
                                        Proyecto cancelado. Materiales devueltos al inventario.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MATERIALES PLANEADOS */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div
                                className="card-header text-white fw-bold"
                                style={{
                                    background: "#2563EB",
                                    borderTopLeftRadius: "10px",
                                    borderTopRightRadius: "10px",
                                }}
                            >
                                Materiales del proyecto
                            </div>

                            <div className="card-body">
                                {materiales.length === 0 ? (
                                    <p className="text-muted">
                                        No hay materiales registrados para este proyecto.
                                    </p>
                                ) : (
                                    <ul className="list-unstyled mb-0">
                                        {materiales.map((m, index) => (
                                            <li
                                                key={m.material_id}
                                                className={
                                                    index < materiales.length - 1 ? "mb-3 pb-3 border-bottom" : ""
                                                }
                                            >
                                                <div className="d-flex justify-content-between">
                                                    <strong>{m.nombre_material}</strong>
                                                    <span className="fw-bold">
                                                        {Number(m.cantidad_planeada)}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between small text-muted">
                                                    <span>
                                                        {formatearPrecio(m.precio_unitario)} c/u
                                                    </span>
                                                    <span>
                                                        Subtotal:{" "}
                                                        {formatearPrecio(
                                                            Number(m.precio_unitario) *
                                                                Number(m.cantidad_planeada)
                                                        )}
                                                    </span>
                                                </div>
                                                {!m.suficiente_stock && (
                                                    <div className="small text-warning mt-1">
                                                        Stock insuficiente (disponible: {m.stock_actual})
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default DetalleProyecto;