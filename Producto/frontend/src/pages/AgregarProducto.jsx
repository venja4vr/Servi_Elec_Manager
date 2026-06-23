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
    const [unidadCompra, setUnidadCompra] = useState("unidad");

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

    const validarCampoNombre = (v) => validarTexto(v, { minimo: 3, maximo: 100, etiqueta: "El nombre" });
    const validarCampoDescripcion = (v) => validarTextoOpcional(v, { maximo: 250, etiqueta: "La descripción" });
    const validarCampoStockActual = (v) => validarEnteroPositivo(v, { etiqueta: "El stock actual" });
    const validarCampoStockCritico = (v) => validarEnteroPositivo(v, { etiqueta: "El stock crítico" });
    const validarCampoPrecio = (v) => validarPrecio(v, { etiqueta: "El precio" });
    const validarCampoCategoria = (v) => validarSeleccion(v, "una categoría");

    const blurNombre = () => setErrorNombre(validarCampoNombre(nombre));
    const blurDescripcion = () => setErrorDescripcion(validarCampoDescripcion(descripcion));
    const blurStockActual = () => setErrorStockActual(validarCampoStockActual(stockActual));
    const blurStockCritico = () => setErrorStockCritico(validarCampoStockCritico(stockCritico));
    const blurPrecio = () => setErrorPrecio(validarCampoPrecio(precio));
    const blurCategoria = () => setErrorCategoria(validarCampoCategoria(categoriaId));

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
                    unidad_compra: unidadCompra,
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
            <div className="add-resource-page">
                <div className="add-resource-header">
                    <div>
                        <h1>Agregar recurso</h1>
                        <p>Registro manual de un nuevo producto para el inventario.</p>
                    </div>

                    <button onClick={() => navigate("/inventario")}>
                        Volver
                    </button>
                </div>

                {errorGeneral && (
                    <div className="alert alert-danger" role="alert">
                        {errorGeneral}
                    </div>
                )}

                <form className="add-resource-card" onSubmit={handleSubmit} noValidate>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Nombre del producto *</label>
                            <input
                                type="text"
                                placeholder="Ej: Interruptor Simple Bticino"
                                maxLength={100}
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                onBlur={blurNombre}
                                className={errorNombre ? "is-invalid" : ""}
                            />
                            {errorNombre && (
                                <small className="field-error">{errorNombre}</small>
                            )}
                        </div>

                        <div className="form-field">
                            <label>Categoría *</label>
                            <select
                                value={categoriaId}
                                onChange={(e) => setCategoriaId(e.target.value)}
                                onBlur={blurCategoria}
                                className={errorCategoria ? "is-invalid" : ""}
                            >
                                <option value="">Seleccionar categoría</option>
                                {categorias.map((cat) => (
                                    <option key={cat.id_categoria} value={cat.id_categoria}>
                                        {cat.nombre_categoria}
                                    </option>
                                ))}
                            </select>
                            {errorCategoria && (
                                <small className="field-error">{errorCategoria}</small>
                            )}
                        </div>

                        <div className="form-field">
                            <label>Precio unitario (CLP) *</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                onBlur={blurPrecio}
                                className={errorPrecio ? "is-invalid" : ""}
                            />
                            {errorPrecio && (
                                <small className="field-error">{errorPrecio}</small>
                            )}
                        </div>

                        <div className="form-field">
                            <label>Stock actual *</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                step="1"
                                value={stockActual}
                                onChange={(e) => setStockActual(e.target.value)}
                                onBlur={blurStockActual}
                                className={errorStockActual ? "is-invalid" : ""}
                            />
                            {errorStockActual && (
                                <small className="field-error">{errorStockActual}</small>
                            )}
                        </div>

                        <div className="form-field">
                            <label>Stock crítico *</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                step="1"
                                value={stockCritico}
                                onChange={(e) => setStockCritico(e.target.value)}
                                onBlur={blurStockCritico}
                                className={errorStockCritico ? "is-invalid" : ""}
                            />
                            {errorStockCritico ? (
                                <small className="field-error">{errorStockCritico}</small>
                            ) : (
                                <small className="field-hint">
                                    Cantidad mínima antes de alerta de reposición
                                </small>
                            )}
                        </div>

                        <div className="form-field">
                            <label>Unidad de compra</label>
                            <select
                                value={unidadCompra}
                                onChange={(e) => setUnidadCompra(e.target.value)}
                            >
                                <option value="unidad">Unidad</option>
                                <option value="metro">Metro</option>
                                <option value="rollo">Rollo</option>
                                <option value="kilo">Kilo</option>
                                <option value="litro">Litro</option>
                            </select>
                        </div>

                        <div className="form-field full">
                            <label>Descripción (opcional)</label>
                            <textarea
                                rows="4"
                                placeholder="Características, marca, modelo, etc."
                                maxLength={250}
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                onBlur={blurDescripcion}
                                className={errorDescripcion ? "is-invalid" : ""}
                            ></textarea>
                            {errorDescripcion && (
                                <small className="field-error">{errorDescripcion}</small>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate("/inventario")}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="save-btn"
                            disabled={cargando}
                        >
                            {cargando ? "Guardando..." : "Guardar recurso"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

export default AgregarProducto;