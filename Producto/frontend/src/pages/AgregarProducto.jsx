import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { fetchAPI, getCategorias } from "../services/api";
import {
    validarTexto,
    validarTextoOpcional,
    validarEnteroPositivo,
    validarPrecio,
    validarSeleccion,
} from "../utils/validaciones";

function AgregarProducto() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [stockActual, setStockActual] = useState("");
    const [stockCritico, setStockCritico] = useState("");
    const [precio, setPrecio] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [categorias, setCategorias] = useState([]);

    // Errores por campo
    const [errorNombre, setErrorNombre] = useState("");
    const [errorDescripcion, setErrorDescripcion] = useState("");
    const [errorStockActual, setErrorStockActual] = useState("");
    const [errorStockCritico, setErrorStockCritico] = useState("");
    const [errorPrecio, setErrorPrecio] = useState("");
    const [errorCategoria, setErrorCategoria] = useState("");

    const [errorGeneral, setErrorGeneral] = useState("");
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            const data = await getCategorias();
            setCategorias(data);
        } catch (err) {
            setErrorGeneral("Error al cargar categorías");
        }
    };

    // ====== VALIDADORES POR CAMPO ======
    const validarCampoNombre = (v) => validarTexto(v, { minimo: 3, maximo: 50, etiqueta: "El nombre" });
    const validarCampoDescripcion = (v) => validarTextoOpcional(v, { maximo: 250, etiqueta: "La descripción" });
    const validarCampoStockActual = (v) => validarEnteroPositivo(v, { etiqueta: "El stock actual" });
    const validarCampoStockCritico = (v) => validarEnteroPositivo(v, { etiqueta: "El stock crítico" });
    const validarCampoPrecio = (v) => validarPrecio(v, { etiqueta: "El precio" });
    const validarCampoCategoria = (v) => validarSeleccion(v, "una categoría");

    // ====== BLUR ======
    const blurNombre = () => setErrorNombre(validarCampoNombre(nombre));
    const blurDescripcion = () => setErrorDescripcion(validarCampoDescripcion(descripcion));
    const blurStockActual = () => setErrorStockActual(validarCampoStockActual(stockActual));
    const blurStockCritico = () => setErrorStockCritico(validarCampoStockCritico(stockCritico));
    const blurPrecio = () => setErrorPrecio(validarCampoPrecio(precio));
    const blurCategoria = () => setErrorCategoria(validarCampoCategoria(categoriaId));

    // ====== SUBMIT ======
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorGeneral("");

        const errN = validarCampoNombre(nombre);
        const errD = validarCampoDescripcion(descripcion);
        const errSA = validarCampoStockActual(stockActual);
        const errSC = validarCampoStockCritico(stockCritico);
        const errP = validarCampoPrecio(precio);
        const errC = validarCampoCategoria(categoriaId);

        setErrorNombre(errN);
        setErrorDescripcion(errD);
        setErrorStockActual(errSA);
        setErrorStockCritico(errSC);
        setErrorPrecio(errP);
        setErrorCategoria(errC);

        if (errN || errD || errSA || errSC || errP || errC) return;

        setCargando(true);
        try {
            await fetchAPI("/materiales/", {
                method: "POST",
                body: JSON.stringify({
                    nombre_material: nombre.trim(),
                    descripcion: descripcion.trim() || null,
                    stock_actual: Number(stockActual),
                    stock_critico: Number(stockCritico),
                    precio_unitario: Number(precio),
                    categoria_id: categoriaId,
                }),
            });
            navigate("/inventario");
        } catch (err) {
            setErrorGeneral(err.message || "Error al crear el recurso");
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

                {errorGeneral && (
                    <div className="alert alert-danger" role="alert">
                        {errorGeneral}
                    </div>
                )}

                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label">Nombre del producto *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                                    placeholder="Ej: Interruptor Simple Bticino"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    onBlur={blurNombre}
                                    maxLength={50}
                                />
                                {errorNombre && (
                                    <div className="invalid-feedback">{errorNombre}</div>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Categoría *</label>
                                <select
                                    className={`form-select ${errorCategoria ? "is-invalid" : ""}`}
                                    value={categoriaId}
                                    onChange={(e) => setCategoriaId(e.target.value)}
                                    onBlur={blurCategoria}
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id_categoria} value={cat.id_categoria}>
                                            {cat.nombre_categoria}
                                        </option>
                                    ))}
                                </select>
                                {errorCategoria && (
                                    <div className="invalid-feedback">{errorCategoria}</div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Precio unitario (CLP) *</label>
                                <input
                                    type="number"
                                    className={`form-control ${errorPrecio ? "is-invalid" : ""}`}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    value={precio}
                                    onChange={(e) => setPrecio(e.target.value)}
                                    onBlur={blurPrecio}
                                />
                                {errorPrecio && (
                                    <div className="invalid-feedback">{errorPrecio}</div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Stock actual *</label>
                                <input
                                    type="number"
                                    className={`form-control ${errorStockActual ? "is-invalid" : ""}`}
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                    value={stockActual}
                                    onChange={(e) => setStockActual(e.target.value)}
                                    onBlur={blurStockActual}
                                />
                                {errorStockActual && (
                                    <div className="invalid-feedback">{errorStockActual}</div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Stock crítico *</label>
                                <input
                                    type="number"
                                    className={`form-control ${errorStockCritico ? "is-invalid" : ""}`}
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                    value={stockCritico}
                                    onChange={(e) => setStockCritico(e.target.value)}
                                    onBlur={blurStockCritico}
                                />
                                {errorStockCritico ? (
                                    <div className="invalid-feedback">{errorStockCritico}</div>
                                ) : (
                                    <small className="text-muted">
                                        Cantidad mínima antes de alerta de reposición
                                    </small>
                                )}
                            </div>

                            <div className="col-md-12">
                                <label className="form-label">Descripción (opcional)</label>
                                <textarea
                                    className={`form-control ${errorDescripcion ? "is-invalid" : ""}`}
                                    rows="3"
                                    placeholder="Características, marca, modelo, etc."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    onBlur={blurDescripcion}
                                    maxLength={250}
                                ></textarea>
                                {errorDescripcion && (
                                    <div className="invalid-feedback">{errorDescripcion}</div>
                                )}
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