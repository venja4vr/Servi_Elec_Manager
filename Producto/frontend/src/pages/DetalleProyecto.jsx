import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getProyecto,
    getMaterialesPlaneadosDeProyecto,
    actualizarProyecto,
} from "../services/api";

function DetalleProyecto() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [proyecto, setProyecto] = useState(null);
    const [materiales, setMateriales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    // Modal de edición
    const [mostrarEditar, setMostrarEditar] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({});
    const [guardando, setGuardando] = useState(false);

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

    // EDITAR PROYECTO
    const abrirEditar = () => {
        setDatosEdicion({
            nombre_proyecto: proyecto.nombre_proyecto || "",
            tipo_proyecto: proyecto.tipo_proyecto || "",
            nombre_cliente: proyecto.nombre_cliente || "",
            telefono_cliente: proyecto.telefono_cliente || "",
            direccion_cliente: proyecto.direccion_cliente || "",
            fecha_inicio: proyecto.fecha_inicio || "",
            fecha_termino_maximo: proyecto.fecha_termino_maximo || "",
            presupuesto_estimado: proyecto.presupuesto_estimado || "",
            presupuesto_final: proyecto.presupuesto_final || "",
        });
        setMostrarEditar(true);
    };

    const handleCambioCampo = (campo, valor) => {
        setDatosEdicion((prev) => ({ ...prev, [campo]: valor }));
    };

    const confirmarEditar = async () => {
        setError("");
        if (!datosEdicion.nombre_proyecto.trim() || !datosEdicion.nombre_cliente.trim()) {
            setError("El nombre del proyecto y del cliente son obligatorios");
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                nombre_proyecto: datosEdicion.nombre_proyecto,
                tipo_proyecto: datosEdicion.tipo_proyecto || null,
                nombre_cliente: datosEdicion.nombre_cliente,
                telefono_cliente: datosEdicion.telefono_cliente || null,
                direccion_cliente: datosEdicion.direccion_cliente || null,
                fecha_inicio: datosEdicion.fecha_inicio || null,
                fecha_termino_maximo: datosEdicion.fecha_termino_maximo || null,
                presupuesto_estimado: datosEdicion.presupuesto_estimado
                    ? Number(datosEdicion.presupuesto_estimado)
                    : null,
                presupuesto_final: datosEdicion.presupuesto_final
                    ? Number(datosEdicion.presupuesto_final)
                    : null,
            };
            await actualizarProyecto(id, payload);
            setMostrarEditar(false);
            setMensajeOk("Proyecto actualizado correctamente.");
            setTimeout(() => setMensajeOk(""), 3000);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al actualizar el proyecto");
        } finally {
            setGuardando(false);
        }
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

    if (error && !proyecto) {
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
    const sePuedeEditar = proyecto.estado === "pendiente" || proyecto.estado === "en_curso";

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

                    <div className="d-flex gap-2">
                        {sePuedeEditar && (
                            <button
                                className="btn btn-primary rounded-pill px-4"
                                onClick={abrirEditar}
                            >
                                Editar proyecto
                            </button>
                        )}
                        <button
                            className="btn btn-dark rounded-pill px-4"
                            onClick={() => navigate("/proyectos")}
                        >
                            Volver
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                {mensajeOk && (
                    <div className="alert alert-success" role="alert">
                        {mensajeOk}
                    </div>
                )}

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

                {/* MODAL EDITAR */}
                {mostrarEditar && (
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Editar proyecto</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setMostrarEditar(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <h6 className="fw-bold mb-3">Datos del cliente</h6>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label">Nombre del cliente *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={datosEdicion.nombre_cliente}
                                                onChange={(e) =>
                                                    handleCambioCampo("nombre_cliente", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Teléfono</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={datosEdicion.telefono_cliente}
                                                onChange={(e) =>
                                                    handleCambioCampo("telefono_cliente", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Dirección</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={datosEdicion.direccion_cliente}
                                                onChange={(e) =>
                                                    handleCambioCampo("direccion_cliente", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-3">Datos del proyecto</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Nombre del proyecto *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={datosEdicion.nombre_proyecto}
                                                onChange={(e) =>
                                                    handleCambioCampo("nombre_proyecto", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Tipo de proyecto</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={datosEdicion.tipo_proyecto}
                                                onChange={(e) =>
                                                    handleCambioCampo("tipo_proyecto", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Fecha de inicio</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={datosEdicion.fecha_inicio}
                                                onChange={(e) =>
                                                    handleCambioCampo("fecha_inicio", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Fecha de término máximo</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={datosEdicion.fecha_termino_maximo}
                                                onChange={(e) =>
                                                    handleCambioCampo("fecha_termino_maximo", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Presupuesto estimado (CLP)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={datosEdicion.presupuesto_estimado}
                                                onChange={(e) =>
                                                    handleCambioCampo("presupuesto_estimado", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Presupuesto final (CLP)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={datosEdicion.presupuesto_final}
                                                onChange={(e) =>
                                                    handleCambioCampo("presupuesto_final", e.target.value)
                                                }
                                            />
                                            <small className="text-muted">
                                                Costo final una vez completado el servicio
                                            </small>
                                        </div>
                                    </div>

                                    <div className="alert alert-info mt-3 mb-0 small">
                                        Los materiales del proyecto no se editan desde acá. Para cambios en materiales, cancela el proyecto y crea uno nuevo.
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setMostrarEditar(false)}
                                        disabled={guardando}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={confirmarEditar}
                                        disabled={guardando}
                                    >
                                        {guardando ? "Guardando..." : "Guardar cambios"}
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

export default DetalleProyecto;