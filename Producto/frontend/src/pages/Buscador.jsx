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
        cargarProductos(query, tienda);
    };

    const handleAgregarAlCarrito = (producto) => {
        try {
            // Leer carrito actual del localStorage
            const carritoRaw = localStorage.getItem(CARRITO_KEY);
            const carrito = carritoRaw ? JSON.parse(carritoRaw) : [];

            // Verificar si el producto ya está en el carrito
            const existe = carrito.find(
                (item) =>
                    item.codigo === producto.codigo && item.tienda === producto.tienda
            );

            if (existe) {
                setError(`"${producto.nombre}" ya está en recursos pendientes.`);
                setTimeout(() => setError(""), 3000);
                return;
            }

            // Agregar producto al carrito con cantidad inicial = 1
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
            localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));

            setMensajeOk(`"${producto.nombre}" agregado a recursos pendientes.`);
            setTimeout(() => setMensajeOk(""), 3000);
        } catch (err) {
            setError("Error al agregar al carrito: " + err.message);
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
            <div className="container-fluid">
                <h2 className="mb-4">Buscador de Precios</h2>

                <form onSubmit={handleBuscar}>
                    <div className="row align-items-center mb-4">
                        <div className="col-md-5">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nombre o marca"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={tienda}
                                onChange={(e) => setTienda(e.target.value)}
                            >
                                <option value="">Todas las tiendas</option>
                                <option value="Sodimac">Sodimac</option>
                                <option value="Easy">Easy</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-dark w-100" disabled={cargando}>
                                {cargando ? "Buscando..." : "Buscar"}
                            </button>
                        </div>
                        <div className="col-md-2 text-end">
                            <button
                                type="button"
                                className="btn btn-warning px-3"
                                onClick={() => navigate("/recursos-pendientes")}
                            >
                                Recursos pendientes
                            </button>
                        </div>
                    </div>
                </form>

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

                <div className="border-top pt-3">
                    <div className="row text-muted small mb-3 fw-bold">
                        <div className="col-md-2"></div>
                        <div className="col-md-3">Nombre</div>
                        <div className="col-md-2">Marca</div>
                        <div className="col-md-2">Código</div>
                        <div className="col-md-1">Tienda</div>
                        <div className="col-md-1 text-end">Precio</div>
                        <div className="col-md-1"></div>
                    </div>

                    {cargando && productos.length === 0 ? (
                        <div className="text-center text-muted py-5">Cargando productos...</div>
                    ) : productos.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            No se encontraron productos.
                        </div>
                    ) : (
                        productos.map((producto) => (
                            <div
                                className="row align-items-center mb-3 py-2 border-bottom"
                                key={`${producto.codigo}-${producto.tienda}`}
                            >
                                <div className="col-md-2">
                                    <div
                                        className="border bg-light d-flex justify-content-center align-items-center text-muted small"
                                        style={{ width: "100px", height: "80px" }}
                                    >
                                        Imagen
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <a
                                        href={producto.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-decoration-none text-dark"
                                    >
                                        {producto.nombre}
                                    </a>
                                </div>
                                <div className="col-md-2">{producto.marca}</div>
                                <div className="col-md-2 small text-muted">{producto.codigo}</div>
                                <div className="col-md-1">
                                    <span
                                        className={`badge ${
                                            producto.tienda === "Sodimac" ? "bg-primary" : "bg-danger"
                                        }`}
                                    >
                                        {producto.tienda}
                                    </span>
                                </div>
                                <div className="col-md-1 text-end fw-bold">
                                    {formatearPrecio(producto.precio)}
                                </div>
                                <div className="col-md-1">
                                    <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm w-100"
                                        onClick={() => handleAgregarAlCarrito(producto)}
                                        title="Agregar a recursos pendientes"
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