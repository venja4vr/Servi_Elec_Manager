import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getPlantillas,
    getMaterialesDePlantilla,
    getMateriales,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
    getUsuarioRol,
} from "../services/api";

const CATEGORIAS = [
    "Instalaciones Eléctricas",
    "Mantenciones Eléctricas",
    "Servicios Industriales",
];

function badgeCategoria(cat) {
    if (!cat) return { background: "#f5f1e8", color: "#6b7280" };
    if (cat.includes("Instalac")) return { background: "#e5efe2", color: "#2e321b" };
    if (cat.includes("Mantenc"))  return { background: "#fff1cc", color: "#9a6b00" };
    return { background: "#dde9f8", color: "#315b8a" };
}

function formatearPrecio(precio) {
    if (!precio && precio !== 0) return "—";
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(precio);
}

function Plantillas() {
    const navigate = useNavigate();
    const esAdmin = ["A", "S"].includes(getUsuarioRol());

    const [plantillas, setPlantillas] = useState([]);
    const [materialesInventario, setMaterialesInventario] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    // ── Modal crear / editar ──────────────────────────────────────
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [plantillaId, setPlantillaId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Campos del formulario
    const [fNombre, setFNombre] = useState("");
    const [fDescripcion, setFDescripcion] = useState("");
    const [fCategoria, setFCategoria] = useState("");
    const [fActiva, setFActiva] = useState(true);
    const [fDiasDefault, setFDiasDefault] = useState("");
    const [fHorasDiarias, setFHorasDiarias] = useState("8");
    const [fTrabajadoresDefault, setFTrabajadoresDefault] = useState("1");
    const [fDiasMinimos, setFDiasMinimos] = useState("1");
    const [fHorasMinimas, setFHorasMinimas] = useState("1");
    const [fErrores, setFErrores] = useState({});

    // Materiales en el modal
    const [materialesModal, setMaterialesModal] = useState([]);
    // [{ material_id, nombre_material, cantidad_sugerida, unidad }]

    // Autocomplete de material
    const [busquedaMat, setBusquedaMat] = useState("");
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const autocompleteRef = useRef(null);

    // ── Eliminar ─────────────────────────────────────────────────
    const [mostrarEliminar, setMostrarEliminar] = useState(false);
    const [plantillaAEliminar, setPlantillaAEliminar] = useState(null);

    useEffect(() => {
        cargarDatos();
        // Cerrar autocomplete al hacer click fuera
        const handler = (e) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
                setMostrarSugerencias(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [pData, mData] = await Promise.all([
                getPlantillas(),
                getMateriales(),
            ]);
            setPlantillas(pData);
            setMaterialesInventario(mData);
        } catch (err) {
            setError(err.message || "Error al cargar plantillas");
        } finally {
            setCargando(false);
        }
    };

    const mostrarToast = (msg) => {
        setMensajeOk(msg);
        setTimeout(() => setMensajeOk(""), 3500);
    };

    // ── Abrir modal crear ─────────────────────────────────────────
    const abrirCrear = () => {
        setModoEdicion(false);
        setPlantillaId(null);
        setFNombre(""); setFDescripcion(""); setFCategoria(""); setFActiva(true); setFDiasDefault("");
        setFHorasDiarias("8"); setFTrabajadoresDefault("1"); setFDiasMinimos("1"); setFHorasMinimas("1");
        setFErrores({});
        setMaterialesModal([]);
        setBusquedaMat("");
        setMostrarModal(true);
    };

    // ── Abrir modal editar ────────────────────────────────────────
    const abrirEditar = async (plantilla) => {
        setModoEdicion(true);
        setPlantillaId(plantilla.id_plantilla);
        setFNombre(plantilla.nombre_servicio || "");
        setFDescripcion(plantilla.descripcion || "");
        setFCategoria(plantilla.categoria || "");
        setFActiva(plantilla.activa !== false);
        setFDiasDefault(plantilla.dias_default != null ? String(plantilla.dias_default) : "");
        setFHorasDiarias(plantilla.horas_diarias_default != null ? String(plantilla.horas_diarias_default) : "8");
        setFTrabajadoresDefault(plantilla.trabajadores_default != null ? String(plantilla.trabajadores_default) : "1");
        setFDiasMinimos(plantilla.dias_minimos != null ? String(plantilla.dias_minimos) : "1");
        setFHorasMinimas(plantilla.horas_minimas != null ? String(plantilla.horas_minimas) : "1");
        setFErrores({});
        setBusquedaMat("");
        setMostrarModal(true);

        // Cargar materiales actuales
        try {
            const data = await getMaterialesDePlantilla(plantilla.id_plantilla);
            setMaterialesModal(
                (data.materiales || []).map((m) => ({
                    material_id: m.material_id,
                    nombre_material: m.nombre_material,
                    cantidad_sugerida: String(m.cantidad_sugerida),
                    unidad: m.unidad,
                }))
            );
        } catch {
            setMaterialesModal([]);
        }
    };

    // ── Validar y guardar ─────────────────────────────────────────
    const validar = () => {
        const e = {};
        if (!fNombre.trim() || fNombre.trim().length < 3)
            e.nombre = "El nombre debe tener al menos 3 caracteres.";
        if (fNombre.trim().length > 60)
            e.nombre = "El nombre no puede superar 60 caracteres.";
        if (!fCategoria)
            e.categoria = "Selecciona una categoría.";
        for (const m of materialesModal) {
            const c = parseFloat(m.cantidad_sugerida);
            if (isNaN(c) || c <= 0) {
                e.materiales = "Todas las cantidades deben ser mayores a 0.";
                break;
            }
        }
        return e;
    };

    const guardar = async () => {
        const e = validar();
        if (Object.keys(e).length > 0) {
            setFErrores(e);
            return;
        }
        setFErrores({});
        setGuardando(true);

        const payload = {
            nombre_servicio: fNombre.trim(),
            descripcion: fDescripcion.trim() || null,
            categoria: fCategoria,
            activa: fActiva,
            dias_default: fDiasDefault ? parseInt(fDiasDefault) : null,
            horas_diarias_default: fHorasDiarias ? parseInt(fHorasDiarias) : 8,
            trabajadores_default: fTrabajadoresDefault ? parseInt(fTrabajadoresDefault) : 1,
            dias_minimos: fDiasMinimos ? parseInt(fDiasMinimos) : 1,
            horas_minimas: fHorasMinimas ? parseInt(fHorasMinimas) : 1,
            materiales: materialesModal.map((m) => ({
                material_id: m.material_id,
                cantidad_sugerida: parseFloat(m.cantidad_sugerida),
                unidad: m.unidad || "unidad",
            })),
        };

        try {
            if (modoEdicion) {
                await actualizarPlantilla(plantillaId, payload);
                mostrarToast("Plantilla actualizada correctamente.");
            } else {
                await crearPlantilla(payload);
                mostrarToast("Plantilla creada correctamente.");
            }
            setMostrarModal(false);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al guardar plantilla");
        } finally {
            setGuardando(false);
        }
    };

    // ── Eliminar ─────────────────────────────────────────────────
    const abrirEliminar = (p) => {
        setPlantillaAEliminar(p);
        setMostrarEliminar(true);
    };

    const confirmarEliminar = async () => {
        try {
            await eliminarPlantilla(plantillaAEliminar.id_plantilla);
            setMostrarEliminar(false);
            setPlantillaAEliminar(null);
            mostrarToast("Plantilla eliminada.");
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al eliminar plantilla");
            setMostrarEliminar(false);
        }
    };

    // ── Materiales en modal ───────────────────────────────────────
    const sugerencias = busquedaMat.length >= 2
        ? materialesInventario
            .filter((m) =>
                m.nombre_material.toLowerCase().includes(busquedaMat.toLowerCase()) &&
                !materialesModal.some((mm) => mm.material_id === m.id_material)
            )
            .slice(0, 7)
        : [];

    const agregarMaterial = (mat) => {
        setMaterialesModal((prev) => [
            ...prev,
            { material_id: mat.id_material, nombre_material: mat.nombre_material, cantidad_sugerida: "1", unidad: "unidad" },
        ]);
        setBusquedaMat("");
        setMostrarSugerencias(false);
    };

    const quitarMaterial = (idx) => {
        setMaterialesModal((prev) => prev.filter((_, i) => i !== idx));
    };

    const actualizarCampomaterial = (idx, campo, valor) => {
        setMaterialesModal((prev) =>
            prev.map((m, i) => (i === idx ? { ...m, [campo]: valor } : m))
        );
    };

    // ── Render ─────────────────────────────────────────────────────
    return (
        <AppLayout>
            <div className="projects-page">
                {/* HEADER */}
                <div className="projects-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: "42px", fontWeight: "900", color: "#1f2418", margin: "0 0 8px" }}>
                            Plantillas
                        </h1>
                        <p style={{ color: "#6b7280", margin: 0 }}>
                            Plantillas de servicio para cotizaciones del bot y proyectos.
                        </p>
                    </div>
                    {esAdmin && (
                        <button
                            style={{
                                border: "none",
                                background: "#4d5b43",
                                color: "white",
                                borderRadius: "16px",
                                padding: "13px 22px",
                                fontWeight: "800",
                                cursor: "pointer",
                            }}
                            onClick={abrirCrear}
                        >
                            + Nueva plantilla
                        </button>
                    )}
                </div>

                {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                {mensajeOk && <div className="alert alert-success mt-3" role="alert">{mensajeOk}</div>}

                {/* LISTA */}
                {cargando ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
                        Cargando plantillas...
                    </div>
                ) : plantillas.length === 0 ? (
                    <div
                        style={{
                            background: "#fffdf8",
                            border: "1px solid #e6dfd2",
                            borderRadius: "24px",
                            padding: "3rem",
                            textAlign: "center",
                            color: "#6b7280",
                            marginTop: "16px",
                        }}
                    >
                        No hay plantillas. {esAdmin && "Crea la primera con el botón de arriba."}
                    </div>
                ) : (
                    <div className="projects-list" style={{ marginTop: "16px" }}>
                        {plantillas.map((p) => (
                            <div
                                key={p.id_plantilla}
                                style={{
                                    background: "#fffdf8",
                                    border: "1px solid #e6dfd2",
                                    borderRadius: "24px",
                                    padding: "20px 24px",
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto",
                                    gap: "16px",
                                    alignItems: "center",
                                    boxShadow: "0 8px 22px rgba(0,0,0,0.035)",
                                    opacity: p.activa ? 1 : 0.6,
                                }}
                            >
                                {/* Info */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                                        <strong style={{ fontSize: "1.05rem", color: "#1f2418" }}>
                                            {p.nombre_servicio}
                                        </strong>
                                        {p.categoria && (
                                            <span
                                                style={{
                                                    ...badgeCategoria(p.categoria),
                                                    padding: "4px 12px",
                                                    borderRadius: "999px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: "800",
                                                }}
                                            >
                                                {p.categoria}
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                padding: "4px 12px",
                                                borderRadius: "999px",
                                                fontSize: "0.78rem",
                                                fontWeight: "800",
                                                background: p.activa ? "#dff3e5" : "#f8dddd",
                                                color: p.activa ? "#2f7d46" : "#9b2f2f",
                                            }}
                                        >
                                            {p.activa ? "Activa" : "Inactiva"}
                                        </span>
                                    </div>

                                    {p.descripcion && (
                                        <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: "0.9rem" }}>
                                            {p.descripcion.length > 100
                                                ? p.descripcion.substring(0, 100) + "..."
                                                : p.descripcion}
                                        </p>
                                    )}

                                    <div style={{ display: "flex", gap: "18px", fontSize: "0.82rem", color: "#6b7280", flexWrap: "wrap" }}>
                                        <span>
                                            <strong style={{ color: "#4d5b43" }}>{p.num_materiales ?? 0}</strong> material{(p.num_materiales ?? 0) !== 1 ? "es" : ""}
                                        </span>
                                        {p.dias_default != null && (
                                            <span>
                                                <strong style={{ color: "#4d5b43" }}>{p.dias_default}</strong> día{p.dias_default !== 1 ? "s" : ""} est.
                                            </span>
                                        )}
                                        <span>
                                            <strong style={{ color: "#4d5b43" }}>{p.horas_diarias_default ?? 8}</strong>h/día,{" "}
                                            <strong style={{ color: "#4d5b43" }}>{p.trabajadores_default ?? 1}</strong> trabajador{(p.trabajadores_default ?? 1) !== 1 ? "es" : ""}
                                        </span>
                                        {p.precio_estimado != null && (
                                            <span>
                                                Precio estimado:{" "}
                                                <strong style={{ color: "#1f2418" }}>
                                                    {formatearPrecio(p.precio_estimado)}
                                                </strong>
                                            </span>
                                        )}
                                        <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                                            ID: {p.id_plantilla}
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                {esAdmin && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <button
                                            style={{
                                                border: "none",
                                                background: "#e5efe2",
                                                color: "#2e321b",
                                                borderRadius: "12px",
                                                padding: "9px 18px",
                                                fontWeight: "800",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => abrirEditar(p)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            style={{
                                                border: "none",
                                                background: "#f8dddd",
                                                color: "#9b2f2f",
                                                borderRadius: "12px",
                                                padding: "9px 18px",
                                                fontWeight: "800",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => abrirEliminar(p)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── MODAL CREAR / EDITAR ────────────────────────────────── */}
                {mostrarModal && (
                    <div
                        style={{
                            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            zIndex: 1050, padding: "16px",
                        }}
                        onClick={(e) => { if (e.target === e.currentTarget) setMostrarModal(false); }}
                    >
                        <div
                            style={{
                                background: "#fffdf8", borderRadius: "24px", width: "100%",
                                maxWidth: "640px", maxHeight: "90vh", overflowY: "auto",
                                padding: "28px", boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
                            }}
                        >
                            {/* Título modal */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h5 style={{ margin: 0, fontWeight: "900", fontSize: "1.25rem", color: "#1f2418" }}>
                                    {modoEdicion ? "Editar plantilla" : "Nueva plantilla"}
                                </h5>
                                <button
                                    style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#6b7280", lineHeight: 1 }}
                                    onClick={() => setMostrarModal(false)}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Campo Nombre */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={estiloLabel}>Nombre del servicio *</label>
                                <input
                                    type="text"
                                    maxLength={60}
                                    placeholder="Ej: Instalación de Tablero 12 Polos"
                                    style={{ ...estiloInput, borderColor: fErrores.nombre ? "#dc2626" : "#d9d4cc" }}
                                    value={fNombre}
                                    onChange={(e) => setFNombre(e.target.value)}
                                />
                                {fErrores.nombre && <p style={estiloError}>{fErrores.nombre}</p>}
                            </div>

                            {/* Campo Categoría */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={estiloLabel}>Categoría *</label>
                                <select
                                    style={{ ...estiloInput, borderColor: fErrores.categoria ? "#dc2626" : "#d9d4cc" }}
                                    value={fCategoria}
                                    onChange={(e) => setFCategoria(e.target.value)}
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {CATEGORIAS.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {fErrores.categoria && <p style={estiloError}>{fErrores.categoria}</p>}
                            </div>

                            {/* Campo Descripción */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={estiloLabel}>Descripción</label>
                                <textarea
                                    rows={3}
                                    maxLength={200}
                                    placeholder="Descripción breve del servicio..."
                                    style={{ ...estiloInput, resize: "vertical" }}
                                    value={fDescripcion}
                                    onChange={(e) => setFDescripcion(e.target.value)}
                                />
                            </div>

                            {/* Checkbox Activa */}
                            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                    type="checkbox"
                                    id="chk-activa"
                                    checked={fActiva}
                                    onChange={(e) => setFActiva(e.target.checked)}
                                    style={{ width: "18px", height: "18px", accentColor: "#4d5b43" }}
                                />
                                <label htmlFor="chk-activa" style={{ fontWeight: "700", color: "#1f2418", cursor: "pointer" }}>
                                    Plantilla activa (visible para el bot)
                                </label>
                            </div>

                            {/* Campo Días estimados */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={estiloLabel}>Días estimados de trabajo</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Ej: 2"
                                    style={estiloInput}
                                    value={fDiasDefault}
                                    onChange={(e) => setFDiasDefault(e.target.value)}
                                />
                                <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "4px 0 0" }}>
                                    Duración típica del servicio (opcional, referencia para costos)
                                </p>
                            </div>

                            {/* Campos de recursos */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                <div>
                                    <label style={estiloLabel}>Horas diarias de trabajo</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        step="1"
                                        placeholder="8"
                                        style={estiloInput}
                                        value={fHorasDiarias}
                                        onChange={(e) => setFHorasDiarias(e.target.value)}
                                    />
                                    <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "4px 0 0" }}>
                                        1–12 h/día
                                    </p>
                                </div>
                                <div>
                                    <label style={estiloLabel}>Trabajadores necesarios</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="1"
                                        placeholder="1"
                                        style={estiloInput}
                                        value={fTrabajadoresDefault}
                                        onChange={(e) => setFTrabajadoresDefault(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Mínimos del servicio */}
                            <div
                                style={{
                                    background: "#f5f1e8",
                                    border: "1px solid #e6dfd2",
                                    borderRadius: "14px",
                                    padding: "14px 16px",
                                    marginBottom: "20px",
                                }}
                            >
                                <p style={{ fontWeight: "800", color: "#1f2418", fontSize: "0.88rem", margin: "0 0 10px" }}>
                                    Mínimos requeridos por el servicio
                                </p>
                                <p style={{ color: "#6b7280", fontSize: "0.78rem", margin: "0 0 12px" }}>
                                    El bot rechazará valores inferiores a estos al preguntar días y horas al cliente.
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={estiloLabel}>Días mínimos</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="1"
                                            style={estiloInput}
                                            value={fDiasMinimos}
                                            onChange={(e) => setFDiasMinimos(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>Horas mínimas/día</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            step="1"
                                            placeholder="1"
                                            style={estiloInput}
                                            value={fHorasMinimas}
                                            onChange={(e) => setFHorasMinimas(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección Materiales */}
                            <div
                                style={{
                                    borderTop: "1px solid #eee4d5",
                                    paddingTop: "18px",
                                    marginBottom: "24px",
                                }}
                            >
                                <label style={{ ...estiloLabel, marginBottom: "12px" }}>Materiales del inventario</label>

                                {/* Autocomplete */}
                                <div ref={autocompleteRef} style={{ position: "relative", marginBottom: "12px" }}>
                                    <input
                                        type="text"
                                        placeholder="Buscar material para agregar..."
                                        style={estiloInput}
                                        value={busquedaMat}
                                        onChange={(e) => {
                                            setBusquedaMat(e.target.value);
                                            setMostrarSugerencias(true);
                                        }}
                                        onFocus={() => setMostrarSugerencias(true)}
                                    />
                                    {mostrarSugerencias && sugerencias.length > 0 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: 0,
                                                right: 0,
                                                background: "#fffdf8",
                                                border: "1px solid #e6dfd2",
                                                borderRadius: "12px",
                                                boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                                                zIndex: 100,
                                                maxHeight: "220px",
                                                overflowY: "auto",
                                            }}
                                        >
                                            {sugerencias.map((m) => (
                                                <div
                                                    key={m.id_material}
                                                    style={{
                                                        padding: "10px 14px",
                                                        cursor: "pointer",
                                                        borderBottom: "1px solid #f0ebe3",
                                                        fontSize: "0.9rem",
                                                    }}
                                                    onMouseDown={() => agregarMaterial(m)}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5f1e8"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <strong style={{ color: "#1f2418" }}>{m.nombre_material}</strong>
                                                    <span style={{ color: "#6b7280", fontSize: "0.8rem", marginLeft: "8px" }}>
                                                        Stock: {m.stock_actual}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Lista de materiales agregados */}
                                {fErrores.materiales && <p style={estiloError}>{fErrores.materiales}</p>}
                                {materialesModal.length === 0 ? (
                                    <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
                                        Sin materiales asignados aún.
                                    </p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {/* Encabezado */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 36px", gap: "8px", padding: "0 4px" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "800" }}>MATERIAL</span>
                                            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "800", textAlign: "center" }}>CANTIDAD</span>
                                            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "800", textAlign: "center" }}>UNIDAD</span>
                                            <span />
                                        </div>
                                        {materialesModal.map((m, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "1fr 90px 90px 36px",
                                                    gap: "8px",
                                                    alignItems: "center",
                                                    background: "#f5f1e8",
                                                    borderRadius: "12px",
                                                    padding: "10px 12px",
                                                }}
                                            >
                                                <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "#1f2418" }}>
                                                    {m.nombre_material}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    style={{
                                                        border: "1px solid #d9d4cc",
                                                        borderRadius: "8px",
                                                        padding: "6px 8px",
                                                        fontSize: "0.85rem",
                                                        textAlign: "center",
                                                        background: "#fffdf8",
                                                        outline: "none",
                                                        width: "100%",
                                                    }}
                                                    value={m.cantidad_sugerida}
                                                    onChange={(e) => actualizarCampomaterial(idx, "cantidad_sugerida", e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    maxLength={15}
                                                    style={{
                                                        border: "1px solid #d9d4cc",
                                                        borderRadius: "8px",
                                                        padding: "6px 8px",
                                                        fontSize: "0.85rem",
                                                        textAlign: "center",
                                                        background: "#fffdf8",
                                                        outline: "none",
                                                        width: "100%",
                                                    }}
                                                    value={m.unidad}
                                                    onChange={(e) => actualizarCampomaterial(idx, "unidad", e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    style={{
                                                        background: "#f8dddd",
                                                        color: "#9b2f2f",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        width: "32px",
                                                        height: "32px",
                                                        cursor: "pointer",
                                                        fontWeight: "900",
                                                        fontSize: "1rem",
                                                        lineHeight: 1,
                                                    }}
                                                    onClick={() => quitarMaterial(idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botones footer */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    style={{
                                        background: "#f5f1e8",
                                        border: "1px solid #ddd2bf",
                                        borderRadius: "14px",
                                        padding: "12px 22px",
                                        fontWeight: "800",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setMostrarModal(false)}
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    style={{
                                        background: guardando ? "#6b7280" : "#4d5b43",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "14px",
                                        padding: "12px 28px",
                                        fontWeight: "800",
                                        cursor: guardando ? "not-allowed" : "pointer",
                                    }}
                                    onClick={guardar}
                                    disabled={guardando}
                                >
                                    {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Crear plantilla"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL ELIMINAR ──────────────────────────────────────── */}
                {mostrarEliminar && plantillaAEliminar && (
                    <div
                        style={{
                            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            zIndex: 1060, padding: "16px",
                        }}
                    >
                        <div
                            style={{
                                background: "#fffdf8", borderRadius: "20px", padding: "28px",
                                maxWidth: "420px", width: "100%",
                                boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
                            }}
                        >
                            <h5 style={{ fontWeight: "900", marginBottom: "12px", color: "#1f2418" }}>
                                Confirmar eliminación
                            </h5>
                            <p style={{ color: "#374151", marginBottom: "24px" }}>
                                ¿Estás seguro de que deseas eliminar la plantilla{" "}
                                <strong>"{plantillaAEliminar.nombre_servicio}"</strong>?{" "}
                                Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    style={{
                                        background: "#f5f1e8", border: "1px solid #ddd2bf",
                                        borderRadius: "12px", padding: "10px 18px", fontWeight: "800", cursor: "pointer",
                                    }}
                                    onClick={() => { setMostrarEliminar(false); setPlantillaAEliminar(null); }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    style={{
                                        background: "#9b2f2f", color: "white", border: "none",
                                        borderRadius: "12px", padding: "10px 18px", fontWeight: "800", cursor: "pointer",
                                    }}
                                    onClick={confirmarEliminar}
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// Estilos reutilizables dentro del componente
const estiloLabel = {
    display: "block",
    fontWeight: "800",
    color: "#1f2418",
    marginBottom: "6px",
    fontSize: "0.9rem",
};

const estiloInput = {
    width: "100%",
    border: "1px solid #d9d4cc",
    background: "#fffdf8",
    borderRadius: "12px",
    padding: "12px 14px",
    outline: "none",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    boxSizing: "border-box",
};

const estiloError = {
    color: "#dc2626",
    fontSize: "0.82rem",
    margin: "4px 0 0",
};

export default Plantillas;
