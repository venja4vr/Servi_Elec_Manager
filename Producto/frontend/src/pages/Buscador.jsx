import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

function Buscador() {
  const navigate = useNavigate();

  const productos = [
    { id: 1, nombre: "Nombre producto", precio: "$99.999", marca: "Marca producto", tienda: "Tienda origen" },
    { id: 2, nombre: "Nombre producto", precio: "$99.999", marca: "Marca producto", tienda: "Tienda origen" },
  ];

  return (
    <AppLayout>
      <div className="search-page">
        <div className="search-header">
          <div>
            <h1>Buscador</h1>
            <p>Consulta recursos disponibles para los servicios eléctricos.</p>
          </div>
        </div>

        <div className="search-actions">
          <input type="text" placeholder="Buscar producto, marca o tienda..." maxLength={150} />

          <button className="search-btn">Buscar</button>

          <button
            className="secondary-action-btn"
            onClick={() => navigate("/recursos-pendientes")}
          >
            Recursos pendientes
          </button>
        </div>

        <div className="resource-list">
          <div className="resource-table-head">
            <span>Producto</span>
            <span>Nombre</span>
            <span>Precio</span>
            <span>Marca</span>
            <span>Tienda</span>
          </div>

          {productos.map((producto) => (
            <div className="resource-row" key={producto.id}>
              <div className="resource-image">Imagen</div>

              <div>
                <strong>{producto.nombre}</strong>
                <p>Descripción breve del producto o recurso.</p>
              </div>

              <div className="resource-price">{producto.precio}</div>
              <div>{producto.marca}</div>
              <div>{producto.tienda}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default Buscador;