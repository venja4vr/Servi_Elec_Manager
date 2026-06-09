import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

const Proyectos = () => {
  const [tabActivo, setTabActivo] = useState("pendientes");
  const navigate = useNavigate();

  const proyectos = [1, 2, 3];

  return (
    <AppLayout>
      <div className="projects-page">
        <div className="projects-header">
          <div>
              <h1>Proyectos</h1>
            <p>
              Administra proyectos eléctricos y revisa su estado actual.
            </p>
          </div>


        <div className="projects-header-actions">
          <GuiaRapida
              titulo="Guía rápida de Proyectos"
              descripcion="Aquí puedes revisar el estado de los proyectos, consultar información detallada, realizar seguimiento de avances y administrar las actividades asociadas."
            />

            <button
              className="primary-btn"
              onClick={() => navigate("/proyectos/nuevo")}
            >
              + Nuevo proyecto
            </button>
        </div>

        </div>

        <div className="projects-tabs">
          <button className={tabActivo === "pendientes" ? "active" : ""} onClick={() => setTabActivo("pendientes")}>Pendientes</button>
          <button className={tabActivo === "enCurso" ? "active" : ""} onClick={() => setTabActivo("enCurso")}>En curso</button>
          <button className={tabActivo === "finalizado" ? "active" : ""} onClick={() => setTabActivo("finalizado")}>Finalizados</button>
          <button className={tabActivo === "cancelado" ? "active" : ""} onClick={() => setTabActivo("cancelado")}>Cancelados</button>
        </div>

        <div className="projects-filters">
          <select>
            <option>Filtrar por</option>
            <option>Cliente</option>
            <option>Fecha</option>
            <option>Estado</option>
          </select>

          <input type="text" placeholder="Buscar proyecto..." maxLength={150} />

          <button>Buscar</button>
        </div>

        <div className="projects-list">
          {proyectos.map((item) => (
            <div className="project-card" key={item}>
              <div className="project-info">
                <h3>Proyecto #00{item}</h3>
                <p>Cliente: Juan Pérez</p>
                <p>Servicio: Instalación eléctrica</p>
              </div>

              <div className="project-meta">
                <p><strong>Fecha:</strong> 18/04/2026</p>
                <p><strong>Costo estimado:</strong> $320.000</p>
                <span className={`project-status ${tabActivo}`}>
                  {tabActivo === "enCurso" ? "En curso" : tabActivo}
                </span>
              </div>

              <div className="project-actions">
                <button className="primary-btn" onClick={() => navigate(`/proyectos/${item}`)}>
                  Ver detalle
                </button>

                {tabActivo === "pendientes" && (
                  <>
                    <button className="secondary-btn">Aceptar</button>
                    <button className="light-btn">Rechazar</button>
                  </>
                )}

                {tabActivo === "enCurso" && (
                  <>
                    <button className="secondary-btn">Editar</button>
                    <button className="light-btn">Facturas</button>
                    <button className="light-btn">Finalizar</button>
                  </>
                )}

                {tabActivo === "finalizado" && (
                  <button className="light-btn">Ver gastos</button>
                )}

                {tabActivo === "cancelado" && (
                  <button className="light-btn">Ver motivo</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Proyectos;