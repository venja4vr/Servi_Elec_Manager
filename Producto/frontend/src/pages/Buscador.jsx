import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    buscarPrecios,
    getMateriales,
    getHistoricoPrecios,
    guardarPrecioManual,
    actualizarPreciosPlantillas,
    getUsuarioRol,
} from "../services/api";

const CARRITO_KEY = "recursos_pendientes_carrito";

// ── Gráfico de línea con SVG puro ─────────────────────────────────
function GraficoHistorico({ datos }) {
    if (!datos || datos.length < 2) {
        return (
            <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: "6px 0 0" }}>
                Insuficientes datos para el gráfico.
            </p>
        );
    }
    const ordenados = [...datos].reverse(); // más viejo → más nuevo (izq → der)
    const precios = ordenados.map((d) => Number(d.precio));
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    const rng = max - min || 1;
    const W = 420, H = 90, PX = 28, PY = 10;
    const n = ordenados.length;
    const cx = (i) => PX + (i / Math.max(n - 1, 1)) * (W - 2 * PX);
    const cy = (p) => H - PY - ((p - min) / rng) * (H - 2 * PY);
    const pts = ordenados.map((d, i) => `${cx(i)},${cy(Number(d.precio))}`).join(" ");

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", maxHeight: H, display: "block" }}
        >
            {/* Área bajo la curva */}
            <polygon
                points={`${cx(0)},${H} ${pts} ${cx(n - 1)},${H}`}
                fill="rgba(77,91,67,0.10)"
            />
            <polyline
                points={pts}
                fill="none"
                stroke="#4d5b43"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {ordenados.map((d, i) => (
                <circle
                    key={i}
                    cx={cx(i)}
                    cy={cy(Number(d.precio))}
                    r="3.5"
                    fill="#4d5b43"
                    stroke="#fffdf8"
                    strokeWidth="1.5"
                />
            ))}
        </svg>
    );
}

// ── Utilidades ─────────────────────────────────────────────────────
function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(precio);
}

