import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
    getPlantillas,
    getMaterialesDePlantilla,
    crearProyectoConMateriales,
} from "../services/api";

function NuevoProyecto() {
    const navigate = useNavigate();

    // Datos del proyecto
    const [nombreProyecto, setNombreProyecto] = useState("");
    const [tipoProyecto, setTipoProyecto] = useState("");
    const [nombreCliente, setNombreCliente] = useState("");
    const [telefonoCliente, setTelefonoCliente] = useState("");
    const [direccionCliente, setDireccionCliente] = useState("");
    const [presupuestoEstimado, setPresupuestoEstimado] = useState("");
    const [fechaTermino, setFechaTermino] = useState("");

    // Plantilla y materiales
    const [plantillas, setPlantillas] = useState([]);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");
    const [materiales, setMateriales] = useState([]);
    const [cargandoMateriales, setCargandoMateriales] = useState(false);

    // UI
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarPlantillas();
    }, []);

    const cargarPlantillas = async () => {
        try {
            const data = await getPlantillas();
            setPlantillas(data);
        } catch (err) {
            setError("Error al cargar plantillas: " + err.message);
        }
    };

    const handleCambioPlantilla = async (e) => {
        const id = e.target.value;
        setPlantillaSeleccionada(id);

        if (!id) {
            setMateriales([]);
            return;
        }

        setCargandoMateriales(true);
        try {
            const data = await getMaterialesDePlantilla(id);
            // Autocompletar campos del proyecto desde la plantilla
            setNombreProyecto(data.nombre_servicio);
            if (data.precio_estimado) {
                setPresupuestoEstimado(data.precio_estimado);
            }
            // Materiales con cantidad inicial = cantidad sugerida
            const matsConCantidad = data.materiales.map((m) => ({
                ...m,
                cantidad_real: Number(m.cantidad_sugerida),
            }));
            setMateriales(matsConCantidad);
        } catch (err) {
            setError("Error al cargar materiales: " + err.message);
        } finally {
            setCargandoMateriales(false);
        }
    };

    const handleCambiarCantidad = (materialId, nuevaCantidad) => {
        setMateriales((prev) =>
            prev.map((m) =>
                m.material_id === materialId
                    ? { ...m, cantidad_real: Number(nuevaCantidad) }
                    : m
            )
        );
    };

    const handleQuitarMaterial = (materialId) => {
        setMateriales((prev) => prev.filter((m) => m.material_id !== materialId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!nombreCliente.trim()) {
            setError("El nombre del cliente es obligatorio");
            return;
        }
        if (!nombreProyecto.trim()) {
            setError("El nombre del proyecto es obligatorio");
            return;
        }
        if (materiales.length === 0) {
            setError("Debes incluir al menos un material en el proyecto");
            return;
        }

        // Validar cantidades positivas
        for (const m of materiales) {
            if (!m.cantidad_real || m.cantidad_real <= 0) {
                setError(`La cantidad de ${m.nombre_material} debe ser mayor a cero`);
                return;
            }
        }

        setGuardando(true);
        try {
            const payload = {
                nombre_proyecto: nombreProyecto,
                tipo_proyecto: tipoProyecto || null,
                nombre_cliente: nombreCliente,
                telefono_cliente: telefonoCliente || null,
                direccion_cliente: direccionCliente || null,
                presupuesto_estimado: presupuestoEstimado ? Number(presupuestoEstimado) : null,
                fecha_termino_maximo: fechaTermino || null,
                plantilla_id: plantillaSeleccionada || null,
                materiales: materiales.map((m) => ({
                    material_id: m.material_id,
                    cantidad_planeada: m.cantidad_real,
                })),
            };

            await crearProyectoConMateriales(payload);
            navigate("/proyectos");
        } catch (err) {
            setError(err.message || "Error al crear el proyecto");
        } finally {
            setGuardando(false);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(precio || 0);
    };

    const totalEstimado = materiales.reduce(
        (sum, m) => sum + Number(m.precio_unitario || 0) * Number(m.cantidad_real || 0),
        0
    );

    return (
        <AppLayout>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Nuevo proyecto</h2>
                        <p className="text-muted mb-0">
                            Selecciona una plantilla y ajusta los materiales necesarios.
                        </p>
                    </div>
                    <button
                        className="btn btn-dark px-4"
                        onClick={() => navigate("/proyectos")}
                    >
                        Volver
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Datos del cliente</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Nombre del cliente *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nombreCliente}
                                    onChange={(e) => setNombreCliente(e.target.value)}
                                    placeholder="Ej: Carlos Iturrieta"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={telefonoCliente}
                                    onChange={(e) => setTelefonoCliente(e.target.value)}
                                    placeholder="+56 9 1234 5678"
                                />
                            </div>
                            <div className="col-md-12">
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={direccionCliente}
                                    onChange={(e) => setDireccionCliente(e.target.value)}
                                    placeholder="Calle, número, comuna"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Datos del servicio</h5>
                        <div className="row g-3">
                            <div className="col-md-12">
                                <label className="form-label">Plantilla de servicio *</label>
                                <select
                                    className="form-select"
                                    value={plantillaSeleccionada}
                                    onChange={handleCambioPlantilla}
                                >
                                    <option value="">Seleccionar plantilla...</option>
                                    {plantillas.map((p) => (
                                        <option key={p.id_plantilla} value={p.id_plantilla}>
                                            {p.nombre_servicio} — {formatearPrecio(p.precio_estimado)}
                                        </option>
                                    ))}
                                </select>
                                <small className="text-muted">
                                    Al seleccionar una plantilla se cargan los materiales sugeridos automáticamente.
                                </small>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Nombre del proyecto *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nombreProyecto}
                                    onChange={(e) => setNombreProyecto(e.target.value)}
                                    placeholder="Se autocompleta desde la plantilla"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Tipo de proyecto</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={tipoProyecto}
                                    onChange={(e) => setTipoProyecto(e.target.value)}
                                    placeholder="Residencial, comercial, industrial..."
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Presupuesto estimado (CLP)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={presupuestoEstimado}
                                    onChange={(e) => setPresupuestoEstimado(e.target.value)}
                                    min="0"
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Fecha de término máxima</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={fechaTermino}
                                    onChange={(e) => setFechaTermino(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {plantillaSeleccionada && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Materiales del proyecto</h5>
                                <small className="text-muted">
                                    Costo de materiales (referencia interna): <strong>{formatearPrecio(totalEstimado)}</strong>
                                </small>
                            </div>

                            {cargandoMateriales ? (
                                <p className="text-muted">Cargando materiales...</p>
                            ) : materiales.length === 0 ? (
                                <p className="text-muted">
                                    Esta plantilla no tiene materiales vinculados.
                                </p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Material</th>
                                                <th className="text-center">Stock disponible</th>
                                                <th className="text-center">Cantidad a usar</th>
                                                <th className="text-end">Subtotal</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materiales.map((m) => {
                                                const subtotal =
                                                    Number(m.precio_unitario) * Number(m.cantidad_real || 0);
                                                const stockInsuficiente =
                                                    Number(m.cantidad_real) > m.stock_actual;

                                                return (
                                                    <tr key={m.material_id}>
                                                        <td>
                                                            <strong>{m.nombre_material}</strong>
                                                            <p className="text-muted mb-0 small">
                                                                {m.unidad} · {formatearPrecio(m.precio_unitario)} c/u
                                                            </p>
                                                        </td>
                                                        <td className="text-center">
                                                            <span
                                                                className={`badge ${
                                                                    m.stock_actual === 0
                                                                        ? "bg-danger"
                                                                        : m.stock_actual <= m.stock_critico
                                                                        ? "bg-warning text-dark"
                                                                        : "bg-success"
                                                                }`}
                                                            >
                                                                {m.stock_actual}
                                                            </span>
                                                        </td>
                                                        <td className="text-center" style={{ width: "150px" }}>
                                                            <input
                                                                type="number"
                                                                className={`form-control text-center ${
                                                                    stockInsuficiente ? "border-warning" : ""
                                                                }`}
                                                                value={m.cantidad_real}
                                                                onChange={(e) =>
                                                                    handleCambiarCantidad(
                                                                        m.material_id,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                min="0"
                                                            />
                                                            {stockInsuficiente && (
                                                                <small className="text-warning">
                                                                    Supera stock disponible
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td className="text-end fw-bold">
                                                            {formatearPrecio(subtotal)}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() =>
                                                                    handleQuitarMaterial(m.material_id)
                                                                }
                                                            >
                                                                Quitar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary px-4"
                            onClick={() => navigate("/proyectos")}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary px-4"
                            disabled={guardando}
                        >
                            {guardando ? "Creando..." : "Crear proyecto"}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

export default NuevoProyecto;