import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getPlantillas,
    getMaterialesDePlantilla,
    crearProyectoConMateriales,
} from "../services/api";
import {
    validarTexto,
    validarTextoOpcional,
    validarTelefono,
    validarPrecio,
    validarSeleccion,
} from "../utils/validaciones";

function NuevoProyecto() {
    const navigate = useNavigate();

    // Datos del proyecto
    const [nombreProyecto, setNombreProyecto] = useState("");
    const [tipoProyecto, setTipoProyecto] = useState("");
    const [nombreCliente, setNombreCliente] = useState("");
    const [telefonoCliente, setTelefonoCliente] = useState("");
    const [direccionCliente, setDireccionCliente] = useState("");
    const [presupuestoEstimado, setPresupuestoEstimado] = useState("");
    const [fechaTermino, setFechaTermino] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // Errores por campo
    const [errNombreProyecto, setErrNombreProyecto] = useState("");
    const [errTipoProyecto, setErrTipoProyecto] = useState("");
    const [errNombreCliente, setErrNombreCliente] = useState("");
    const [errTelefono, setErrTelefono] = useState("");
    const [errDireccion, setErrDireccion] = useState("");
    const [errPresupuesto, setErrPresupuesto] = useState("");
    const [errFecha, setErrFecha] = useState("");
    const [errPlantilla, setErrPlantilla] = useState("");
    const [errObservaciones, setErrObservaciones] = useState("");

    // Plantilla y materiales
    const [plantillas, setPlantillas] = useState([]);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");
    const [materiales, setMateriales] = useState([]);
    const [cargandoMateriales, setCargandoMateriales] = useState(false);

    // UI
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarPlantillas();
    }, []);

    const cargarPlantillas = async () => {
        try {
            const data = await getPlantillas();
            setPlantillas(data);
        } catch (err) {
            setError("Error al cargar plantillas: " + err.message);
        }
    };

    // ====== VALIDADORES POR CAMPO ======
    const vNombreProyecto = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre del proyecto" });
    const vTipoProyecto = (v) => validarTextoOpcional(v, { maximo: 25, etiqueta: "El tipo de proyecto" });
    const vNombreCliente = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre del cliente" });
    const vTelefono = (v) => validarTelefono(v, { obligatorio: false });
    const vDireccion = (v) => validarTextoOpcional(v, { maximo: 150, etiqueta: "La dirección" });
    const vPresupuesto = (v) => {
        if (!v) return ""; // opcional
        return validarPrecio(v, { etiqueta: "El presupuesto" });
    };
    const vFecha = (v) => {
        if (!v) return ""; // opcional
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fecha = new Date(v);
        if (fecha < hoy) return "La fecha no puede ser anterior a hoy";
        return "";
    };
    const vPlantilla = (v) => validarSeleccion(v, "una plantilla");
    const vObservaciones = (v) => validarTextoOpcional(v, { maximo: 500, etiqueta: "Las observaciones" });

    // ====== HANDLERS DE BLUR ======
    const blurNombreProyecto = () => setErrNombreProyecto(vNombreProyecto(nombreProyecto));
    const blurTipoProyecto = () => setErrTipoProyecto(vTipoProyecto(tipoProyecto));
    const blurNombreCliente = () => setErrNombreCliente(vNombreCliente(nombreCliente));
    const blurTelefono = () => setErrTelefono(vTelefono(telefonoCliente));
    const blurDireccion = () => setErrDireccion(vDireccion(direccionCliente));
    const blurPresupuesto = () => setErrPresupuesto(vPresupuesto(presupuestoEstimado));
    const blurFecha = () => setErrFecha(vFecha(fechaTermino));
    const blurObservaciones = () => setErrObservaciones(vObservaciones(observaciones));

    const handleCambioPlantilla = async (e) => {
        const id = e.target.value;
        setPlantillaSeleccionada(id);
        setErrPlantilla(vPlantilla(id));

        if (!id) {
            setMateriales([]);
            return;
        }

        setCargandoMateriales(true);
        try {
            const data = await getMaterialesDePlantilla(id);
            setNombreProyecto(data.nombre_servicio);
            if (data.precio_estimado) {
                setPresupuestoEstimado(data.precio_estimado);
            }
            const matsConCantidad = data.materiales.map((m) => ({
                ...m,
                cantidad_real: Number(m.cantidad_sugerida),
            }));
            setMateriales(matsConCantidad);
        } catch (err) {
            setError("Error al cargar materiales: " + err.message);
        } finally {
            setCargandoMateriales(false);
        }
    };

    const handleCambiarCantidad = (materialId, nuevaCantidad) => {
        setMateriales((prev) =>
            prev.map((m) =>
                m.material_id === materialId
                    ? { ...m, cantidad_real: Number(nuevaCantidad) }
                    : m
            )
        );
    };

    const handleQuitarMaterial = (materialId) => {
        setMateriales((prev) => prev.filter((m) => m.material_id !== materialId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validar todos los campos
        const errNP = vNombreProyecto(nombreProyecto);
        const errTP = vTipoProyecto(tipoProyecto);
        const errNC = vNombreCliente(nombreCliente);
        const errTel = vTelefono(telefonoCliente);
        const errDir = vDireccion(direccionCliente);
        const errPre = vPresupuesto(presupuestoEstimado);
        const errFec = vFecha(fechaTermino);
        const errPla = vPlantilla(plantillaSeleccionada);
        const errObs = vObservaciones(observaciones);

        setErrNombreProyecto(errNP);
        setErrTipoProyecto(errTP);
        setErrNombreCliente(errNC);
        setErrTelefono(errTel);
        setErrDireccion(errDir);
        setErrPresupuesto(errPre);
        setErrFecha(errFec);
        setErrPlantilla(errPla);
        setErrObservaciones(errObs);

        if (errNP || errTP || errNC || errTel || errDir || errPre || errFec || errPla || errObs) {
            return;
        }

        // Validaciones específicas de materiales
        if (materiales.length === 0) {
            setError("Debes incluir al menos un material en el proyecto");
            return;
        }

        for (const m of materiales) {
            if (!m.cantidad_real || m.cantidad_real <= 0) {
                setError(`La cantidad de ${m.nombre_material} debe ser mayor a cero`);
                return;
            }
            if (!Number.isInteger(Number(m.cantidad_real))) {
                setError(`La cantidad de ${m.nombre_material} debe ser un número entero`);
                return;
            }
        }

        setGuardando(true);
        try {
            const payload = {
                nombre_proyecto: nombreProyecto.trim(),
                tipo_proyecto: tipoProyecto.trim() || null,
                nombre_cliente: nombreCliente.trim(),
                telefono_cliente: telefonoCliente.trim() || null,
                direccion_cliente: direccionCliente.trim() || null,
                presupuesto_estimado: presupuestoEstimado ? Number(presupuestoEstimado) : null,
                fecha_termino_maximo: fechaTermino || null,
                plantilla_id: plantillaSeleccionada || null,
                observaciones: observaciones.trim() || null,
                materiales: materiales.map((m) => ({
                    material_id: m.material_id,
                    cantidad_planeada: m.cantidad_real,
                })),
            };

            await crearProyectoConMateriales(payload);
            navigate("/proyectos");
        } catch (err) {
            setError(err.message || "Error al crear el proyecto");
        } finally {
            setGuardando(false);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio || 0);
    };

    const totalEstimado = materiales.reduce(
        (sum, m) => sum + Number(m.precio_unitario || 0) * Number(m.cantidad_real || 0),
        0
    );

    return (
        <AppLayout>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Nuevo proyecto</h2>
                        <p className="text-muted mb-0">
                            Selecciona una plantilla y ajusta los materiales necesarios.
                        </p>
                    </div>
                    <button
                        className="btn btn-dark px-4"
                        onClick={() => navigate("/proyectos")}
                    >
                        Volver
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Datos del cliente</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Nombre del cliente *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errNombreCliente ? "is-invalid" : ""}`}
                                    value={nombreCliente}
                                    onChange={(e) => setNombreCliente(e.target.value)}
                                    onBlur={blurNombreCliente}
                                    placeholder="Ej: Carlos Iturrieta"
                                    maxLength={50}
                                />
                                {errNombreCliente && (
                                    <div className="invalid-feedback">{errNombreCliente}</div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className={`form-control ${errTelefono ? "is-invalid" : ""}`}
                                    value={telefonoCliente}
                                    onChange={(e) => setTelefonoCliente(e.target.value)}
                                    onBlur={blurTelefono}
                                    placeholder="56912345678"
                                    maxLength={15}
                                />
                                {errTelefono ? (
                                    <div className="invalid-feedback">{errTelefono}</div>
                                ) : (
                                    <small className="text-muted">Solo dígitos, entre 8 y 15</small>
                                )}
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className={`form-control ${errDireccion ? "is-invalid" : ""}`}
                                    value={direccionCliente}
                                    onChange={(e) => setDireccionCliente(e.target.value)}
                                    onBlur={blurDireccion}
                                    placeholder="Calle, número, comuna"
                                    maxLength={150}
                                />
                                {errDireccion && (
                                    <div className="invalid-feedback">{errDireccion}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Datos del servicio</h5>
                        <div className="row g-3">
                            <div className="col-md-12">
                                <label className="form-label">Plantilla de servicio *</label>
                                <select
                                    className={`form-select ${errPlantilla ? "is-invalid" : ""}`}
                                    value={plantillaSeleccionada}
                                    onChange={handleCambioPlantilla}
                                    onBlur={() => setErrPlantilla(vPlantilla(plantillaSeleccionada))}
                                >
                                    <option value="">Seleccionar plantilla...</option>
                                    {plantillas.map((p) => (
                                        <option key={p.id_plantilla} value={p.id_plantilla}>
                                            {p.nombre_servicio} — {formatearPrecio(p.precio_estimado)}
                                        </option>
                                    ))}
                                </select>
                                {errPlantilla ? (
                                    <div className="invalid-feedback">{errPlantilla}</div>
                                ) : (
                                    <small className="text-muted">
                                        Al seleccionar una plantilla se cargan los materiales sugeridos automáticamente.
                                    </small>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Nombre del proyecto *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errNombreProyecto ? "is-invalid" : ""}`}
                                    value={nombreProyecto}
                                    onChange={(e) => setNombreProyecto(e.target.value)}
                                    onBlur={blurNombreProyecto}
                                    placeholder="Se autocompleta desde la plantilla"
                                    maxLength={50}
                                />
                                {errNombreProyecto && (
                                    <div className="invalid-feedback">{errNombreProyecto}</div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Tipo de proyecto</label>
                                <input
                                    type="text"
                                    className={`form-control ${errTipoProyecto ? "is-invalid" : ""}`}
                                    value={tipoProyecto}
                                    onChange={(e) => setTipoProyecto(e.target.value)}
                                    onBlur={blurTipoProyecto}
                                    placeholder="Residencial, comercial, industrial..."
                                    maxLength={25}
                                />
                                {errTipoProyecto && (
                                    <div className="invalid-feedback">{errTipoProyecto}</div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Presupuesto estimado (CLP)</label>
                                <input
                                    type="number"
                                    className={`form-control ${errPresupuesto ? "is-invalid" : ""}`}
                                    value={presupuestoEstimado}
                                    onChange={(e) => setPresupuestoEstimado(e.target.value)}
                                    onBlur={blurPresupuesto}
                                    min="0"
                                    step="0.01"
                                />
                                {errPresupuesto && (
                                    <div className="invalid-feedback">{errPresupuesto}</div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Fecha de término máxima</label>
                                <input
                                    type="date"
                                    className={`form-control ${errFecha ? "is-invalid" : ""}`}
                                    value={fechaTermino}
                                    onChange={(e) => setFechaTermino(e.target.value)}
                                    onBlur={blurFecha}
                                />
                                {errFecha && (
                                    <div className="invalid-feedback">{errFecha}</div>
                                )}
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">Observaciones</label>
                                <textarea
                                    className={`form-control ${errObservaciones ? "is-invalid" : ""}`}
                                    rows="3"
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    onBlur={blurObservaciones}
                                    maxLength={500}
                                    placeholder="Notas adicionales sobre el proyecto (opcional)"
                                ></textarea>
                                {errObservaciones ? (
                                    <div className="invalid-feedback">{errObservaciones}</div>
                                ) : (
                                    <small className="text-muted">
                                        Máximo 500 caracteres
                                    </small>
                                )}
                            </div>
                        </div>
                    </div>

                    {plantillaSeleccionada && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Materiales del proyecto</h5>
                                <small className="text-muted">
                                    Costo de materiales (referencia interna): <strong>{formatearPrecio(totalEstimado)}</strong>
                                </small>
                            </div>

                            {cargandoMateriales ? (
                                <p className="text-muted">Cargando materiales...</p>
                            ) : materiales.length === 0 ? (
                                <p className="text-muted">
                                    Esta plantilla no tiene materiales vinculados.
                                </p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Material</th>
                                                <th className="text-center">Stock disponible</th>
                                                <th className="text-center">Cantidad a usar</th>
                                                <th className="text-end">Subtotal</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materiales.map((m) => {
                                                const subtotal =
                                                    Number(m.precio_unitario) * Number(m.cantidad_real || 0);
                                                const stockInsuficiente =
                                                    Number(m.cantidad_real) > m.stock_actual;

                                                return (
                                                    <tr key={m.material_id}>
                                                        <td>
                                                            <strong>{m.nombre_material}</strong>
                                                            <p className="text-muted mb-0 small">
                                                                {m.unidad} · {formatearPrecio(m.precio_unitario)} c/u
                                                            </p>
                                                        </td>
                                                        <td className="text-center">
                                                            <span
                                                                className={`badge ${
                                                                    m.stock_actual === 0
                                                                        ? "bg-danger"
                                                                        : m.stock_actual <= m.stock_critico
                                                                        ? "bg-warning text-dark"
                                                                        : "bg-success"
                                                                }`}
                                                            >
                                                                {m.stock_actual}
                                                            </span>
                                                        </td>
                                                        <td className="text-center" style={{ width: "150px" }}>
                                                            <input
                                                                type="number"
                                                                className={`form-control text-center ${
                                                                    stockInsuficiente ? "border-warning" : ""
                                                                }`}
                                                                value={m.cantidad_real}
                                                                onChange={(e) =>
                                                                    handleCambiarCantidad(
                                                                        m.material_id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                min="1"
                                                                step="1"
                                                            />
                                                            {stockInsuficiente && (
                                                                <small className="text-warning">
                                                                    Supera stock disponible
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td className="text-end fw-bold">
                                                            {formatearPrecio(subtotal)}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() =>
                                                                    handleQuitarMaterial(m.material_id)
                                                                }
                                                            >
                                                                Quitar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary px-4"
                            onClick={() => navigate("/proyectos")}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary px-4"
                            disabled={guardando}
                        >
                            {guardando ? "Creando..." : "Crear proyecto"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

export default NuevoProyecto;