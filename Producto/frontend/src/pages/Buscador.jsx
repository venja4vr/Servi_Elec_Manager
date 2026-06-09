import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { buscarPrecios } from "../services/api";

const CARRITO_KEY = "recursos_pendientes_carrito";

function Buscador() {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [tienda, setTienda] = useState("");
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mensajeOk, setMensajeOk] = useState("");

    useEffect(() => {
        cargarProductos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarProductos = async (
        textoBusqueda = "",
        filtroTienda = ""
    ) => {
        setCargando(true);
        setError("");

        try {
            const data = await buscarPrecios(
                textoBusqueda,
                filtroTienda
            );

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
        cargarProductos(query, tienda);
    };

    const handleAgregarAlCarrito = (producto) => {
        try {
            const carritoRaw = localStorage.getItem(CARRITO_KEY);
            const carrito = carritoRaw ? JSON.parse(carritoRaw) : [];

            const existe = carrito.find(
                (item) =>
                    item.codigo === producto.codigo &&
                    item.tienda === producto.tienda
            );

            if (existe) {
                setError(
                    `"${producto.nombre}" ya está en recursos pendientes.`
                );

                setTimeout(() => setError(""), 3000);
                return;
            }

            const nuevoItem = {
                codigo: producto.codigo,
                nombre: producto.nombre,
                marca: producto.marca,
                tienda: producto.tienda,
                precio: producto.precio,
                url: producto.url,
                cantidad: 1,
                material_vinculado: null,
                fecha_agregado: new Date().toISOString(),
            };

            carrito.push(nuevoItem);

            localStorage.setItem(
                CARRITO_KEY,
                JSON.stringify(carrito)
            );

            setMensajeOk(
                `"${producto.nombre}" agregado a recursos pendientes.`
            );

            setTimeout(() => setMensajeOk(""), 3000);
        } catch (err) {
            setError(
                "Error al agregar al carrito: " + err.message
            );
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio);
    };

    return (
        <AppLayout>
            <div className="search-page">
                {/* HEADER */}
                <div className="search-header">
                    <div>
                        <h1>Buscador</h1>

                        <p>
                            Consulta recursos disponibles para
                            los servicios eléctricos.
                        </p>
                    </div>
                </div>

                {/* ALERTAS */}
                {error && (
                    <div
                        className="alert alert-danger mt-3"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {mensajeOk && (
                    <div
                        className="alert alert-success mt-3"
                        role="alert"
                    >
                        {mensajeOk}
                    </div>
                )}

                {/* BUSCADOR */}
                <form onSubmit={handleBuscar}>
                    <div className="search-actions">
                        <input
                            type="text"
                            placeholder="Buscar producto, marca o tienda..."
                            maxLength={150}
                            value={query}
                            onChange={(e) =>
                                setQuery(e.target.value)
                            }
                        />

                        <select
                            value={tienda}
                            onChange={(e) =>
                                setTienda(e.target.value)
                            }
                            className="search-select"
                        >
                            <option value="">
                                Todas las tiendas
                            </option>

                            <option value="Sodimac">
                                Sodimac
                            </option>

                            <option value="Easy">
                                Easy
                            </option>
                        </select>

                        <button
                            type="submit"
                            className="search-btn"
                            disabled={cargando}
                        >
                            {cargando
                                ? "Buscando..."
                                : "Buscar"}
                        </button>

                        <button
                            type="button"
                            className="secondary-action-btn"
                            onClick={() =>
                                navigate(
                                    "/recursos-pendientes"
                                )
                            }
                        >
                            Recursos pendientes
                        </button>
                    </div>
                </form>

                {/* TABLA */}
                <div className="resource-list">
                    <div className="resource-table-head">
                        <span>Producto</span>
                        <span>Nombre</span>
                        <span>Precio</span>
                        <span>Marca</span>
                        <span>Tienda</span>
                    </div>

                    {cargando && productos.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            Cargando productos...
                        </div>
                    ) : productos.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            No se encontraron productos.
                        </div>
                    ) : (
                        productos.map((producto) => (
                            <div
                                className="resource-row"
                                key={`${producto.codigo}-${producto.tienda}`}
                            >
                                {/* IMAGEN */}
                                <div
                                    className="resource-image"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: "100px",
                                    }}
                                >
                                    {producto.imagen ? (
                                        <img
                                            src={producto.imagen}
                                            alt={producto.nombre}
                                            style={{
                                                maxWidth: "100px",
                                                maxHeight: "100px",
                                                objectFit: "contain",
                                                borderRadius: "4px",
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.parentElement.innerHTML = '<span style="color: #999; font-size: 12px;">Sin imagen</span>';
                                            }}
                                        />
                                    ) : (
                                        <span style={{ color: "#999", fontSize: "12px" }}>
                                            Sin imagen
                                        </span>
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

                                    <p>
                                        Código:{" "}
                                        {producto.codigo}
                                    </p>
                                </div>

                                {/* PRECIO */}
                                <div className="resource-price">
                                    {formatearPrecio(
                                        producto.precio
                                    )}
                                </div>

                                {/* MARCA */}
                                <div>
                                    {producto.marca}
                                </div>

                                {/* TIENDA + BOTÓN */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection:
                                            "column",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        className={`badge ${
                                            producto.tienda ===
                                            "Sodimac"
                                                ? "bg-primary"
                                                : "bg-danger"
                                        }`}
                                    >
                                        {producto.tienda}
                                    </span>

                                    <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() =>
                                            handleAgregarAlCarrito(
                                                producto
                                            )
                                        }
                                    >
                                        + Agregar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

export default Buscador;