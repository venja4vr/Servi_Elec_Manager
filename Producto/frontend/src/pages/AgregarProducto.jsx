import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

function AgregarProducto() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/inventario");
  };

  return (
    <AppLayout>
      <div className="add-resource-page">
        <div className="add-resource-header">
          <div>
            <h1>Agregar Producto</h1>
            <p>Registro manual de un nuevo producto para el inventario.</p>
          </div>

          <div className="header-actions">
          <GuiaRapida
            titulo="Guía rápida de Agregar Recurso"
            descripcion="Completa el formulario para registrar un nuevo recurso en el inventario. Ingresa la información del producto, stock disponible, categoría y datos necesarios para mantener actualizado el control de materiales."
          />

          <button onClick={() => navigate("/inventario")}>
            Volver
          </button>
          </div>
        </div>

        <form className="add-resource-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>Código</label>
              <input type="text" placeholder="Ej: INT-004" maxLength={30} />
            </div>

            <div className="form-field">
              <label>Nombre del producto</label>
              <input type="text" placeholder="Ej: Interruptor Simple" maxLength={120} />
            </div>

            <div className="form-field">
              <label>Marca</label>
              <input type="text" placeholder="Ej: Bticino" maxLength={80} />
            </div>

            <div className="form-field">
              <label>Categoría</label>
              <select>
                <option>Seleccionar categoría</option>
                <option>Interruptores</option>
                <option>Cables</option>
                <option>Tableros eléctricos</option>
                <option>Herramientas</option>
              </select>
            </div>

            <div className="form-field">
              <label>Precio</label>
              <input type="text" placeholder="Ej: $1.890" maxLength={20} />
            </div>

            <div className="form-field">
              <label>Stock</label>
              <input type="number" placeholder="Ej: 25" min="0" max="9999" />
            </div>

            <div className="form-field full">
              <label>Descripción</label>
              <textarea
                rows="4"
                placeholder="Ej: Interruptor simple color blanco para instalaciones domiciliarias."
                maxLength={300}
              ></textarea>
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

            <button type="submit" className="save-btn">
              Guardar recurso
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default AgregarProducto;