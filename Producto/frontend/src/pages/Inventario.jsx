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

    const getBadgeStock = (material) => {
        if (material.stock_actual === 0) return "bg-danger";
        if (material.stock_actual <= material.stock_critico) return "bg-warning text-dark";
        return "bg-success";
    };

    // EDITAR
    const abrirEditar = (material) => {
        setMaterialEditando({ ...material });
        setMostrarEditar(true);
    };

    const handleCambioCampo = (campo, valor) => {
        setMaterialEditando((prev) => ({ ...prev, [campo]: valor }));
    };

    const confirmarEditar = async () => {
        setError("");
        try {
            const payload = {
                nombre_material: materialEditando.nombre_material,
                descripcion: materialEditando.descripcion || null,
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
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Inventario</h2>
                        <p className="text-muted mb-0">
                            Gestión de recursos disponibles para los servicios eléctricos.
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-primary px-3"
                            onClick={() => navigate("/buscador")}
                            title="Buscar productos en tiendas y agregarlos a recursos pendientes"
                        >
                            Comprar más en tiendas
                        </button>
                        <button
                            className="btn btn-success px-4"
                            onClick={() => navigate("/agregar-producto")}
                        >
                            Agregar recurso
                        </button>
                    </div>
                </div>

                <div className="row align-items-center mb-4">
                    <div className="col-md-8">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar recurso por nombre, código o descripción"
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
                {mensajeOk && (
                    <div className="alert alert-success" role="alert">
                        {mensajeOk}
                    </div>
                )}

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th className="text-end">Precio</th>
                                    <th className="text-center">Stock</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted">
                                            Cargando inventario...
                                        </td>
                                    </tr>
                                ) : materialesFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted">
                                            {busqueda
                                                ? "No se encontraron recursos con esos filtros."
                                                : "No hay recursos en el inventario."}
                                        </td>
                                    </tr>
                                ) : (
                                    materialesFiltrados.map((material) => (
                                        <tr key={material.id_material}>
                                            <td className="small text-muted">{material.id_material}</td>
                                            <td>
                                                <strong>{material.nombre_material}</strong>
                                                {material.descripcion && (
                                                    <p className="text-muted mb-0 small">
                                                        {material.descripcion.length > 80
                                                            ? material.descripcion.substring(0, 80) + "..."
                                                            : material.descripcion}
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary-subtle text-dark">
                                                    {obtenerNombreCategoria(material.categoria_id)}
                                                </span>
                                            </td>
                                            <td className="text-end fw-bold">
                                                {formatearPrecio(material.precio_unitario)}
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${getBadgeStock(material)}`}>
                                                    {material.stock_actual}
                                                </span>
                                                {material.stock_actual <= material.stock_critico && material.stock_actual > 0 && (
                                                    <div className="small text-warning mt-1">
                                                        Stock crítico
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => abrirEditar(material)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => abrirEliminar(material)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
                                                className="form-control"
                                                value={materialEditando.nombre_material || ""}
                                                onChange={(e) =>
                                                    handleCambioCampo("nombre_material", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Categoría *</label>
                                            <select
                                                className="form-select"
                                                value={materialEditando.categoria_id || ""}
                                                onChange={(e) =>
                                                    handleCambioCampo("categoria_id", e.target.value)
                                                }
                                            >
                                                {categorias.map((c) => (
                                                    <option key={c.id_categoria} value={c.id_categoria}>
                                                        {c.nombre_categoria}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Precio (CLP) *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={materialEditando.precio_unitario || 0}
                                                onChange={(e) =>
                                                    handleCambioCampo("precio_unitario", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Stock actual *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={materialEditando.stock_actual || 0}
                                                onChange={(e) =>
                                                    handleCambioCampo("stock_actual", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Stock crítico *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={materialEditando.stock_critico || 0}
                                                onChange={(e) =>
                                                    handleCambioCampo("stock_critico", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Descripción</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                value={materialEditando.descripcion || ""}
                                                onChange={(e) =>
                                                    handleCambioCampo("descripcion", e.target.value)
                                                }
                                            ></textarea>
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