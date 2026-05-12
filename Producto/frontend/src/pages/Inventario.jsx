import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getMateriales, getCategorias } from "../services/api";

function Inventario() {
    const navigate = useNavigate();
    const [materiales, setMateriales] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

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

                    <button
                        className="btn btn-success px-4"
                        onClick={() => navigate("/agregar-producto")}
                    >
                        Agregar recurso
                    </button>
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
                                                    <button className="btn btn-primary btn-sm">
                                                        Editar
                                                    </button>
                                                    <button className="btn btn-danger btn-sm">
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
            </div>
        </AppLayout>
    );
}

export default Inventario;