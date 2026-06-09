import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

function NuevoProyecto() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="nuevo-proyecto-page">

        <div className="projects-header">
          <div>
            <h1>Nuevo proyecto</h1>
            <p>Registra un nuevo servicio para un cliente.</p>
          </div>

          <div className="header-actions">
            <GuiaRapida
              titulo="Guía rápida de Nuevo Proyecto"
              descripcion=""
            />
            
            <button
            className="light-btn"
            onClick={() => navigate("/proyectos")}
          >
            Volver
          </button>
          </div>
        </div>

        <div className="detail-card">
          <h2>Datos del cliente</h2>

          <div className="form-grid">
            <input
              type="text"
              placeholder="Nombre del cliente"
            />

            <input
              type="text"
              placeholder="Teléfono"
            />

            <input
              type="text"
              placeholder="Dirección"
            />
          </div>
        </div>

        <div className="detail-card">
          <h2>Datos del proyecto</h2>

          <div className="form-grid">
            <input
              type="text"
              placeholder="Nombre del proyecto"
            />

            <select>
              <option>Seleccionar plantilla</option>
            </select>

            <input
              type="text"
              placeholder="Tipo de proyecto"
            />

            <input
              type="number"
              placeholder="Presupuesto estimado"
            />

            <input
              type="date"
            />
          </div>
        </div>

        <div className="detail-card">
          <h2>Observaciones</h2>

          <textarea
            rows="5"
            placeholder="Observaciones del proyecto..."
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "16px",
              border: "1px solid #d9d4cc",
              resize: "vertical"
            }}
          />
        </div>

        <div className="project-actions">
          <button
            className="light-btn"
            onClick={() => navigate("/proyectos")}
          >
            Cancelar
          </button>

          <button className="primary-btn">
            Crear proyecto
          </button>
        </div>

      </div>
    </AppLayout>
  );
}

export default NuevoProyecto;