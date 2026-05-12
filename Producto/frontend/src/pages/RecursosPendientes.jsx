import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getMateriales,
    getCategorias,
    crearMaterial,
    ajustarStockMaterial,
} from "../services/api";

const CARRITO_KEY = "recursos_pendientes_carrito";

function RecursosPendientes() {
    const navigate = useNavigate();
    const [carrito, setCarrito] = useState([]);
    const [materiales, setMateriales] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    // Modal para crear material nuevo
    const [mostrarModal, setMostrarModal] = useState(false);
    const [itemAComprar, setItemAComprar] = useState(null);
    const [categoriaNuevo, setCategoriaNuevo] = useState("");
    const [stockCriticoNuevo, setStockCriticoNuevo] = useState(5);

    // Búsqueda por item del carrito (clave: "codigo-tienda", valor: texto buscado)
    const [busquedasMaterial, setBusquedasMaterial] = useState({});
    const [dropdownAbierto, setDropdownAbierto] = useState(null);

    useEffect(() => {
        cargarCarrito();
        cargarDatosInventario();
    }, []);

    const cargarCarrito = () => {
        const raw = localStorage.getItem(CARRITO_KEY);
        setCarrito(raw ? JSON.parse(raw) : []);
    };

    const guardarCarrito = (nuevoCarrito) => {
        localStorage.setItem(CARRITO_KEY, JSON.stringify(nuevoCarrito));
        setCarrito(nuevoCarrito);
    };

    const cargarDatosInventario = async () => {
        try {
            const [mats, cats] = await Promise.all([getMateriales(), getCategorias()]);
            setMateriales(mats);
            setCategorias(cats);
        } catch (err) {
            setError("Error al cargar inventario: " + err.message);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio || 0);
    };

    const handleCambiarCantidad = (codigo, tienda, nuevaCantidad) => {
        const cant = Number(nuevaCantidad);
        if (cant < 1) return;
        const actualizado = carrito.map((item) =>
            item.codigo === codigo && item.tienda === tienda
                ? { ...item, cantidad: cant }
                : item
        );
        guardarCarrito(actualizado);
    };

    const handleVincularMaterial = (codigo, tienda, materialId) => {
        const actualizado = carrito.map((item) =>
            item.codigo === codigo && item.tienda === tienda
                ? { ...item, material_vinculado: materialId || null }
                : item
        );
        guardarCarrito(actualizado);
    };

    const handleQuitarItem = (codigo, tienda) => {
        const actualizado = carrito.filter(
            (item) => !(item.codigo === codigo && item.tienda === tienda)
        );
        guardarCarrito(actualizado);
        setMensajeOk("Producto removido del carrito.");
        setTimeout(() => setMensajeOk(""), 2000);
    };

    const handleMarcarComoComprado = async (item) => {
        setError("");
        try {
            if (item.material_vinculado) {
                // Caso A: sumar al stock de un material existente
                await ajustarStockMaterial(item.material_vinculado, item.cantidad);
                quitarYConfirmar(item, `${item.cantidad} unidades agregadas al stock existente.`);
            } else {
                // Caso B: abrir modal para crear material nuevo
                setItemAComprar(item);
                setCategoriaNuevo("");
                setStockCriticoNuevo(5);
                setMostrarModal(true);
            }
        } catch (err) {
            setError("Error al actualizar inventario: " + err.message);
        }
    };

    const confirmarCrearMaterialNuevo = async () => {
        if (!categoriaNuevo) {
            setError("Debes seleccionar una categoría para el nuevo material.");
            return;
        }
        try {
            await crearMaterial({
                nombre_material: itemAComprar.nombre,
                descripcion: `Marca: ${itemAComprar.marca}. Comprado en ${itemAComprar.tienda}.`,
                stock_actual: itemAComprar.cantidad,
                stock_critico: Number(stockCriticoNuevo),
                precio_unitario: itemAComprar.precio,
                categoria_id: categoriaNuevo,
            });
            quitarYConfirmar(
                itemAComprar,
                `Nuevo material creado en el inventario con ${itemAComprar.cantidad} unidades.`
            );
            setMostrarModal(false);
            setItemAComprar(null);
            await cargarDatosInventario(); // refrescar lista de materiales
        } catch (err) {
            setError("Error al crear material: " + err.message);
        }
    };

    const quitarYConfirmar = (item, mensaje) => {
        const actualizado = carrito.filter(
            (i) => !(i.codigo === item.codigo && i.tienda === item.tienda)
        );
        guardarCarrito(actualizado);
        setMensajeOk(mensaje);
        setTimeout(() => setMensajeOk(""), 3500);
    };

    const totalEstimado = carrito.reduce(
        (sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0),
        0
    );

    return (
        <AppLayout>
            <div className="container-fluid">
                <div className="mb-4">
                <h2 className="fw-bold mb-1">Recursos pendientes</h2>
                <p className="text-muted mb-0">
                    Productos por comprar y agregar al inventario.
                </p>
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

                {carrito.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                        <p className="text-muted mb-3">
                            No tienes productos pendientes por comprar.
                        </p>
                        <button
                            className="btn btn-primary mx-auto"
                            style={{ maxWidth: "300px" }}
                            onClick={() => navigate("/buscador")}
                        >
                            Buscar productos
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="card border-0 shadow-sm rounded-4 mb-3" style={{ overflow: "visible" }}>
                            <div className="table-responsive" style={{ overflow: "visible" }}>
                                <table className="table align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Producto</th>
                                            <th>Tienda</th>
                                            <th className="text-end">Precio</th>
                                            <th className="text-center">Cantidad</th>
                                            <th className="text-end">Subtotal</th>
                                            <th>Vincular con inventario</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carrito.map((item) => (
                                            <tr key={`${item.codigo}-${item.tienda}`}>
                                                <td>
                                                    <strong>{item.nombre}</strong>
                                                    <p className="text-muted mb-0 small">
                                                        {item.marca} · {item.codigo}
                                                    </p>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            item.tienda === "Sodimac"
                                                                ? "bg-primary"
                                                                : "bg-danger"
                                                        }`}
                                                    >
                                                        {item.tienda}
                                                    </span>
                                                </td>
                                                <td className="text-end">{formatearPrecio(item.precio)}</td>
                                                <td className="text-center" style={{ width: "100px" }}>
                                                    <input
                                                        type="number"
                                                        className="form-control text-center"
                                                        value={item.cantidad}
                                                        min="1"
                                                        onChange={(e) =>
                                                            handleCambiarCantidad(
                                                                item.codigo,
                                                                item.tienda,
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="text-end fw-bold">
                                                    {formatearPrecio(item.precio * item.cantidad)}
                                                </td>
                                            <td style={{ minWidth: "280px", position: "relative" }}>
                                                {(() => {
                                                    const keyItem = `${item.codigo}-${item.tienda}`;
                                                    const textoBusqueda = busquedasMaterial[keyItem] || "";
                                                    const materialActual = materiales.find(
                                                        (m) => m.id_material === item.material_vinculado
                                                    );

                                                    // Filtrar y limitar a 5 resultados, ordenados por stock más bajo primero
                                                    const materialesFiltrados = materiales
                                                        .filter((m) =>
                                                            textoBusqueda
                                                                ? m.nombre_material
                                                                    .toLowerCase()
                                                                    .includes(textoBusqueda.toLowerCase())
                                                                : true
                                                        )
                                                        .sort((a, b) => a.stock_actual - b.stock_actual)
                                                        .slice(0, 5);

                                                    return (
                                                        <>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder={
                                                                    materialActual
                                                                        ? materialActual.nombre_material
                                                                        : "Crear material nuevo (o buscar)"
                                                                }
                                                                value={textoBusqueda}
                                                                onChange={(e) =>
                                                                    setBusquedasMaterial((prev) => ({
                                                                        ...prev,
                                                                        [keyItem]: e.target.value,
                                                                    }))
                                                                }
                                                                onFocus={() => setDropdownAbierto(keyItem)}
                                                                onBlur={() =>
                                                                    // Delay para permitir click en una opción antes de cerrar
                                                                    setTimeout(() => setDropdownAbierto(null), 200)
                                                                }
                                                            />

                                                            {dropdownAbierto === keyItem && materialesFiltrados.length > 0 && (
                                                                <div
                                                                    className="bg-white border rounded shadow-sm position-absolute mt-1"
                                                                    style={{
                                                                        zIndex: 1000,
                                                                        width: "100%",
                                                                        maxHeight: "200px",
                                                                        overflowY: "auto",
                                                                    }}
                                                                >
                                                                    {materialesFiltrados.map((m) => (
                                                                        <div
                                                                            key={m.id_material}
                                                                            className="px-2 py-1 border-bottom"
                                                                            style={{ cursor: "pointer" }}
                                                                            onMouseDown={(e) => e.preventDefault()}
                                                                            onClick={() => {
                                                                                handleVincularMaterial(
                                                                                    item.codigo,
                                                                                    item.tienda,
                                                                                    m.id_material
                                                                                );
                                                                                setBusquedasMaterial((prev) => ({
                                                                                    ...prev,
                                                                                    [keyItem]: "",
                                                                                }));
                                                                                setDropdownAbierto(null);
                                                                            }}
                                                                            onMouseEnter={(e) =>
                                                                                (e.currentTarget.style.background = "#f8f9fa")
                                                                            }
                                                                            onMouseLeave={(e) =>
                                                                                (e.currentTarget.style.background = "white")
                                                                            }
                                                                        >
                                                                            <div className="small fw-bold">{m.nombre_material}</div>
                                                                            <div className="small text-muted">
                                                                                Stock: {m.stock_actual} | {formatearPrecio(m.precio_unitario)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {materialActual && (
                                                                <div className="small mt-1">
                                                                    <span className="text-success">
                                                                        Vinculado: {materialActual.nombre_material}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-link btn-sm p-0 ms-2 text-danger"
                                                                        onClick={() =>
                                                                            handleVincularMaterial(item.codigo, item.tienda, null)
                                                                        }
                                                                    >
                                                                        Quitar
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleMarcarComoComprado(item)}
                                                            title="Marcar como comprado y agregar al inventario"
                                                        >
                                                            Comprado
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() =>
                                                                handleQuitarItem(item.codigo, item.tienda)
                                                            }
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">
                                    Total productos: <strong>{carrito.length}</strong>
                                </span>
                                <span className="fs-5">
                                    Total estimado:{" "}
                                    <strong className="text-primary">
                                        {formatearPrecio(totalEstimado)}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* MODAL: crear material nuevo */}
                {mostrarModal && itemAComprar && (
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Crear material nuevo en inventario</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setMostrarModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p>
                                        Vas a crear un material nuevo en el inventario con los datos del
                                        producto que compraste:
                                    </p>
                                    <ul>
                                        <li><strong>Nombre:</strong> {itemAComprar.nombre}</li>
                                        <li><strong>Marca:</strong> {itemAComprar.marca}</li>
                                        <li><strong>Cantidad:</strong> {itemAComprar.cantidad}</li>
                                        <li><strong>Precio unitario:</strong> {formatearPrecio(itemAComprar.precio)}</li>
                                    </ul>

                                    <div className="mb-3">
                                        <label className="form-label">Categoría *</label>
                                        <select
                                            className="form-select"
                                            value={categoriaNuevo}
                                            onChange={(e) => setCategoriaNuevo(e.target.value)}
                                            required
                                        >
                                            <option value="">Seleccionar categoría</option>
                                            {categorias.map((c) => (
                                                <option key={c.id_categoria} value={c.id_categoria}>
                                                    {c.nombre_categoria}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Stock crítico (alerta de reposición)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={stockCriticoNuevo}
                                            onChange={(e) => setStockCriticoNuevo(e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setMostrarModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={confirmarCrearMaterialNuevo}
                                    >
                                        Crear y agregar al inventario
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

export default RecursosPendientes;