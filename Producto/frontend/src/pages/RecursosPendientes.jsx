import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

function RecursosPendientes() {
  const navigate = useNavigate();

  const recursos = [
    { id: 1, nombre: "Nombre producto", precio: "$99.999", marca: "Marca producto", tienda: "Tienda origen" },
  ];

  return (
    <AppLayout>
      <div className="search-page">
        <div className="search-header">
          <div>
            <h1>Recursos pendientes</h1>
            <p>Revisa recursos pendientes de asignación o confirmación.</p>
          </div>

          <GuiaRapida
              titulo="Guía rápida de Recursos Pendientes"
              descripcion="Aquí puedes revisar el estado de los productos, consultar información detallada, realizar seguimiento de estado y administrar las actividades asociadas."
            />
        </div>

        <div className="search-actions">
          <input type="text" placeholder="Buscar producto, marca o tienda..." maxLength={150} />

          <button className="search-btn">Buscar</button>

          <button
            className="secondary-action-btn"
            onClick={() => navigate("/buscador")}
          >
            Buscador
          </button>
        </div>

        <div className="resource-list">
          <div className="resource-table-head pending-head">
            <span>Producto</span>
            <span>Nombre</span>
            <span>Precio</span>
            <span>Marca</span>
            <span>Tienda</span>
            <span>Estado</span>
          </div>

          {recursos.map((recurso) => (
            <div className="resource-row pending-row" key={recurso.id}>
              <div className="resource-image">Imagen</div>

              <div>
                <strong>{recurso.nombre}</strong>
                <p>Descripción breve del producto o recurso.</p>
              </div>

              <div className="resource-price">{recurso.precio}</div>
              <div>{recurso.marca}</div>
              <div>{recurso.tienda}</div>
              <div>
                <span className="pending-badge">Pendiente</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default RecursosPendientes;