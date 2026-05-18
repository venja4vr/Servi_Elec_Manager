import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getProyecto,
    getMaterialesPlaneadosDeProyecto,
    actualizarProyecto,
} from "../services/api";
import {
    validarTexto,
    validarTextoOpcional,
    validarTelefono,
    validarPrecio,
} from "../utils/validaciones";

function DetalleProyecto() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [proyecto, setProyecto] = useState(null);
    const [materiales, setMateriales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    const [mostrarEditar, setMostrarEditar] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({});
    const [guardando, setGuardando] = useState(false);

    const [errEdNombreProyecto, setErrEdNombreProyecto] = useState("");
    const [errEdTipoProyecto, setErrEdTipoProyecto] = useState("");
    const [errEdNombreCliente, setErrEdNombreCliente] = useState("");
    const [errEdTelefono, setErrEdTelefono] = useState("");
    const [errEdDireccion, setErrEdDireccion] = useState("");
    const [errEdFechaInicio, setErrEdFechaInicio] = useState("");
    const [errEdFechaTermino, setErrEdFechaTermino] = useState("");
    const [errEdPresupuestoEst, setErrEdPresupuestoEst] = useState("");
    const [errEdPresupuestoFinal, setErrEdPresupuestoFinal] = useState("");
    const [errEdObservaciones, setErrEdObservaciones] = useState("");

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
        const [year, month, day] = fecha.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const claseEstado = (estado) => {
        switch (estado) {
            case "pendiente": return "detail-badge warning";
            case "en_curso": return "detail-badge primary";
            case "finalizado": return "detail-badge success";
            case "cancelado": return "detail-badge secondary";
            default: return "detail-badge";
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

    const vEdNombreProyecto = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre del proyecto" });
    const vEdTipoProyecto = (v) => validarTextoOpcional(v, { maximo: 25, etiqueta: "El tipo de proyecto" });
    const vEdNombreCliente = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre del cliente" });
    const vEdTelefono = (v) => validarTelefono(v, { obligatorio: false });
    const vEdDireccion = (v) => validarTextoOpcional(v, { maximo: 150, etiqueta: "La dirección" });
    const vEdPresupuesto = (v, etiqueta) => {
        if (!v) return "";
        return validarPrecio(v, { etiqueta });
    };
    const vEdObservaciones = (v) => validarTextoOpcional(v, { maximo: 500, etiqueta: "Las observaciones" });
    const vEdFechas = (inicio, termino) => {
        if (!inicio || !termino) return "";
        if (new Date(termino) < new Date(inicio)) {
            return "La fecha de término no puede ser anterior a la fecha de inicio";
        }
        return "";
    };

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
            observaciones: proyecto.observaciones || "",
        });
        setErrEdNombreProyecto("");
        setErrEdTipoProyecto("");
        setErrEdNombreCliente("");
        setErrEdTelefono("");
        setErrEdDireccion("");
        setErrEdFechaInicio("");
        setErrEdFechaTermino("");
        setErrEdPresupuestoEst("");
        setErrEdPresupuestoFinal("");
        setErrEdObservaciones("");
        setMostrarEditar(true);
    };

    const handleCambioCampo = (campo, valor) => {
        setDatosEdicion((prev) => ({ ...prev, [campo]: valor }));
    };

    const confirmarEditar = async () => {
        setError("");

        const errNP = vEdNombreProyecto(datosEdicion.nombre_proyecto);
        const errTP = vEdTipoProyecto(datosEdicion.tipo_proyecto);
        const errNC = vEdNombreCliente(datosEdicion.nombre_cliente);
        const errTel = vEdTelefono(datosEdicion.telefono_cliente);
        const errDir = vEdDireccion(datosEdicion.direccion_cliente);
        const errPreEst = vEdPresupuesto(datosEdicion.presupuesto_estimado, "El presupuesto estimado");
        const errPreFin = vEdPresupuesto(datosEdicion.presupuesto_final, "El presupuesto final");
        const errObs = vEdObservaciones(datosEdicion.observaciones);
        const errFechas = vEdFechas(datosEdicion.fecha_inicio, datosEdicion.fecha_termino_maximo);

        setErrEdNombreProyecto(errNP);
        setErrEdTipoProyecto(errTP);
        setErrEdNombreCliente(errNC);
        setErrEdTelefono(errTel);
        setErrEdDireccion(errDir);
        setErrEdPresupuestoEst(errPreEst);
        setErrEdPresupuestoFinal(errPreFin);
        setErrEdObservaciones(errObs);
        setErrEdFechaTermino(errFechas);

        if (errNP || errTP || errNC || errTel || errDir || errPreEst || errPreFin || errObs || errFechas) {
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                nombre_proyecto: datosEdicion.nombre_proyecto.trim(),
                tipo_proyecto: datosEdicion.tipo_proyecto?.trim() || null,
                nombre_cliente: datosEdicion.nombre_cliente.trim(),
                telefono_cliente: datosEdicion.telefono_cliente?.trim() || null,
                direccion_cliente: datosEdicion.direccion_cliente?.trim() || null,
                fecha_inicio: datosEdicion.fecha_inicio || null,
                fecha_termino_maximo: datosEdicion.fecha_termino_maximo || null,
                presupuesto_estimado: datosEdicion.presupuesto_estimado
                    ? Number(datosEdicion.presupuesto_estimado)
                    : null,
                presupuesto_final: datosEdicion.presupuesto_final
                    ? Number(datosEdicion.presupuesto_final)
                    : null,
                observaciones: datosEdicion.observaciones?.trim() || null,
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
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    Cargando detalle del proyecto...
                </div>
            </AppLayout>
        );
    }

    if (error && !proyecto) {
        return (
            <AppLayout>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <button
                    className="cancel-btn"
                    onClick={() => navigate("/proyectos")}
                >
                    Volver a proyectos
                </button>
            </AppLayout>
        );
    }

    if (!proyecto) return null;

    const costoMateriales = materiales.reduce(
        (sum, m) => sum + Number(m.precio_unitario || 0) * Number(m.cantidad_planeada || 0),
        0
    );
    const materialesConFalta = materiales.filter((m) => !m.suficiente_stock).length;
    const sePuedeEditar = proyecto.estado === "pendiente" || proyecto.estado === "en_curso";

    return (
        <AppLayout>
            <div className="project-detail-page">
                <div className="project-detail-header">
                    <div>
                        <h1>{proyecto.nombre_proyecto}</h1>
                        <p>
                            Proyecto #{proyecto.id_proyecto.substring(0, 8)} —{" "}
                            <span className={claseEstado(proyecto.estado)}>
                                {formatearEstado(proyecto.estado)}
                            </span>
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        {sePuedeEditar && (
                            <button onClick={abrirEditar}>
                                Editar proyecto
                            </button>
                        )}
                        <button onClick={() => navigate("/proyectos")}>
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

                <div className="detail-grid">
                    {/* DATOS GENERALES */}
                    <div className="detail-card">
                        <h2>Datos generales</h2>

                        <div className="detail-row">
                            <strong>ID Proyecto:</strong>
                            <span style={{ fontSize: "0.85rem" }}>{proyecto.id_proyecto}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Cliente:</strong>
                            <span>{proyecto.nombre_cliente}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Teléfono:</strong>
                            <span>{proyecto.telefono_cliente || "Sin definir"}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Dirección:</strong>
                            <span>{proyecto.direccion_cliente || "Sin definir"}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Tipo de servicio:</strong>
                            <span>{proyecto.tipo_proyecto || "Sin especificar"}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Plantilla:</strong>
                            <span>
                                {proyecto.plantilla
                                    ? proyecto.plantilla.nombre_servicio
                                    : "Sin plantilla"}
                            </span>
                        </div>
                        <div className="detail-row">
                            <strong>Fecha inicio:</strong>
                            <span>{formatearFecha(proyecto.fecha_inicio)}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Fecha término:</strong>
                            <span>{formatearFecha(proyecto.fecha_termino_maximo)}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Estado:</strong>
                            <span className={claseEstado(proyecto.estado)}>
                                {formatearEstado(proyecto.estado)}
                            </span>
                        </div>

                        <h3>Observaciones</h3>
                        {proyecto.observaciones ? (
                            <p>{proyecto.observaciones}</p>
                        ) : (
                            <p style={{ fontStyle: "italic", color: "#888" }}>
                                Sin observaciones
                            </p>
                        )}
                    </div>

                    {/* COSTOS Y RECURSOS */}
                    <div className="detail-card">
                        <h2>Costos y recursos</h2>

                        <div className="detail-row">
                            <strong>Presupuesto estimado:</strong>
                            <span>{formatearPrecio(proyecto.presupuesto_estimado)}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Costo materiales (interno):</strong>
                            <span>{formatearPrecio(costoMateriales)}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Presupuesto final:</strong>
                            <span>{formatearPrecio(proyecto.presupuesto_final)}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Total materiales:</strong>
                            <span>{materiales.length}</span>
                        </div>
                        <div className="detail-row">
                            <strong>Recursos pendientes:</strong>
                            <span className={materialesConFalta > 0 ? "text-warning" : ""}>
                                {materialesConFalta}
                            </span>
                        </div>

                        {proyecto.estado === "en_curso" && (
                            <div className="alert alert-info">
                                Proyecto en ejecución. Los materiales ya fueron descontados del inventario.
                            </div>
                        )}
                        {proyecto.estado === "pendiente" && (
                            <div className="alert alert-warning">
                                Proyecto pendiente. Stock aún no descontado.
                            </div>
                        )}
                        {proyecto.estado === "cancelado" && (
                            <div className="alert alert-secondary">
                                Proyecto cancelado. Materiales devueltos al inventario.
                            </div>
                        )}
                    </div>

                    {/* MATERIALES */}
                    <div className="detail-card">
                        <h2>Materiales del proyecto</h2>

                        {materiales.length === 0 ? (
                            <p>No hay materiales registrados para este proyecto.</p>
                        ) : (
                            <ul>
                                {materiales.map((m) => (
                                    <li key={m.material_id}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                                            <span>{m.nombre_material}</span>
                                            <span>{Number(m.cantidad_planeada)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#666" }}>
                                            <span>{formatearPrecio(m.precio_unitario)} c/u</span>
                                            <span>
                                                Subtotal: {formatearPrecio(
                                                    Number(m.precio_unitario) * Number(m.cantidad_planeada)
                                                )}
                                            </span>
                                        </div>
                                        {!m.suficiente_stock && (
                                            <div style={{ fontSize: "0.8rem", color: "#d97706", marginTop: "0.25rem" }}>
                                                Stock insuficiente (disponible: {m.stock_actual})
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
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
                                                className={`form-control ${errEdNombreCliente ? "is-invalid" : ""}`}
                                                value={datosEdicion.nombre_cliente}
                                                onChange={(e) => handleCambioCampo("nombre_cliente", e.target.value)}
                                                onBlur={() => setErrEdNombreCliente(vEdNombreCliente(datosEdicion.nombre_cliente))}
                                                maxLength={50}
                                            />
                                            {errEdNombreCliente && (
                                                <div className="invalid-feedback">{errEdNombreCliente}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Teléfono</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errEdTelefono ? "is-invalid" : ""}`}
                                                value={datosEdicion.telefono_cliente}
                                                onChange={(e) => handleCambioCampo("telefono_cliente", e.target.value)}
                                                onBlur={() => setErrEdTelefono(vEdTelefono(datosEdicion.telefono_cliente))}
                                                maxLength={15}
                                                placeholder="56912345678"
                                            />
                                            {errEdTelefono && (
                                                <div className="invalid-feedback">{errEdTelefono}</div>
                                            )}
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Dirección</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errEdDireccion ? "is-invalid" : ""}`}
                                                value={datosEdicion.direccion_cliente}
                                                onChange={(e) => handleCambioCampo("direccion_cliente", e.target.value)}
                                                onBlur={() => setErrEdDireccion(vEdDireccion(datosEdicion.direccion_cliente))}
                                                maxLength={150}
                                            />
                                            {errEdDireccion && (
                                                <div className="invalid-feedback">{errEdDireccion}</div>
                                            )}
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-3">Datos del proyecto</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Nombre del proyecto *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errEdNombreProyecto ? "is-invalid" : ""}`}
                                                value={datosEdicion.nombre_proyecto}
                                                onChange={(e) => handleCambioCampo("nombre_proyecto", e.target.value)}
                                                onBlur={() => setErrEdNombreProyecto(vEdNombreProyecto(datosEdicion.nombre_proyecto))}
                                                maxLength={50}
                                            />
                                            {errEdNombreProyecto && (
                                                <div className="invalid-feedback">{errEdNombreProyecto}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Tipo de proyecto</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errEdTipoProyecto ? "is-invalid" : ""}`}
                                                value={datosEdicion.tipo_proyecto}
                                                onChange={(e) => handleCambioCampo("tipo_proyecto", e.target.value)}
                                                onBlur={() => setErrEdTipoProyecto(vEdTipoProyecto(datosEdicion.tipo_proyecto))}
                                                maxLength={25}
                                            />
                                            {errEdTipoProyecto && (
                                                <div className="invalid-feedback">{errEdTipoProyecto}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Fecha de inicio</label>
                                            <input
                                                type="date"
                                                className={`form-control ${errEdFechaInicio ? "is-invalid" : ""}`}
                                                value={datosEdicion.fecha_inicio}
                                                onChange={(e) => handleCambioCampo("fecha_inicio", e.target.value)}
                                            />
                                            {errEdFechaInicio && (
                                                <div className="invalid-feedback">{errEdFechaInicio}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Fecha de término máximo</label>
                                            <input
                                                type="date"
                                                className={`form-control ${errEdFechaTermino ? "is-invalid" : ""}`}
                                                value={datosEdicion.fecha_termino_maximo}
                                                onChange={(e) => handleCambioCampo("fecha_termino_maximo", e.target.value)}
                                            />
                                            {errEdFechaTermino && (
                                                <div className="invalid-feedback">{errEdFechaTermino}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Presupuesto estimado (CLP)</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errEdPresupuestoEst ? "is-invalid" : ""}`}
                                                min="0"
                                                step="0.01"
                                                value={datosEdicion.presupuesto_estimado}
                                                onChange={(e) => handleCambioCampo("presupuesto_estimado", e.target.value)}
                                                onBlur={() => setErrEdPresupuestoEst(vEdPresupuesto(datosEdicion.presupuesto_estimado, "El presupuesto estimado"))}
                                            />
                                            {errEdPresupuestoEst && (
                                                <div className="invalid-feedback">{errEdPresupuestoEst}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Presupuesto final (CLP)</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errEdPresupuestoFinal ? "is-invalid" : ""}`}
                                                min="0"
                                                step="0.01"
                                                value={datosEdicion.presupuesto_final}
                                                onChange={(e) => handleCambioCampo("presupuesto_final", e.target.value)}
                                                onBlur={() => setErrEdPresupuestoFinal(vEdPresupuesto(datosEdicion.presupuesto_final, "El presupuesto final"))}
                                            />
                                            {errEdPresupuestoFinal ? (
                                                <div className="invalid-feedback">{errEdPresupuestoFinal}</div>
                                            ) : (
                                                <small className="text-muted">
                                                    Costo final una vez completado el servicio
                                                </small>
                                            )}
                                        </div>

                                        <div className="col-md-12">
                                            <label className="form-label">Observaciones</label>
                                            <textarea
                                                className={`form-control ${errEdObservaciones ? "is-invalid" : ""}`}
                                                rows="3"
                                                value={datosEdicion.observaciones || ""}
                                                onChange={(e) => handleCambioCampo("observaciones", e.target.value)}
                                                onBlur={() => setErrEdObservaciones(vEdObservaciones(datosEdicion.observaciones))}
                                                maxLength={500}
                                                placeholder="Notas adicionales sobre el proyecto"
                                            ></textarea>
                                            {errEdObservaciones ? (
                                                <div className="invalid-feedback">{errEdObservaciones}</div>
                                            ) : (
                                                <small className="text-muted">
                                                    Máximo 500 caracteres
                                                </small>
                                            )}
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