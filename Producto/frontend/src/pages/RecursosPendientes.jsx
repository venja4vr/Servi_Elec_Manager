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

    const [mostrarModal, setMostrarModal] = useState(false);
    const [itemAComprar, setItemAComprar] = useState(null);
    const [categoriaNuevo, setCategoriaNuevo] = useState("");
    const [stockCriticoNuevo, setStockCriticoNuevo] = useState(5);

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
        localStorage.setItem(
            CARRITO_KEY,
            JSON.stringify(nuevoCarrito)
        );

        setCarrito(nuevoCarrito);
    };

    const cargarDatosInventario = async () => {
        try {
            const [mats, cats] = await Promise.all([
                getMateriales(),
                getCategorias(),
            ]);

            setMateriales(mats);
            setCategorias(cats);
        } catch (err) {
            setError(
                "Error al cargar inventario: " + err.message
            );
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio || 0);
    };

    const handleCambiarCantidad = (
        codigo,
        tienda,
        nuevaCantidad
    ) => {
        const cant = Number(nuevaCantidad);

        if (cant < 1) return;

        const actualizado = carrito.map((item) =>
            item.codigo === codigo &&
            item.tienda === tienda
                ? { ...item, cantidad: cant }
                : item
        );

        guardarCarrito(actualizado);
    };

    const handleVincularMaterial = (
        codigo,
        tienda,
        materialId
    ) => {
        const actualizado = carrito.map((item) =>
            item.codigo === codigo &&
            item.tienda === tienda
                ? {
                      ...item,
                      material_vinculado:
                          materialId || null,
                  }
                : item
        );

        guardarCarrito(actualizado);
    };

    const handleQuitarItem = (codigo, tienda) => {
        const actualizado = carrito.filter(
            (item) =>
                !(
                    item.codigo === codigo &&
                    item.tienda === tienda
                )
        );

        guardarCarrito(actualizado);

        setMensajeOk(
            "Producto removido de recursos pendientes."
        );

        setTimeout(() => setMensajeOk(""), 2500);
    };

    const handleMarcarComoComprado = async (item) => {
        setError("");

        try {
            if (item.material_vinculado) {
                await ajustarStockMaterial(
                    item.material_vinculado,
                    item.cantidad
                );

                quitarYConfirmar(
                    item,
                    `${item.cantidad} unidades agregadas al stock existente.`
                );
            } else {
                setItemAComprar(item);
                setCategoriaNuevo("");
                setStockCriticoNuevo(5);
                setMostrarModal(true);
            }
        } catch (err) {
            setError(
                "Error al actualizar inventario: " +
                    err.message
            );
        }
    };

    const confirmarCrearMaterialNuevo = async () => {
        if (!categoriaNuevo) {
            setError(
                "Debes seleccionar una categoría."
            );

            return;
        }

        try {
            await crearMaterial({
                nombre_material: itemAComprar.nombre,

                descripcion: `Marca: ${itemAComprar.marca}. Comprado en ${itemAComprar.tienda}.`,

                stock_actual: itemAComprar.cantidad,

                stock_critico: Number(
                    stockCriticoNuevo
                ),

                precio_unitario: itemAComprar.precio,

                categoria_id: categoriaNuevo,
            });

            quitarYConfirmar(
                itemAComprar,
                `Nuevo material creado con ${itemAComprar.cantidad} unidades.`
            );

            setMostrarModal(false);
            setItemAComprar(null);

            await cargarDatosInventario();
        } catch (err) {
            setError(
                "Error al crear material: " +
                    err.message
            );
        }
    };

    const quitarYConfirmar = (item, mensaje) => {
        const actualizado = carrito.filter(
            (i) =>
                !(
                    i.codigo === item.codigo &&
                    i.tienda === item.tienda
                )
        );

        guardarCarrito(actualizado);

        setMensajeOk(mensaje);

        setTimeout(() => setMensajeOk(""), 3500);
    };

    const totalEstimado = carrito.reduce(
        (sum, item) =>
            sum +
            Number(item.precio || 0) *
                Number(item.cantidad || 0),
        0
    );

    return (
        <AppLayout>
            <div className="search-page">
                {/* HEADER */}
                <div className="search-header">
                    <div>
                        <h1>Recursos pendientes</h1>

                        <p>
                            Revisa recursos pendientes de
                            compra y asignación.
                        </p>
                    </div>
                </div>

                {/* ALERTAS */}
                {error && (
                    <div
                        className="alert alert-danger mb-4"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {mensajeOk && (
                    <div
                        className="alert alert-success mb-4"
                        role="alert"
                    >
                        {mensajeOk}
                    </div>
                )}

                {/* ACCIONES */}
                <div className="search-actions">
                    <input
                        type="text"
                        placeholder={`Total estimado: ${formatearPrecio(
                            totalEstimado
                        )}`}
                        disabled
                    />

                    <button
                        className="search-btn"
                        disabled
                    >
                        {carrito.length} productos
                    </button>

                    <button
                        className="secondary-action-btn"
                        onClick={() =>
                            navigate("/buscador")
                        }
                    >
                        Buscador
                    </button>
                </div>

                {/* LISTA */}
                <div className="resource-list">
                    <div className="resource-table-head pending-head">
                        <span>Producto</span>
                        <span>Nombre</span>
                        <span>Precio</span>
                        <span>Marca</span>
                        <span>Tienda</span>
                        <span>Estado</span>
                    </div>

                    {carrito.length === 0 ? (
                        <div className="resource-row pending-row">
                            <div className="resource-image">
                                Vacío
                            </div>

                            <div>
                                <strong>
                                    No hay recursos pendientes
                                </strong>

                                <p>
                                    Agrega productos desde el
                                    buscador.
                                </p>
                            </div>

                            <div>-</div>
                            <div>-</div>
                            <div>-</div>

                            <div>
                                <span className="pending-badge">
                                    Vacío
                                </span>
                            </div>
                        </div>
                    ) : (
                        carrito.map((item) => {
                            const keyItem = `${item.codigo}-${item.tienda}`;

                            const textoBusqueda =
                                busquedasMaterial[
                                    keyItem
                                ] || "";

                            const materialActual =
                                materiales.find(
                                    (m) =>
                                        m.id_material ===
                                        item.material_vinculado
                                );

                            const materialesFiltrados =
                                materiales
                                    .filter((m) =>
                                        textoBusqueda
                                            ? m.nombre_material
                                                  .toLowerCase()
                                                  .includes(
                                                      textoBusqueda.toLowerCase()
                                                  )
                                            : true
                                    )
                                    .sort(
                                        (a, b) =>
                                            a.stock_actual -
                                            b.stock_actual
                                    )
                                    .slice(0, 5);

                            return (
                                <div
                                    className="resource-row pending-row"
                                    key={keyItem}
                                >
                                    {/* IMAGEN */}
                                    <div className="resource-image">
                                        Imagen
                                    </div>

                                    {/* INFO */}
                                    <div>
                                        <strong>
                                            {item.nombre}
                                        </strong>

                                        <p>
                                            {item.marca} ·{" "}
                                            {item.codigo}
                                        </p>

                                        {/* BUSCADOR MATERIAL */}
                                        <div className="mt-2 position-relative">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder={
                                                    materialActual
                                                        ? materialActual.nombre_material
                                                        : "Buscar material existente..."
                                                }
                                                value={
                                                    textoBusqueda
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setBusquedasMaterial(
                                                        (
                                                            prev
                                                        ) => ({
                                                            ...prev,
                                                            [keyItem]:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                onFocus={() =>
                                                    setDropdownAbierto(
                                                        keyItem
                                                    )
                                                }
                                                onBlur={() =>
                                                    setTimeout(
                                                        () =>
                                                            setDropdownAbierto(
                                                                null
                                                            ),
                                                        200
                                                    )
                                                }
                                            />

                                            {dropdownAbierto ===
                                                keyItem &&
                                                materialesFiltrados.length >
                                                    0 && (
                                                    <div
                                                        className="bg-white border rounded shadow-sm position-absolute mt-1"
                                                        style={{
                                                            zIndex: 1000,
                                                            width:
                                                                "100%",
                                                            maxHeight:
                                                                "200px",
                                                            overflowY:
                                                                "auto",
                                                        }}
                                                    >
                                                        {materialesFiltrados.map(
                                                            (
                                                                m
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        m.id_material
                                                                    }
                                                                    className="px-2 py-1 border-bottom"
                                                                    style={{
                                                                        cursor:
                                                                            "pointer",
                                                                    }}
                                                                    onMouseDown={(
                                                                        e
                                                                    ) =>
                                                                        e.preventDefault()
                                                                    }
                                                                    onClick={() => {
                                                                        handleVincularMaterial(
                                                                            item.codigo,
                                                                            item.tienda,
                                                                            m.id_material
                                                                        );

                                                                        setBusquedasMaterial(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                [keyItem]:
                                                                                    "",
                                                                            })
                                                                        );

                                                                        setDropdownAbierto(
                                                                            null
                                                                        );
                                                                    }}
                                                                >
                                                                    <div className="small fw-bold">
                                                                        {
                                                                            m.nombre_material
                                                                        }
                                                                    </div>

                                                                    <div className="small text-muted">
                                                                        Stock:{" "}
                                                                        {
                                                                            m.stock_actual
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            {materialActual && (
                                                <div className="small mt-1 text-success">
                                                    Vinculado:{" "}
                                                    {
                                                        materialActual.nombre_material
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* PRECIO */}
                                    <div className="resource-price">
                                        {formatearPrecio(
                                            item.precio *
                                                item.cantidad
                                        )}
                                    </div>

                                    {/* MARCA */}
                                    <div>
                                        {item.marca}
                                    </div>

                                    {/* TIENDA */}
                                    <div>
                                        <span
                                            className={`badge ${
                                                item.tienda ===
                                                "Sodimac"
                                                    ? "bg-primary"
                                                    : "bg-danger"
                                            }`}
                                        >
                                            {item.tienda}
                                        </span>

                                        <div className="mt-2">
                                            Cantidad:{" "}
                                            <input
                                                type="number"
                                                min="1"
                                                value={
                                                    item.cantidad
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleCambiarCantidad(
                                                        item.codigo,
                                                        item.tienda,
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="form-control form-control-sm mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* ESTADO */}
                                    <div>
                                        <span className="pending-badge">
                                            Pendiente
                                        </span>

                                        <div className="d-flex flex-column gap-2 mt-3">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() =>
                                                    handleMarcarComoComprado(
                                                        item
                                                    )
                                                }
                                            >
                                                Comprado
                                            </button>

                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() =>
                                                    handleQuitarItem(
                                                        item.codigo,
                                                        item.tienda
                                                    )
                                                }
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* MODAL */}
                {mostrarModal && itemAComprar && (
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{
                            backgroundColor:
                                "rgba(0,0,0,0.5)",
                        }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Crear material nuevo
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() =>
                                            setMostrarModal(
                                                false
                                            )
                                        }
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <p>
                                        Se creará un nuevo
                                        material en el
                                        inventario.
                                    </p>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Categoría
                                        </label>

                                        <select
                                            className="form-select"
                                            value={
                                                categoriaNuevo
                                            }
                                            onChange={(e) =>
                                                setCategoriaNuevo(
                                                    e.target
                                                        .value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Seleccionar
                                            </option>

                                            {categorias.map(
                                                (c) => (
                                                    <option
                                                        key={
                                                            c.id_categoria
                                                        }
                                                        value={
                                                            c.id_categoria
                                                        }
                                                    >
                                                        {
                                                            c.nombre_categoria
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Stock crítico
                                        </label>

                                        <input
                                            type="number"
                                            className="form-control"
                                            value={
                                                stockCriticoNuevo
                                            }
                                            onChange={(e) =>
                                                setStockCriticoNuevo(
                                                    e.target
                                                        .value
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() =>
                                            setMostrarModal(
                                                false
                                            )
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={
                                            confirmarCrearMaterialNuevo
                                        }
                                    >
                                        Crear material
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