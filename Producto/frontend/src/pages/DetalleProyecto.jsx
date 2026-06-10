import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getProyecto,
    getMateriales,
    getMaterialesPlaneadosDeProyecto,
    actualizarProyecto,
    agregarMaterialProyecto,
    actualizarCantidadMaterial,
    quitarMaterialProyecto,
    descargarPdfProyecto,
    descargarPdfClienteProyecto,
    getComunaGrupos,
    getCostosProyecto,
    actualizarCostosProyecto,
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

    const [descargandoPdf, setDescargandoPdf] = useState(false);
    const [descargandoPdfCliente, setDescargandoPdfCliente] = useState(false);

    const [mostrarEditar, setMostrarEditar] = useState(false);

    // ── Estado gestión de materiales ──────────────────────────────────────────
    const [materialesEdicion, setMaterialesEdicion] = useState([]);
    const [todosMats, setTodosMats] = useState([]);
    const [modoMaterial, setModoMaterial] = useState("inventario"); // "inventario" | "externo_nuevo"
    const [busqMat, setBusqMat] = useState("");
    const [matSelec, setMatSelec] = useState(null);
    const [cantNuevo, setCantNuevo] = useState("1");
    const [externoNuevo, setExternoNuevo] = useState(false);
    const [nombreExterno, setNombreExterno] = useState("");
    const [precioExterno, setPrecioExterno] = useState("0");
    const [errNuevoMat, setErrNuevoMat] = useState("");
    const [guardandoMat, setGuardandoMat] = useState(false);
    const [cantEdits, setCantEdits] = useState({});
    const [confirmDlg, setConfirmDlg] = useState(null);
    const [datosEdicion, setDatosEdicion] = useState({});
    const [guardando, setGuardando] = useState(false);

    // ── Estado costos ─────────────────────────────────────────────────────────
    const [comunaGrupos, setComunaGrupos] = useState([]);
    const [costos, setCostos] = useState(null);
    const [recalculando, setRecalculando] = useState(false);
    const [errCostos, setErrCostos] = useState("");
    const [diasEstimados, setDiasEstimados] = useState("1");
    const [cantTrabajadores, setCantTrabajadores] = useState("1");
    const [comunaGrupoId, setComunaGrupoId] = useState("");
    const [pctGanancia, setPctGanancia] = useState("15");
    const [precioDia, setPrecioDia] = useState("60000");
    const [errDias, setErrDias] = useState("");
    const [errTrabajadores, setErrTrabajadores] = useState("");

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
            const [datosProyecto, datosMateriales, datosCostos] = await Promise.all([
                getProyecto(id),
                getMaterialesPlaneadosDeProyecto(id),
                getCostosProyecto(id).catch(() => null),
            ]);
            setProyecto(datosProyecto);
            setMateriales(datosMateriales);
            setCostos(datosCostos);
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
    const vEdTipoProyecto = (v) => (!v ? "Selecciona un tipo de proyecto" : "");
    const vEdNombreCliente = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre del cliente" });
    const vEdTelefono = (v) => validarTelefono(v, { obligatorio: false });
    const vEdDireccion = (v) => validarTextoOpcional(v, { maximo: 200, etiqueta: "La dirección" });
    const vEdPresupuesto = (v, etiqueta) => {
        if (!v) return "";
        return validarPrecio(v, { etiqueta });
    };
    const vEdObservaciones = (v) => validarTextoOpcional(v, { maximo: 500, etiqueta: "Las observaciones" });
    const vEdFechas = (inicio, termino) => {
        if (!inicio || !termino) return "";
        if (new Date(termino) < new Date(inicio)) {
            return "La fecha de término debe ser posterior a la fecha de inicio";
        }
        return "";
    };

    const handleDescargarPdf = async () => {
        setDescargandoPdf(true);
        setError("");
        try {
            await descargarPdfProyecto(id);
        } catch (err) {
            setError(err.message || "Error al generar el PDF");
        } finally {
            setDescargandoPdf(false);
        }
    };

    const handleDescargarPdfCliente = async () => {
        setDescargandoPdfCliente(true);
        setError("");
        try {
            await descargarPdfClienteProyecto(id);
        } catch (err) {
            setError(err.message || "Error al generar el PDF cliente");
        } finally {
            setDescargandoPdfCliente(false);
        }
    };

    const abrirEditar = async () => {
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
        // Inicializar gestión de materiales
        setMaterialesEdicion([...materiales]);
        setCantEdits({});
        setModoMaterial("inventario");
        setBusqMat("");
        setMatSelec(null);
        setCantNuevo("1");
        setExternoNuevo(false);
        setNombreExterno("");
        setPrecioExterno("0");
        setErrNuevoMat("");
        setConfirmDlg(null);
        setMostrarEditar(true);
        // Cargar catálogo de materiales en background (para autocomplete)
        try {
            const todos = await getMateriales();
            setTodosMats(todos);
        } catch {
            // non-critical
        }
        // Inicializar campos de costos desde datos del proyecto
        setDiasEstimados(String(proyecto.dias_estimados || 1));
        setCantTrabajadores(String(proyecto.cantidad_trabajadores || 1));
        setComunaGrupoId(proyecto.comuna_grupo_id || "");
        setPctGanancia(String(proyecto.porcentaje_ganancia || 15));
        setPrecioDia(String(proyecto.precio_dia_trabajador || 60000));
        setErrDias(""); setErrTrabajadores(""); setErrCostos("");
        // Cargar grupos de comunas para el select
        try {
            const grupos = await getComunaGrupos();
            setComunaGrupos(grupos);
        } catch {
            // non-critical
        }
    };

    const handleCambioCampo = (campo, valor) => {
        setDatosEdicion((prev) => ({ ...prev, [campo]: valor }));
    };

    // ── Handlers de gestión de materiales ────────────────────────────────────
    const refrescarMateriales = async () => {
        const refreshed = await getMaterialesPlaneadosDeProyecto(id);
        setMateriales(refreshed);
        setMaterialesEdicion(refreshed);
    };

    const iniciarAgregarMaterial = () => {
        const cant = Number(cantNuevo);
        if (!cant || cant <= 0) { setErrNuevoMat("La cantidad debe ser mayor a 0"); return; }

        if (modoMaterial === "externo_nuevo") {
            if (!nombreExterno.trim()) { setErrNuevoMat("Escribe el nombre del material externo"); return; }
            setErrNuevoMat("");
            ejecutarAgregarExternoNuevo();
            return;
        }

        // modo inventario
        if (!matSelec) { setErrNuevoMat("Selecciona un material de la lista"); return; }
        if (materialesEdicion.find((m) => m.material_id === matSelec.id_material)) {
            setErrNuevoMat("Este material ya está en el proyecto"); return;
        }
        setErrNuevoMat("");

        if (proyecto.estado === "en_curso" && !externoNuevo) {
            setConfirmDlg({
                titulo: "¿Descontar del inventario?",
                mensaje: `Se agregarán ${cant} uds. de "${matSelec.nombre_material}" al proyecto.\n\nSi lo provee el cliente o no sale del stock de Servi Elec, elige NO.`,
                btn1: { label: "NO, material externo", variant: "outline-secondary", onClick: () => ejecutarAgregarInventario(true) },
                btn2: { label: "SÍ, descontar del inventario", variant: "primary", onClick: () => ejecutarAgregarInventario(false) },
            });
        } else {
            ejecutarAgregarInventario(externoNuevo);
        }
    };

    const ejecutarAgregarInventario = async (esExterno) => {
        setConfirmDlg(null);
        setGuardandoMat(true);
        try {
            await agregarMaterialProyecto(id, { material_id: matSelec.id_material, cantidad: Number(cantNuevo), externo: esExterno });
            await refrescarMateriales();
            setMatSelec(null); setBusqMat(""); setCantNuevo("1"); setExternoNuevo(false);
        } catch (err) {
            setErrNuevoMat(err.message || "Error al agregar material");
        } finally {
            setGuardandoMat(false);
        }
    };

    const ejecutarAgregarExternoNuevo = async () => {
        setGuardandoMat(true);
        try {
            await agregarMaterialProyecto(id, {
                nombre_externo: nombreExterno.trim(),
                precio_externo: Number(precioExterno) || 0,
                cantidad: Number(cantNuevo),
            });
            await refrescarMateriales();
            setNombreExterno(""); setPrecioExterno("0"); setCantNuevo("1");
        } catch (err) {
            setErrNuevoMat(err.message || "Error al agregar material externo");
        } finally {
            setGuardandoMat(false);
        }
    };

    const iniciarQuitarMaterial = (m) => {
        // Externo (inventario marcado o nuevo) o pendiente → sin confirmación
        if (m.externo || proyecto.estado === "pendiente") {
            ejecutarQuitarMaterial(m, false); return;
        }
        setConfirmDlg({
            titulo: "¿Devolver al inventario?",
            mensaje: `¿Devolver ${Number(m.cantidad_planeada)} uds. de "${m.nombre_material}" al stock?`,
            btn1: { label: "NO, material ya consumido", variant: "outline-secondary", onClick: () => ejecutarQuitarMaterial(m, false) },
            btn2: { label: "SÍ, devolver al stock", variant: "success", onClick: () => ejecutarQuitarMaterial(m, true) },
        });
    };

    const ejecutarQuitarMaterial = async (m, devolverStock) => {
        setConfirmDlg(null);
        setGuardandoMat(true);
        try {
            await quitarMaterialProyecto(id, m.id_pm, devolverStock);
            await refrescarMateriales();
            setCantEdits((prev) => { const n = { ...prev }; delete n[m.id_pm]; return n; });
        } catch (err) {
            setErrNuevoMat(err.message || "Error al eliminar material");
        } finally {
            setGuardandoMat(false);
        }
    };

    const iniciarCambiarCantidad = async (m) => {
        const nuevaCant = Number(cantEdits[m.id_pm]);
        if (!nuevaCant || nuevaCant <= 0) {
            setCantEdits((prev) => ({ ...prev, [m.id_pm]: String(Number(m.cantidad_planeada)) })); return;
        }
        if (nuevaCant === Number(m.cantidad_planeada)) return;

        if (proyecto.estado === "pendiente" || m.externo) {
            await ejecutarCambiarCantidad(m, nuevaCant, false); return;
        }
        const diff = nuevaCant - Number(m.cantidad_planeada);
        if (diff > 0) {
            await ejecutarCambiarCantidad(m, nuevaCant, true);
        } else {
            setConfirmDlg({
                titulo: "¿Devolver diferencia al inventario?",
                mensaje: `Reducción de "${m.nombre_material}": ${Number(m.cantidad_planeada)} → ${nuevaCant} uds.\n¿Devolver ${Math.abs(diff)} uds. al stock?`,
                btn1: { label: "NO, no devolver", variant: "outline-secondary", onClick: () => ejecutarCambiarCantidad(m, nuevaCant, false) },
                btn2: { label: "SÍ, devolver diferencia", variant: "success", onClick: () => ejecutarCambiarCantidad(m, nuevaCant, true) },
            });
        }
    };

    const ejecutarCambiarCantidad = async (m, nuevaCant, ajustarStock) => {
        setConfirmDlg(null);
        setGuardandoMat(true);
        try {
            await actualizarCantidadMaterial(id, m.id_pm, nuevaCant, ajustarStock);
            await refrescarMateriales();
        } catch (err) {
            setErrNuevoMat(err.message || "Error al cambiar cantidad");
            setCantEdits((prev) => ({ ...prev, [m.id_pm]: String(Number(m.cantidad_planeada)) }));
        } finally {
            setGuardandoMat(false);
        }
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
            // Actualizar parámetros de costos (no crítico — no bloquea el guardado)
            const diasN = Number(diasEstimados);
            const trabN = Number(cantTrabajadores);
            if (diasN >= 1 && trabN >= 1) {
                try {
                    const nuevosCostos = await actualizarCostosProyecto(id, {
                        dias_estimados: diasN,
                        cantidad_trabajadores: trabN,
                        comuna_grupo_id: comunaGrupoId || null,
                        porcentaje_ganancia: Number(pctGanancia) || 15,
                        precio_dia_trabajador: Number(precioDia) || 60000,
                    });
                    setCostos(nuevosCostos);
                } catch {
                    // non-critical
                }
            }
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

    const handleRecalcularCostos = async () => {
        const diasN = Number(diasEstimados);
        const trabN = Number(cantTrabajadores);
        if (diasN < 1) { setErrDias("Mínimo 1 día"); return; }
        if (trabN < 1) { setErrTrabajadores("Mínimo 1 trabajador"); return; }
        setRecalculando(true);
        setErrCostos("");
        try {
            const nuevosCostos = await actualizarCostosProyecto(id, {
                dias_estimados: diasN,
                cantidad_trabajadores: trabN,
                comuna_grupo_id: comunaGrupoId || null,
                porcentaje_ganancia: Number(pctGanancia) || 15,
                precio_dia_trabajador: Number(precioDia) || 60000,
            });
            setCostos(nuevosCostos);
        } catch (err) {
            setErrCostos(err.message || "Error al recalcular costos");
        } finally {
            setRecalculando(false);
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
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleDescargarPdf}
                            disabled={descargandoPdf}
                        >
                            {descargandoPdf ? "Generando..." : "PDF Empresa"}
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handleDescargarPdfCliente}
                            disabled={descargandoPdfCliente}
                        >
                            {descargandoPdfCliente ? "Generando..." : "PDF Cliente"}
                        </button>
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

                {/* DESGLOSE DE COSTOS */}
                {costos && (
                    <div className="detail-card" style={{ marginTop: "1.5rem" }}>
                        <h2>Desglose de costos</h2>
                        {costos.materiales_sin_precio?.length > 0 && (
                            <div className="alert alert-warning py-2 small">
                                ⚠️ Materiales sin precio: {costos.materiales_sin_precio.join(", ")}
                            </div>
                        )}
                        <div>
                            <div className="detail-row">
                                <strong>Subtotal materiales:</strong>
                                <span>{formatearPrecio(costos.subtotal_materiales)}</span>
                            </div>
                            <div className="detail-row">
                                <strong>
                                    Costo bencina
                                    {costos.detalles ? ` (${Number(costos.detalles.km_distancia || 0).toFixed(0)} km, ${costos.detalles.dias_estimados} días)` : ""}:
                                </strong>
                                <span>{formatearPrecio(costos.costo_bencina)}</span>
                            </div>
                            <div className="detail-row">
                                <strong>
                                    Mano de obra
                                    {costos.detalles ? ` (${costos.detalles.cantidad_trabajadores} trab. × ${costos.detalles.dias_estimados} días)` : ""}:
                                </strong>
                                <span>{formatearPrecio(costos.costo_mano_obra)}</span>
                            </div>
                            <hr style={{ border: "1px solid #e6dfd2", margin: "0.5rem 0" }} />
                            <div className="detail-row">
                                <strong>Subtotal:</strong>
                                <span>{formatearPrecio(costos.subtotal_sin_ganancia)}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Ganancia ({costos.detalles ? Number(costos.detalles.porcentaje_ganancia).toFixed(0) : 15}%):</strong>
                                <span>{formatearPrecio(costos.monto_ganancia)}</span>
                            </div>
                            <hr style={{ border: "2px solid #4d5b43", margin: "0.5rem 0" }} />
                            <div className="detail-row" style={{ fontSize: "1.1rem" }}>
                                <strong>TOTAL FINAL:</strong>
                                <span style={{ fontWeight: "900", color: "#2e321b", fontSize: "1.3rem" }}>
                                    {formatearPrecio(costos.total_final)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL EDITAR */}
                {mostrarEditar && (
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
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
                                                maxLength={20}
                                                placeholder="+56 9 1234 5678"
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
                                                maxLength={200}
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
                                            <select
                                                className={`form-select ${errEdTipoProyecto ? "is-invalid" : ""}`}
                                                value={datosEdicion.tipo_proyecto}
                                                onChange={(e) => handleCambioCampo("tipo_proyecto", e.target.value)}
                                                onBlur={() => setErrEdTipoProyecto(vEdTipoProyecto(datosEdicion.tipo_proyecto))}
                                            >
                                                <option value="">Sin especificar</option>
                                                <option value="Residencial">Residencial</option>
                                                <option value="Comercial">Comercial</option>
                                                <option value="Industrial">Industrial</option>
                                                <option value="Chatbot">Chatbot (WhatsApp)</option>
                                            </select>
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
                                            <div className="d-flex justify-content-between align-items-start mt-1">
                                                {errEdObservaciones
                                                    ? <div className="text-danger small">{errEdObservaciones}</div>
                                                    : <span />
                                                }
                                                <small className={`text-${(datosEdicion.observaciones || "").length >= 450 ? "warning" : "muted"}`}>
                                                    {(datosEdicion.observaciones || "").length}/500
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── MATERIALES DEL PROYECTO ─────────────── */}
                                    <hr className="my-4" />
                                    <h6 className="fw-bold mb-3">
                                        {sePuedeEditar ? "Materiales del proyecto" : "Materiales utilizados"}
                                    </h6>

                                    {errNuevoMat && (
                                        <div className="alert alert-danger small py-1 mb-2">
                                            {errNuevoMat}
                                        </div>
                                    )}

                                    {/* Tabla de materiales actuales */}
                                    {materialesEdicion.length === 0 ? (
                                        <p className="text-muted small">Sin materiales asignados.</p>
                                    ) : (
                                        <div className="table-responsive mb-3">
                                            <table className="table table-sm table-bordered mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Material</th>
                                                        <th style={{ width: "100px" }}>Cant.</th>
                                                        <th style={{ width: "110px" }}>Precio unit.</th>
                                                        <th style={{ width: "90px" }}>Stock</th>
                                                        {sePuedeEditar && <th style={{ width: "70px" }}></th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {materialesEdicion.map((m) => (
                                                        <tr key={m.id_pm}>
                                                            <td>
                                                                {m.nombre_material}
                                                                {m.es_externo_nuevo && (
                                                                    <span className="badge bg-warning text-dark ms-2 small">externo nuevo</span>
                                                                )}
                                                                {m.externo && !m.es_externo_nuevo && (
                                                                    <span className="badge bg-secondary ms-2 small">externo</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {sePuedeEditar ? (
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={cantEdits[m.id_pm] ?? Number(m.cantidad_planeada)}
                                                                        onChange={(e) => setCantEdits((prev) => ({ ...prev, [m.id_pm]: e.target.value }))}
                                                                        onBlur={() => iniciarCambiarCantidad(m)}
                                                                        min="1"
                                                                        disabled={guardandoMat}
                                                                    />
                                                                ) : (
                                                                    <span>{Number(m.cantidad_planeada)}</span>
                                                                )}
                                                            </td>
                                                            <td className="small">
                                                                {m.precio_unitario && Number(m.precio_unitario) > 0
                                                                    ? formatearPrecio(m.precio_unitario)
                                                                    : <span className="text-muted">—</span>
                                                                }
                                                            </td>
                                                            <td className="small">
                                                                {m.stock_actual === null
                                                                    ? <span className="text-muted">N/A</span>
                                                                    : m.stock_actual === 0
                                                                        ? <span className="text-danger fw-bold">⚠ 0</span>
                                                                        : m.stock_actual
                                                                }
                                                            </td>
                                                            {sePuedeEditar && (
                                                                <td>
                                                                    <button
                                                                        className="btn btn-outline-danger btn-sm"
                                                                        onClick={() => iniciarQuitarMaterial(m)}
                                                                        disabled={guardandoMat}
                                                                    >
                                                                        Quitar
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Formulario para agregar (solo en estados editables) */}
                                    {sePuedeEditar && (
                                        <div className="border rounded p-3 bg-light">
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <span className="small fw-bold">Agregar material:</span>
                                                <div className="btn-group btn-group-sm" role="group">
                                                    <button
                                                        type="button"
                                                        className={`btn ${modoMaterial === "inventario" ? "btn-primary" : "btn-outline-primary"}`}
                                                        onClick={() => { setModoMaterial("inventario"); setErrNuevoMat(""); }}
                                                    >
                                                        Del inventario
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn ${modoMaterial === "externo_nuevo" ? "btn-warning" : "btn-outline-warning"}`}
                                                        onClick={() => { setModoMaterial("externo_nuevo"); setErrNuevoMat(""); }}
                                                    >
                                                        Externo nuevo
                                                    </button>
                                                </div>
                                            </div>

                                            {modoMaterial === "inventario" ? (
                                                <div className="row g-2 align-items-end">
                                                    <div className="col-md-5 position-relative">
                                                        <label className="form-label form-label-sm mb-1">Buscar en inventario</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Nombre del material..."
                                                            value={matSelec ? matSelec.nombre_material : busqMat}
                                                            onChange={(e) => { setBusqMat(e.target.value); setMatSelec(null); }}
                                                        />
                                                        {!matSelec && busqMat.length > 0 && (() => {
                                                            const filtrados = todosMats
                                                                .filter((m) =>
                                                                    m.nombre_material.toLowerCase().includes(busqMat.toLowerCase()) &&
                                                                    !materialesEdicion.find((me) => me.material_id === m.id_material)
                                                                )
                                                                .slice(0, 8);
                                                            return filtrados.length > 0 ? (
                                                                <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1080, top: "100%" }}>
                                                                    {filtrados.map((m) => (
                                                                        <li
                                                                            key={m.id_material}
                                                                            className="list-group-item list-group-item-action py-1 small"
                                                                            style={{ cursor: "pointer" }}
                                                                            onMouseDown={() => { setMatSelec(m); setBusqMat(m.nombre_material); }}
                                                                        >
                                                                            <span className="fw-semibold">{m.nombre_material}</span>
                                                                            <span className="text-muted ms-2">— {formatearPrecio(m.precio_unitario)} —</span>
                                                                            {m.stock_actual === 0
                                                                                ? <span className="text-danger ms-1">⚠ Sin stock</span>
                                                                                : <span className="text-muted ms-1">Stock: {m.stock_actual}</span>
                                                                            }
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : null;
                                                        })()}
                                                        {matSelec && (
                                                            <div className="mt-1 small text-muted">
                                                                {formatearPrecio(matSelec.precio_unitario)} —{" "}
                                                                {matSelec.stock_actual === 0
                                                                    ? <span className="text-danger">⚠ Sin stock</span>
                                                                    : <>Stock: <strong>{matSelec.stock_actual}</strong></>
                                                                }
                                                                {Number(cantNuevo) > matSelec.stock_actual && !externoNuevo && (
                                                                    <span className="text-warning ms-2">⚠ Cantidad supera el stock</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="form-label form-label-sm mb-1">Cantidad</label>
                                                        <input type="number" className="form-control form-control-sm" value={cantNuevo} onChange={(e) => setCantNuevo(e.target.value)} min="1" />
                                                    </div>
                                                    <div className="col-md-3 d-flex align-items-center gap-2 pt-4">
                                                        <input type="checkbox" className="form-check-input" id="chkExterno" checked={externoNuevo} onChange={(e) => setExternoNuevo(e.target.checked)} />
                                                        <label className="form-check-label small" htmlFor="chkExterno">No descontar stock</label>
                                                    </div>
                                                    <div className="col-md-2 pt-3">
                                                        <button className="btn btn-primary btn-sm w-100" onClick={iniciarAgregarMaterial} disabled={guardandoMat || !matSelec}>
                                                            {guardandoMat ? "..." : "Agregar"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Modo externo nuevo */
                                                <div className="row g-2 align-items-end">
                                                    <div className="col-md-5">
                                                        <label className="form-label form-label-sm mb-1">Nombre del material *</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Ej: Cable coaxial RG6"
                                                            value={nombreExterno}
                                                            onChange={(e) => setNombreExterno(e.target.value)}
                                                            maxLength={200}
                                                        />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label form-label-sm mb-1">Precio unitario (CLP)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            value={precioExterno}
                                                            onChange={(e) => setPrecioExterno(e.target.value)}
                                                            min="0"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="form-label form-label-sm mb-1">Cantidad</label>
                                                        <input type="number" className="form-control form-control-sm" value={cantNuevo} onChange={(e) => setCantNuevo(e.target.value)} min="1" />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <button className="btn btn-warning btn-sm w-100" onClick={iniciarAgregarMaterial} disabled={guardandoMat || !nombreExterno.trim()}>
                                                            {guardandoMat ? "..." : "Agregar"}
                                                        </button>
                                                    </div>
                                                    <div className="col-12">
                                                        <small className="text-muted">
                                                            ℹ Este material <strong>no</strong> se registra en el inventario y <strong>no descuenta stock</strong>.
                                                        </small>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── COSTOS DEL PROYECTO ─────────────── */}
                                    <hr className="my-4" />
                                    <h6 className="fw-bold mb-3">💰 Costos del proyecto</h6>
                                    {errCostos && (
                                        <div className="alert alert-danger small py-1 mb-2">{errCostos}</div>
                                    )}
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-4">
                                            <label className="form-label form-label-sm">Días estimados *</label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-sm ${errDias ? "is-invalid" : ""}`}
                                                min="1"
                                                value={diasEstimados}
                                                onChange={(e) => { setDiasEstimados(e.target.value); setErrDias(""); }}
                                                onBlur={() => { if (Number(diasEstimados) < 1) setErrDias("Mínimo 1 día"); }}
                                            />
                                            {errDias && <div className="invalid-feedback">{errDias}</div>}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label form-label-sm">Trabajadores *</label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-sm ${errTrabajadores ? "is-invalid" : ""}`}
                                                min="1"
                                                value={cantTrabajadores}
                                                onChange={(e) => { setCantTrabajadores(e.target.value); setErrTrabajadores(""); }}
                                                onBlur={() => { if (Number(cantTrabajadores) < 1) setErrTrabajadores("Mínimo 1"); }}
                                            />
                                            {errTrabajadores
                                                ? <div className="invalid-feedback">{errTrabajadores}</div>
                                                : <small className="text-muted">1 si solo es Avercio</small>
                                            }
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label form-label-sm">Precio día/trab. (CLP)</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                min="0"
                                                value={precioDia}
                                                onChange={(e) => setPrecioDia(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-8">
                                            <label className="form-label form-label-sm">Zona del proyecto</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={comunaGrupoId}
                                                onChange={(e) => setComunaGrupoId(e.target.value)}
                                            >
                                                <option value="">Sin zona asignada (sin costo bencina)</option>
                                                {comunaGrupos.map((g) => (
                                                    <option key={g.id_cg} value={g.id_cg}>
                                                        {g.nombre} ({g.rango_km_min}–{g.rango_km_max} km)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label form-label-sm">% Ganancia (0–100)</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={pctGanancia}
                                                onChange={(e) => setPctGanancia(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm"
                                        onClick={handleRecalcularCostos}
                                        disabled={recalculando}
                                    >
                                        {recalculando ? "Calculando..." : "Recalcular costos"}
                                    </button>

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
                                        disabled={guardando || !!(
                                            errEdNombreProyecto || errEdTipoProyecto ||
                                            errEdNombreCliente || errEdTelefono ||
                                            errEdDireccion || errEdFechaTermino ||
                                            errEdPresupuestoEst || errEdPresupuestoFinal ||
                                            errEdObservaciones
                                        )}
                                    >
                                        {guardando ? "Guardando..." : "Guardar cambios"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Diálogo de confirmación (sobre el modal) ─────────────── */}
                {confirmDlg && (
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "rgba(0,0,0,0.65)",
                            zIndex: 1070,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div className="card shadow" style={{ maxWidth: 440, margin: "0 1rem" }}>
                            <div className="card-header fw-bold">{confirmDlg.titulo}</div>
                            <div className="card-body">
                                <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
                                    {confirmDlg.mensaje}
                                </p>
                            </div>
                            <div className="card-footer d-flex gap-2 justify-content-end flex-wrap">
                                <button
                                    className={`btn btn-${confirmDlg.btn1.variant} btn-sm`}
                                    onClick={confirmDlg.btn1.onClick}
                                >
                                    {confirmDlg.btn1.label}
                                </button>
                                <button
                                    className={`btn btn-${confirmDlg.btn2.variant} btn-sm`}
                                    onClick={confirmDlg.btn2.onClick}
                                >
                                    {confirmDlg.btn2.label}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default DetalleProyecto;