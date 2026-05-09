import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

function Inventario() {
    const navigate = useNavigate();

    const productos = [
    {
        id: 1,
        imagen: "INT",
        codigo: "INT-004",
        nombre: "Interruptor Simple",
        descripcion: "Blanco",
        precio: "$1.890",
        marca: "Bticino",
        categoria: "Interruptores",
        stock: 25,
    },
    ];

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
            <div className="col-md-6">
            <input
                type="text"
                className="form-control"
                placeholder="Buscar recurso por nombre, código, marca o categoría"
            />
            </div>

            <div className="col-md-2">
            <button className="btn btn-primary w-100">Buscar</button>
            </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4">
            <div className="table-responsive">
            <table className="table align-middle mb-0">
                <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Marca</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                </tr>
                </thead>

                <tbody>
                {productos.map((producto) => (
                    <tr key={producto.id}>
                    <td>
                        <div
                        className="border rounded d-flex justify-content-center align-items-center bg-light"
                        style={{ width: "90px", height: "70px" }}
                        >
                        {producto.imagen}
                        </div>
                    </td>

                    <td>{producto.codigo}</td>

                    <td>
                        <strong>{producto.nombre}</strong>
                        <p className="text-muted mb-0">{producto.descripcion}</p>
                    </td>

                    <td>{producto.precio}</td>
                    <td>{producto.marca}</td>
                    <td>{producto.categoria}</td>

                    <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                        {producto.stock}
                        </span>
                    </td>

                    <td>
                        <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm">
                            Editar
                        </button>
                        <button className="btn btn-danger btn-sm">
                            Eliminar
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    </AppLayout>
    );
}

export default Inventario;