function formatearFecha(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" })
        + " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

// Busca qué material del inventario mejor coincide con un resultado de búsqueda
function encontrarMatch(producto, materiales, materialIdHint) {
    const nombreProd = producto.nombre.toLowerCase();

    if (materialIdHint) {
        const hint = materiales.find((m) => m.id_material === materialIdHint);
        if (hint) {
            const palabras = hint.nombre_material.toLowerCase().split(" ").filter((p) => p.length >= 4);
            if (palabras.length > 0 && palabras.some((p) => nombreProd.includes(p))) return hint;
        }
    }

    return (
        materiales.find((m) => {
            const palabras = m.nombre_material.toLowerCase().split(" ").filter((p) => p.length >= 4);
            if (palabras.length === 0) return false;
            const hits = palabras.filter((p) => nombreProd.includes(p));
            return hits.length >= Math.min(2, palabras.length);
        }) || null
    );
}

// ── Componente principal ───────────────────────────────────────────
function Buscador() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const busquedaParam = searchParams.get("busqueda") || "";
    const materialIdParam = searchParams.get("material_id") || "";

    const esAdmin = ["A", "S"].includes(getUsuarioRol());

    const [query, setQuery] = useState(busquedaParam);
    const [tienda, setTienda] = useState("");
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    // Materiales del inventario para matchear
    const [materiales, setMateriales] = useState([]);

    // Histórico por material_id: { id: registros[] | null }
    const [historicos, setHistoricos] = useState({});
    const [historicoAbierto, setHistoricoAbierto] = useState({});
    const [cargandoHistorico, setCargandoHistorico] = useState({});

    // Input de precio manual en la sección histórico
    const [precioManualInput, setPrecioManualInput] = useState({});
    const [guardandoPrecioId, setGuardandoPrecioId] = useState(null);

    // Actualizar precios de plantillas
    const [actualizandoPlantillas, setActualizandoPlantillas] = useState(false);

    // Para auto-abrir el histórico solo la primera vez
    const autoAbiertoRef = useRef(false);

    // Carga inicial
    useEffect(() => {
        getMateriales()
            .then((data) => setMateriales(data))
            .catch(() => {}); // silencioso: no bloquea el buscador

        if (busquedaParam) {
            cargarProductos(busquedaParam, "");
        } else {
            cargarProductos();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-abrir histórico cuando llegamos desde Inventario con material_id
    useEffect(() => {
        if (!materialIdParam || productos.length === 0 || autoAbiertoRef.current) return;
        autoAbiertoRef.current = true;
        const match = productos.find((p) => encontrarMatch(p, materiales, materialIdParam));
        if (match) {
            abrirHistorico(materialIdParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productos, materiales]);

    const cargarProductos = async (textoBusqueda = "", filtroTienda = "") => {
        setCargando(true);
        setError("");
        try {
            const data = await buscarPrecios(textoBusqueda, filtroTienda);
            setProductos(data);
        } catch (err) {
            setError(err.message || "Error al cargar productos");
            setProductos([]);
        } finally {
            setCargando(false);
        }
    };

    const handleBuscar = (e) => {
        e.preventDefault();
        autoAbiertoRef.current = false; // reset para nueva búsqueda
        cargarProductos(query, tienda);
    };

    const handleAgregarAlCarrito = (producto) => {
        try {
            const carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || "[]");
            const existe = carrito.find(
                (item) => item.codigo === producto.codigo && item.tienda === producto.tienda
            );
            if (existe) {
                setError(`"${producto.nombre}" ya está en recursos pendientes.`);
                setTimeout(() => setError(""), 3000);
                return;
            }
            carrito.push({
                codigo: producto.codigo,
                nombre: producto.nombre,
                marca: producto.marca,
                tienda: producto.tienda,
                precio: producto.precio,
                url: producto.url,
                cantidad: 1,
                material_vinculado: null,
                fecha_agregado: new Date().toISOString(),
            });
            localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
            setMensajeOk(`"${producto.nombre}" agregado a recursos pendientes.`);
            setTimeout(() => setMensajeOk(""), 3000);
        } catch (err) {
            setError("Error al agregar al carrito: " + err.message);
        }
    };

    // ── Histórico ────────────────────────────────────────────────────
    const abrirHistorico = async (materialId) => {
        const estaAbierto = !!historicoAbierto[materialId];
        setHistoricoAbierto((prev) => ({ ...prev, [materialId]: !estaAbierto }));

        if (!estaAbierto && historicos[materialId] === undefined && !cargandoHistorico[materialId]) {
            setCargandoHistorico((prev) => ({ ...prev, [materialId]: true }));
            try {
                const data = await getHistoricoPrecios(materialId, 30);
                setHistoricos((prev) => ({ ...prev, [materialId]: data }));
            } catch {
                setHistoricos((prev) => ({ ...prev, [materialId]: [] }));
            } finally {
                setCargandoHistorico((prev) => { const n = { ...prev }; delete n[materialId]; return n; });
            }
        }
    };

    const handleGuardarPrecioManual = async (materialId) => {
        const valor = parseFloat(precioManualInput[materialId]);
        if (isNaN(valor) || valor < 0) {
            setError("Ingresa un precio válido.");
            return;
        }
        setGuardandoPrecioId(materialId);
        setError("");
        try {
            await guardarPrecioManual(materialId, valor);
            setMensajeOk("Precio manual guardado.");
            setTimeout(() => setMensajeOk(""), 3000);
            // Refrescar histórico y materiales
            const [hist, mats] = await Promise.all([
                getHistoricoPrecios(materialId, 30),
                getMateriales(),
            ]);
            setHistoricos((prev) => ({ ...prev, [materialId]: hist }));
            setMateriales(mats);
            setPrecioManualInput((prev) => { const n = { ...prev }; delete n[materialId]; return n; });
        } catch (err) {
            setError(err.message || "Error al guardar precio");
        } finally {
            setGuardandoPrecioId(null);
        }
    };

    // ── Actualizar precios de plantillas ────────────────────────────
    const handleActualizarPlantillas = async () => {
        if (!window.confirm(
            "Esto disparará el scraper para todos los materiales del inventario que están en plantillas.\n\nPuede demorar varios minutos."
        )) return;
        setActualizandoPlantillas(true);
        setError("");
        try {
            const res = await actualizarPreciosPlantillas();
            setMensajeOk(
                `Completado: ${res.actualizados} actualizados, ${res.fallidos} fallidos de ${res.total} materiales.`
            );
            setTimeout(() => setMensajeOk(""), 7000);
            const mats = await getMateriales();
            setMateriales(mats);
        } catch (err) {
            setError(err.message || "Error al actualizar precios");
        } finally {
            setActualizandoPlantillas(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────
    return (
        <AppLayout>
            <div className="search-page">
                {/* HEADER */}
                <div
                    className="search-header"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                >
                    <div>
                        <h1>Comparador de precios</h1>
                        <p>Busca materiales en Sodimac y Easy, y consulta el histórico de precios del inventario.</p>
                    </div>
                    {esAdmin && (
                        <button
                            style={{
                                border: "none",
                                background: "#4d5b43",
                                color: "white",
                                borderRadius: "14px",
                                padding: "12px 18px",
                                fontWeight: "800",
                                cursor: actualizandoPlantillas ? "not-allowed" : "pointer",
                                opacity: actualizandoPlantillas ? 0.7 : 1,
                                whiteSpace: "nowrap",
                                marginTop: "4px",
                            }}
                            disabled={actualizandoPlantillas}
                            onClick={handleActualizarPlantillas}
                        >
                            {actualizandoPlantillas ? "Actualizando..." : "Actualizar precios de mis plantillas"}
                        </button>
                    )}
                </div>

                {/* ALERTAS */}
                {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                {mensajeOk && <div className="alert alert-success mt-3" role="alert">{mensajeOk}</div>}

                {/* BUSCADOR */}
                <form onSubmit={handleBuscar}>
                    <div className="search-actions">
                        <input
                            type="text"
                            placeholder="Buscar producto, marca o tienda..."
                            maxLength={150}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <select
                            value={tienda}
                            onChange={(e) => setTienda(e.target.value)}
                            className="search-select"
                        >
                            <option value="">Todas las tiendas</option>
                            <option value="Sodimac">Sodimac</option>
                            <option value="Easy">Easy</option>
                        </select>
                        <button type="submit" className="search-btn" disabled={cargando}>
                            {cargando ? "Buscando..." : "Buscar"}
                        </button>
                        <button
                            type="button"
                            className="secondary-action-btn"
                            onClick={() => navigate("/recursos-pendientes")}
                        >
                            Recursos pendientes
                        </button>
                    </div>
                </form>

                {/* TABLA DE RESULTADOS */}
                <div className="resource-list">
                    <div className="resource-table-head">
                        <span>Producto</span>
                        <span>Nombre</span>
                        <span>Precio</span>
                        <span>Marca</span>
                        <span>Tienda</span>
                    </div>

                    {cargando && productos.length === 0 ? (
                        <div className="text-center py-5 text-muted">Cargando productos...</div>
                    ) : productos.length === 0 ? (
                        <div className="text-center py-5 text-muted">No se encontraron productos.</div>
                    ) : (() => {
                        const preciosValidos = productos.map(p => p.precio).filter(p => p !== null);
                        const precioMinimo = preciosValidos.length > 0 ? Math.min(...preciosValidos) : null;

                        return productos.map((producto) => {
                            const materialMatch = encontrarMatch(producto, materiales, materialIdParam);
                            const esMasBarato = precioMinimo !== null && producto.precio === precioMinimo;

                            return (
                                <div key={`${producto.codigo}-${producto.tienda}`}>
                                    {/* Fila del producto */}
                                    <div className="resource-row" style={esMasBarato ? { border: "2px solid #4d5b43", borderRadius: "12px", background: "#f0f5ee" } : {}}>
                                        {/* IMAGEN */}
                                        <div
                                            className="resource-image"
                                            style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100px" }}
                                        >
                                            {producto.imagen ? (
                                                <img
                                                    src={producto.imagen}
                                                    alt={producto.nombre}
                                                    style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "contain", borderRadius: "4px" }}
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                        e.target.parentElement.innerHTML = '<span style="color:#999;font-size:12px">Sin imagen</span>';
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ color: "#999", fontSize: "12px" }}>Sin imagen</span>
                                            )}
                                        </div>

                                        {/* INFO */}
                                        <div>
                                            <strong>
                                                <a
                                                    href={producto.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-decoration-none text-dark"
                                                >
                                                    {producto.nombre}
                                                </a>
                                            </strong>
                                            <p>Código: {producto.codigo}</p>
                                            {/* Botón "Ver histórico" si hay match */}
                                            {materialMatch && (
                                                <button
                                                    style={{
                                                        marginTop: "6px",
                                                        background: "#e5efe2",
                                                        border: "1px solid #dce7d5",
                                                        borderRadius: "8px",
                                                        padding: "4px 10px",
                                                        fontSize: "0.78rem",
                                                        color: "#4d5b43",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => abrirHistorico(materialMatch.id_material)}
                                                >
                                                    {historicoAbierto[materialMatch.id_material]
                                                        ? "Ocultar histórico ▲"
                                                        : "Ver histórico ▼"}
                                                </button>
                                            )}
                                        </div>

                                        {/* PRECIO */}
                                        <div className="resource-price">{formatearPrecio(producto.precio)}</div>

                                        {/* MARCA */}
                                        <div>{producto.marca}</div>

                                        {/* TIENDA + BOTÓN */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <span style={{
                                                display: "inline-block",
                                                padding: "3px 10px",
                                                borderRadius: "999px",
                                                fontSize: "0.75rem",
                                                fontWeight: "800",
                                                background: producto.tienda === "Sodimac" ? "#f5c518" : "#4d5b43",
                                                color:      producto.tienda === "Sodimac" ? "#1a1a1a"  : "#ffffff",
                                                textAlign: "center",
                                            }}>
                                                {producto.tienda}
                                            </span>
                                            {esMasBarato && (
                                                <span style={{
                                                    display: "inline-block",
                                                    padding: "2px 8px",
                                                    borderRadius: "999px",
                                                    fontSize: "0.68rem",
                                                    fontWeight: "900",
                                                    background: "#4d5b43",
                                                    color: "#ffffff",
                                                    textAlign: "center",
                                                    letterSpacing: "0.03em",
                                                }}>
                                                    MÁS BARATO
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-outline-success btn-sm"
                                                onClick={() => handleAgregarAlCarrito(producto)}
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    </div>

                                    {/* SECCIÓN HISTÓRICO (expandible) */}
                                    {materialMatch && historicoAbierto[materialMatch.id_material] && (
                                        <div
                                            style={{
                                                background: "#f5f1e8",
                                                border: "1px solid #e6dfd2",
                                                borderRadius: "0 0 18px 18px",
                                                padding: "20px 24px",
                                                marginBottom: "14px",
                                                marginTop: "-14px",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                                <h6 style={{ margin: 0, fontWeight: "900", color: "#1f2418" }}>
                                                    Histórico de precios — {materialMatch.nombre_material}
                                                    <span style={{ fontWeight: "400", color: "#6b7280", fontSize: "0.85rem", marginLeft: "8px" }}>
                                                        últimos 30 días
                                                    </span>
                                                </h6>
                                                <button
                                                    style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "0.82rem" }}
                                                    onClick={() => navigate(`/inventario`)}
                                                >
                                                    Ver en inventario →
                                                </button>
                                            </div>

                                            {cargandoHistorico[materialMatch.id_material] ? (
                                                <p style={{ color: "#6b7280" }}>Cargando histórico...</p>
                                            ) : !historicos[materialMatch.id_material] || historicos[materialMatch.id_material].length === 0 ? (
                                                <p style={{ color: "#6b7280", fontSize: "0.88rem" }}>
                                                    Sin registros históricos aún. Registra un precio manualmente o actualiza desde el inventario.
                                                </p>
                                            ) : (() => {
                                                const todosRegistros = historicos[materialMatch.id_material];
                                                const registrosConfiables = todosRegistros.filter((r) => !r.es_outlier);
                                                const sinDatosConfiables = registrosConfiables.length === 0;

                                                return (
                                                    <>
                                                        {/* Aviso sin datos confiables */}
                                                        {sinDatosConfiables && (
                                                            <div style={{
                                                                background: "#fff7ed",
                                                                border: "1px solid #fed7aa",
                                                                borderRadius: "10px",
                                                                padding: "10px 14px",
                                                                marginBottom: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "8px",
                                                                fontSize: "0.85rem",
                                                                color: "#9a3412",
                                                                fontWeight: "700",
                                                            }}>
                                                                ⚠ Sin datos confiables — todos los registros automáticos fueron marcados como atípicos. Ingresa un precio manual para restablecer el histórico.
                                                            </div>
                                                        )}

                                                        {/* Gráfico solo con datos confiables */}
                                                        {!sinDatosConfiables && (
                                                            <div style={{
                                                                background: "#fffdf8",
                                                                border: "1px solid #e6dfd2",
                                                                borderRadius: "14px",
                                                                padding: "14px 16px",
                                                                marginBottom: "14px",
                                                            }}>
                                                                <GraficoHistorico datos={registrosConfiables} />
                                                            </div>
                                                        )}

                                                        {/* Tabla con todos los registros */}
                                                        <div style={{ overflowX: "auto" }}>
                                                            <table style={{
                                                                width: "100%",
                                                                borderCollapse: "collapse",
                                                                fontSize: "0.85rem",
                                                                background: "#fffdf8",
                                                                borderRadius: "12px",
                                                                overflow: "hidden",
                                                            }}>
                                                                <thead>
                                                                    <tr style={{ background: "#eef3e7", color: "#4d5b43" }}>
                                                                        <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "900" }}>Fecha</th>
                                                                        <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "900" }}>Precio</th>
                                                                        <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "900" }}>Fuente</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {todosRegistros.map((r, idx) => (
                                                                        <tr
                                                                            key={idx}
                                                                            style={{
                                                                                borderBottom: "1px solid #eee4d5",
                                                                                opacity: r.es_outlier ? 0.5 : 1,
                                                                            }}
                                                                        >
                                                                            <td style={{ padding: "9px 14px", color: "#374151" }}>
                                                                                {formatearFecha(r.fecha)}
                                                                            </td>
                                                                            <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: "800", color: "#1f2418" }}>
                                                                                <span style={r.es_outlier ? { textDecoration: "line-through", color: "#9ca3af" } : {}}>
                                                                                    {formatearPrecio(r.precio)}
                                                                                </span>
                                                                                {r.es_outlier && (
                                                                                    <span style={{
                                                                                        marginLeft: "6px",
                                                                                        fontSize: "0.7rem",
                                                                                        background: "#fee2e2",
                                                                                        color: "#991b1b",
                                                                                        borderRadius: "999px",
                                                                                        padding: "1px 6px",
                                                                                        fontWeight: "800",
                                                                                    }}>
                                                                                        atípico
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td style={{ padding: "9px 14px", textAlign: "center" }}>
                                                                                {(() => {
                                                                                    const f = r.fuente?.toLowerCase();
                                                                                    const cfg = f === "sodimac"
                                                                                        ? { bg: "#fff1cc", fg: "#a66a00", label: "Sodimac" }
                                                                                        : f === "easy"
                                                                                        ? { bg: "#e5efe2", fg: "#2f7d46", label: "Easy" }
                                                                                        : { bg: "#f0f0f0", fg: "#555555", label: "Manual" };
                                                                                    return (
                                                                                        <span style={{
                                                                                            padding: "3px 10px",
                                                                                            borderRadius: "999px",
                                                                                            fontSize: "0.75rem",
                                                                                            fontWeight: "800",
                                                                                            background: cfg.bg,
                                                                                            color: cfg.fg,
                                                                                        }}>
                                                                                            {cfg.label}
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {/* Input precio manual (admin) */}
                                            {esAdmin && (
                                                <div
                                                    style={{
                                                        marginTop: "16px",
                                                        padding: "14px 16px",
                                                        background: "#fffdf8",
                                                        border: "1px solid #e6dfd2",
                                                        borderRadius: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <label style={{ fontWeight: "800", fontSize: "0.85rem", color: "#1f2418", whiteSpace: "nowrap" }}>
                                                        Registrar precio manual:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        placeholder="Ej: 4500"
                                                        style={{
                                                            border: "1px solid #d9d4cc",
                                                            borderRadius: "10px",
                                                            padding: "8px 12px",
                                                            fontSize: "0.85rem",
                                                            width: "130px",
                                                            outline: "none",
                                                            background: "#fffdf8",
                                                        }}
                                                        value={precioManualInput[materialMatch.id_material] ?? ""}
                                                        onChange={(e) =>
                                                            setPrecioManualInput((prev) => ({
                                                                ...prev,
                                                                [materialMatch.id_material]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                    <button
                                                        style={{
                                                            border: "none",
                                                            background: "#4d5b43",
                                                            color: "white",
                                                            borderRadius: "10px",
                                                            padding: "8px 16px",
                                                            fontWeight: "800",
                                                            fontSize: "0.85rem",
                                                            cursor: guardandoPrecioId === materialMatch.id_material ? "not-allowed" : "pointer",
                                                            opacity: guardandoPrecioId === materialMatch.id_material ? 0.7 : 1,
                                                        }}
                                                        disabled={guardandoPrecioId === materialMatch.id_material}
                                                        onClick={() => handleGuardarPrecioManual(materialMatch.id_material)}
                                                    >
                                                        {guardandoPrecioId === materialMatch.id_material ? "Guardando..." : "Guardar precio manual"}
                                                    </button>
                                                    <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>
                                                        Se guardará en el histórico con fuente "manual".
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </AppLayout>
    );
}

export default Buscador;
