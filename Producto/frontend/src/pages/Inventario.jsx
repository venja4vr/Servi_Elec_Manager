import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

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
      <div className="inventory-page">
        <div className="inventory-header">
          <div>
            <h1>Inventario</h1>
            <p>Gestión de recursos disponibles para los servicios eléctricos.</p>
          </div>

          <div className="header-actions">
          <GuiaRapida
              titulo="Guía rápida de Inventario"
              descripcion="Gestiona los recursos y materiales registrados en el sistema. Aquí puedes consultar existencias, buscar productos, editar información y controlar el stock disponible para los proyectos."
            />

          <button onClick={() => navigate("/agregar-producto")}>
            Agregar recurso
          </button>

          </div>
        </div>

        <div className="inventory-search">
          <input
            type="text"
            placeholder="Buscar recurso por nombre, código, marca o categoría..."
            maxLength={150}
          />

          <button>Buscar</button>
        </div>

        <div className="inventory-table-card">
          <div className="inventory-table-head">
            <span>Imagen</span>
            <span>Código</span>
            <span>Nombre</span>
            <span>Precio</span>
            <span>Marca</span>
            <span>Categoría</span>
            <span>Stock</span>
            <span>Acciones</span>
          </div>

          {productos.map((producto) => (
            <div className="inventory-row" key={producto.id}>
              <div className="inventory-image">{producto.imagen}</div>

              <div>{producto.codigo}</div>

              <div>
                <strong>{producto.nombre}</strong>
                <p>{producto.descripcion}</p>
              </div>

              <div>{producto.precio}</div>
              <div>{producto.marca}</div>
              <div>{producto.categoria}</div>

              <div>
                <span className="stock-badge">{producto.stock}</span>
              </div>

              <div className="inventory-actions">
                <button className="edit-btn">Editar</button>
                <button className="delete-btn">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default Inventario;