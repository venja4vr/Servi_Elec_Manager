import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { fetchAPI, getCategorias } from "../services/api";

function AgregarProducto() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [stockActual, setStockActual] = useState(0);
    const [stockCritico, setStockCritico] = useState(0);
    const [precio, setPrecio] = useState(0);
    const [categoriaId, setCategoriaId] = useState("");
    const [categorias, setCategorias] = useState([]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            const data = await getCategorias();
            setCategorias(data);
        } catch (err) {
            setError("Error al cargar categorías");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!categoriaId) {
            setError("Debes seleccionar una categoría");
            return;
        }
        if (Number(precio) < 0 || Number(stockActual) < 0 || Number(stockCritico) < 0) {
            setError("Los valores numéricos no pueden ser negativos");
            return;
        }

        setCargando(true);
        try {
            await fetchAPI("/materiales/", {
                method: "POST",
                body: JSON.stringify({
                    nombre_material: nombre,
                    descripcion: descripcion || null,
                    stock_actual: Number(stockActual),
                    stock_critico: Number(stockCritico),
                    precio_unitario: Number(precio),
                    categoria_id: categoriaId,
                }),
            });
            navigate("/inventario");
        } catch (err) {
            setError(err.message || "Error al crear el recurso");
        } finally {
            setCargando(false);
        }
    };

    return (
        <AppLayout>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Agregar recurso</h2>
                        <p className="text-muted mb-0">
                            Registro manual de un nuevo producto para el inventario.
                        </p>
                    </div>
                    <button
                        className="btn btn-dark px-4"
                        onClick={() => navigate("/inventario")}
                    >
                        Volver
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label">Nombre del producto *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej: Interruptor Simple Bticino"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Categoría *</label>
                                <select
                                    className="form-select"
                                    value={categoriaId}
                                    onChange={(e) => setCategoriaId(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id_categoria} value={cat.id_categoria}>
                                            {cat.nombre_categoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Precio unitario (CLP) *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0"
                                    min="0"
                                    value={precio}
                                    onChange={(e) => setPrecio(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Stock actual *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0"
                                    min="0"
                                    value={stockActual}
                                    onChange={(e) => setStockActual(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Stock crítico *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0"
                                    min="0"
                                    value={stockCritico}
                                    onChange={(e) => setStockCritico(e.target.value)}
                                    required
                                />
                                <small className="text-muted">
                                    Cantidad mínima antes de alerta de reposición
                                </small>
                            </div>

                            <div className="col-md-12">
                                <label className="form-label">Descripción (opcional)</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="Características, marca, modelo, etc."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="col-md-12 d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-4"
                                    onClick={() => navigate("/inventario")}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4"
                                    disabled={cargando}
                                >
                                    {cargando ? "Guardando..." : "Guardar recurso"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

export default AgregarProducto;