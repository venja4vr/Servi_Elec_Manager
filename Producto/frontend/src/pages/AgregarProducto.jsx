import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

function AgregarProducto() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
    e.preventDefault();

    // Simulación: luego esto se enviará al backend
    navigate("/inventario");
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

        <div className="card border-0 shadow-sm rounded-4 p-4">
            <form onSubmit={handleSubmit}>
            <div className="row g-4">
                <div className="col-md-6">
                <label className="form-label">Código</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: INT-004"
                />
                </div>

                <div className="col-md-6">
                <label className="form-label">Nombre del producto</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Interruptor Simple"
                />
                </div>

                <div className="col-md-6">
                <label className="form-label">Marca</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Bticino"
                />
                </div>

                <div className="col-md-6">
                <label className="form-label">Categoría</label>
                <select className="form-select">
                    <option>Seleccionar categoría</option>
                    <option>Interruptores</option>
                    <option>Cables</option>
                    <option>Tableros eléctricos</option>
                    <option>Herramientas</option>
                </select>
                </div>

                <div className="col-md-6">
                <label className="form-label">Precio</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: $1.890"
                />
                </div>

                <div className="col-md-6">
                <label className="form-label">Stock</label>
                <input
                    type="number"
                    className="form-control"
                    placeholder="Ej: 25"
                />
                </div>

                <div className="col-md-12">
                <label className="form-label">Descripción</label>
                <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Ej: Interruptor simple color blanco para instalaciones domiciliarias."
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

                <button type="submit" className="btn btn-primary px-4">
                    Guardar recurso
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