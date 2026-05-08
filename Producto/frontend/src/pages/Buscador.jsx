import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

function Buscador() {
    const navigate = useNavigate();

    const productos = [
        {
        id: 1,
        nombre: "Nombre producto",
        precio: "$99.999",
        marca: "Marca producto",
        tienda: "Tienda origen",
        },
        {
        id: 2,
        nombre: "Nombre producto",
        precio: "$99.999",
        marca: "Marca producto",
        tienda: "Tienda origen",
        },
    ];

    return (
        <AppLayout>
            <div className="container-fluid">
            <h2 className="mb-4">Buscador</h2>

            <div className="row align-items-center mb-4">
            <div className="col-md-6">
            <input
                type="text"
                className="form-control"
                placeholder="Buscar"
            />
            </div>

            <div className="col-md-2">
                <button className="btn btn-dark w-100">
                Buscar
                </button>
            </div>

            <div className="col-md-4 text-end">
                <button
                className="btn btn-dark px-5"
                onClick={() => navigate("/recursos-pendientes")}
                >
                Recursos pendientes
                </button>
            </div>
            </div>

            <div className="border-top pt-3">
            <div className="row text-muted small mb-3 text-center">
                <div className="col-md-2"></div>
                <div className="col-md-3">Nombre</div>
                <div className="col-md-2">Precio</div>
                <div className="col-md-2">Marca</div>
                <div className="col-md-3">Tienda</div>
            </div>

            {productos.map((producto) => (
                <div className="row align-items-center mb-4" key={producto.id}>
                <div className="col-md-2">
                <div
                    className="border d-flex justify-content-center align-items-center"
                    style={{ width: "120px", height: "80px" }}
                >
                    Imagen
                </div>
                </div>

                <div className="col-md-3">{producto.nombre}</div>
                <div className="col-md-2">{producto.precio}</div>
                <div className="col-md-2">{producto.marca}</div>
                <div className="col-md-3">{producto.tienda}</div>
            </div>
            ))}
        </div>
        </div>
    </AppLayout>
    );
}

export default Buscador;