import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getMateriales,
    getCategorias,
    actualizarMaterial,
    eliminarMaterial,
} from "../services/api";
import ConfirmarPasswordModal from "../components/ConfirmarPasswordModal";
import {
    validarTexto,
    validarTextoOpcional,
    validarEnteroPositivo,
    validarPrecio,
    validarSeleccion,
} from "../utils/validaciones";

function Inventario() {
    const navigate = useNavigate();
    const [materiales, setMateriales] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    // Modal de edición
    const [mostrarEditar, setMostrarEditar] = useState(false);
    const [materialEditando, setMaterialEditando] = useState(null);

    // Errores del modal de edición
    const [errEdNombre, setErrEdNombre] = useState("");
    const [errEdDescripcion, setErrEdDescripcion] = useState("");
    const [errEdStockActual, setErrEdStockActual] = useState("");
    const [errEdStockCritico, setErrEdStockCritico] = useState("");
    const [errEdPrecio, setErrEdPrecio] = useState("");
    const [errEdCategoria, setErrEdCategoria] = useState("");

    // Modal de eliminación
    const [mostrarEliminar, setMostrarEliminar] = useState(false);
    const [materialAEliminar, setMaterialAEliminar] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [matsData, catsData] = await Promise.all([
                getMateriales(),
                getCategorias(),
            ]);
            setMateriales(matsData);
            setCategorias(catsData);
        } catch (err) {
            setError(err.message || "Error al cargar el inventario");
        } finally {
            setCargando(false);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio);
    };

    const obtenerNombreCategoria = (categoriaId) => {
        const cat = categorias.find((c) => c.id_categoria === categoriaId);
        return cat ? cat.nombre_categoria : categoriaId;
    };

    const materialesFiltrados = materiales.filter((m) => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase();
        return (
            m.nombre_material.toLowerCase().includes(q) ||
            m.id_material.toLowerCase().includes(q) ||
            (m.descripcion && m.descripcion.toLowerCase().includes(q))
        );
    });

    const claseStock = (material) => {
        if (material.stock_actual === 0) return "stock-badge danger";
        if (material.stock_actual <= material.stock_critico) return "stock-badge warning";
        return "stock-badge";
    };

    // Iniciales del material para la "imagen" (primeras letras del nombre)
    const inicialesMaterial = (nombre) => {
        if (!nombre) return "??";
        const palabras = nombre.trim().split(" ");
        if (palabras.length === 1) return palabras[0].substring(0, 3).toUpperCase();
        return (palabras[0][0] + palabras[1][0] + (palabras[2]?.[0] || "")).toUpperCase();
    };

    // ====== VALIDADORES DEL MODAL EDITAR ======
    const vEdNombre = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre" });
    const vEdDescripcion = (v) => validarTextoOpcional(v, { maximo: 250, etiqueta: "La descripción" });
    const vEdStockActual = (v) => validarEnteroPositivo(v, { etiqueta: "El stock actual" });
    const vEdStockCritico = (v) => validarEnteroPositivo(v, { etiqueta: "El stock crítico" });
    const vEdPrecio = (v) => validarPrecio(v, { etiqueta: "El precio" });
    const vEdCategoria = (v) => validarSeleccion(v, "una categoría");

    // EDITAR
    const abrirEditar = (material) => {
        setMaterialEditando({ ...material });
        setErrEdNombre("");
        setErrEdDescripcion("");
        setErrEdStockActual("");
        setErrEdStockCritico("");
        setErrEdPrecio("");
        setErrEdCategoria("");
        setMostrarEditar(true);
    };

    const handleCambioCampo = (campo, valor) => {
        setMaterialEditando((prev) => ({ ...prev, [campo]: valor }));
    };

    const confirmarEditar = async () => {
        setError("");

        const errN = vEdNombre(materialEditando.nombre_material);
        const errD = vEdDescripcion(materialEditando.descripcion);
        const errSA = vEdStockActual(materialEditando.stock_actual);
        const errSC = vEdStockCritico(materialEditando.stock_critico);
        const errP = vEdPrecio(materialEditando.precio_unitario);
        const errC = vEdCategoria(materialEditando.categoria_id);

        setErrEdNombre(errN);
        setErrEdDescripcion(errD);
        setErrEdStockActual(errSA);
        setErrEdStockCritico(errSC);
        setErrEdPrecio(errP);
        setErrEdCategoria(errC);

        if (errN || errD || errSA || errSC || errP || errC) return;

        try {
            const payload = {
                nombre_material: String(materialEditando.nombre_material).trim(),
                descripcion: materialEditando.descripcion
                    ? String(materialEditando.descripcion).trim() || null
                    : null,
                stock_actual: Number(materialEditando.stock_actual),
                stock_critico: Number(materialEditando.stock_critico),
                precio_unitario: Number(materialEditando.precio_unitario),
                categoria_id: materialEditando.categoria_id,
            };
            await actualizarMaterial(materialEditando.id_material, payload);
            setMostrarEditar(false);
            setMaterialEditando(null);
            setMensajeOk("Material actualizado correctamente.");
            setTimeout(() => setMensajeOk(""), 3000);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al actualizar material");
        }
    };

    // ELIMINAR
    const abrirEliminar = (material) => {
        setMaterialAEliminar(material);
        setMostrarEliminar(true);
    };

    const confirmarEliminar = async () => {
        setError("");
        try {
            await eliminarMaterial(materialAEliminar.id_material);
            setMostrarEliminar(false);
            setMaterialAEliminar(null);
            setMensajeOk("Material eliminado correctamente.");
            setTimeout(() => setMensajeOk(""), 3000);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al eliminar material");
            setMostrarEliminar(false);
        }
    };

    return (
        <AppLayout>
            <div className="inventory-page">
                <div className="inventory-header">
                    <div>
                        <h1>Inventario</h1>
                        <p>Gestión de recursos disponibles para los servicios eléctricos.</p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            onClick={() => navigate("/buscador")}
                            title="Buscar productos en tiendas y agregarlos a recursos pendientes"
                        >
                            Comprar más en tiendas
                        </button>
                        <button onClick={() => navigate("/agregar-producto")}>
                            Agregar recurso
                        </button>
                    </div>
                </div>

                <div className="inventory-search">
                    <input
                        type="text"
                        placeholder="Buscar recurso por nombre, código o descripción..."
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
                {mensajeOk && (
                    <div className="alert alert-success" role="alert">
                        {mensajeOk}
                    </div>
                )}

                <div className="inventory-table-card">
                    <div className="inventory-table-head">
                        <span>Imagen</span>
                        <span>Código</span>
                        <span>Nombre</span>
                        <span>Precio</span>
                        <span>Categoría</span>
                        <span>Stock</span>
                        <span>Acciones</span>
                    </div>

                    {cargando ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            Cargando inventario...
                        </div>
                    ) : materialesFiltrados.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                            {busqueda
                                ? "No se encontraron recursos con esos filtros."
                                : "No hay recursos en el inventario."}
                        </div>
                    ) : (
                        materialesFiltrados.map((material) => (
                            <div className="inventory-row" key={material.id_material}>
                                <div className="inventory-image">
                                    {inicialesMaterial(material.nombre_material)}
                                </div>

                                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                                    {material.id_material}
                                </div>

                                <div>
                                    <strong>{material.nombre_material}</strong>
                                    {material.descripcion && (
                                        <p>
                                            {material.descripcion.length > 80
                                                ? material.descripcion.substring(0, 80) + "..."
                                                : material.descripcion}
                                        </p>
                                    )}
                                </div>

                                <div><strong>{formatearPrecio(material.precio_unitario)}</strong></div>

                                <div>{obtenerNombreCategoria(material.categoria_id)}</div>

                                <div>
                                    <span className={claseStock(material)}>
                                        {material.stock_actual}
                                    </span>
                                    {material.stock_actual <= material.stock_critico && material.stock_actual > 0 && (
                                        <p style={{ fontSize: "0.75rem", color: "#d97706", margin: "0.25rem 0 0" }}>
                                            Stock crítico
                                        </p>
                                    )}
                                </div>

                                <div className="inventory-actions">
                                    <button
                                        className="edit-btn"
                                        onClick={() => abrirEditar(material)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => abrirEliminar(material)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* MODAL EDITAR */}
                {mostrarEditar && materialEditando && (
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Editar material</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setMostrarEditar(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Nombre *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errEdNombre ? "is-invalid" : ""}`}
                                                value={materialEditando.nombre_material || ""}
                                                onChange={(e) => handleCambioCampo("nombre_material", e.target.value)}
                                                onBlur={() => setErrEdNombre(vEdNombre(materialEditando.nombre_material))}
                                                maxLength={50}
                                            />
                                            {errEdNombre && (
                                                <div className="invalid-feedback">{errEdNombre}</div>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Categoría *</label>
                                            <select
                                                className={`form-select ${errEdCategoria ? "is-invalid" : ""}`}
                                                value={materialEditando.categoria_id || ""}
                                                onChange={(e) => handleCambioCampo("categoria_id", e.target.value)}
                                                onBlur={() => setErrEdCategoria(vEdCategoria(materialEditando.categoria_id))}
                                            >
                                                <option value="">Seleccionar categoría</option>
                                                {categorias.map((c) => (
                                                    <option key={c.id_categoria} value={c.id_categoria}>
                                                        {c.nombre_categoria}
                                                    </option>
                                                ))}
                                            </select>
                                            {errEdCategoria && (
                                                <div className="invalid-feedback">{errEdCategoria}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Precio (CLP) *</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errEdPrecio ? "is-invalid" : ""}`}
                                                min="0"
                                                step="0.01"
                                                value={materialEditando.precio_unitario ?? ""}
                                                onChange={(e) => handleCambioCampo("precio_unitario", e.target.value)}
                                                onBlur={() => setErrEdPrecio(vEdPrecio(materialEditando.precio_unitario))}
                                            />
                                            {errEdPrecio && (
                                                <div className="invalid-feedback">{errEdPrecio}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Stock actual *</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errEdStockActual ? "is-invalid" : ""}`}
                                                min="0"
                                                step="1"
                                                value={materialEditando.stock_actual ?? ""}
                                                onChange={(e) => handleCambioCampo("stock_actual", e.target.value)}
                                                onBlur={() => setErrEdStockActual(vEdStockActual(materialEditando.stock_actual))}
                                            />
                                            {errEdStockActual && (
                                                <div className="invalid-feedback">{errEdStockActual}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Stock crítico *</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errEdStockCritico ? "is-invalid" : ""}`}
                                                min="0"
                                                step="1"
                                                value={materialEditando.stock_critico ?? ""}
                                                onChange={(e) => handleCambioCampo("stock_critico", e.target.value)}
                                                onBlur={() => setErrEdStockCritico(vEdStockCritico(materialEditando.stock_critico))}
                                            />
                                            {errEdStockCritico && (
                                                <div className="invalid-feedback">{errEdStockCritico}</div>
                                            )}
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Descripción</label>
                                            <textarea
                                                className={`form-control ${errEdDescripcion ? "is-invalid" : ""}`}
                                                rows="3"
                                                value={materialEditando.descripcion || ""}
                                                onChange={(e) => handleCambioCampo("descripcion", e.target.value)}
                                                onBlur={() => setErrEdDescripcion(vEdDescripcion(materialEditando.descripcion))}
                                                maxLength={250}
                                            ></textarea>
                                            {errEdDescripcion && (
                                                <div className="invalid-feedback">{errEdDescripcion}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setMostrarEditar(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={confirmarEditar}
                                    >
                                        Guardar cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL ELIMINAR CON CONTRASEÑA */}
                <ConfirmarPasswordModal
                    mostrar={mostrarEliminar}
                    titulo="Confirmar eliminación"
                    mensaje={
                         materialAEliminar
                         ? `Vas a eliminar el material "${materialAEliminar.nombre_material}". Esta acción no se puede deshacer.`
                         : ""
                    }
                    colorBoton="btn-danger"
                    textoBoton="Sí, eliminar"
                    onConfirmar={confirmarEliminar}
                    onCancelar={() => {
                        setMostrarEliminar(false);
                        setMaterialAEliminar(null);
                    }}
                />
            </div>
        </AppLayout>
    );
}

export default Inventario;