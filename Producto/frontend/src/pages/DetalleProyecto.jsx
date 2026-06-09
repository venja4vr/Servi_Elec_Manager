import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

function DetalleProyecto() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="project-detail-page">
        <div className="project-detail-header">
          <div>
            <h1>Detalles del proyecto</h1>
            <p>Proyecto #010 — Finalizado</p>
          </div>

          <div className="header-actions">
            <GuiaRapida
              titulo="Guía rápida de Detalle de Proyecto"
              descripcion="Visualiza toda la información relacionada con el proyecto seleccionado, incluyendo cliente, recursos utilizados, estado de avance, costos asociados y acciones disponibles."
            />

          <button onClick={() => navigate("/proyectos")}>
            Volver
          </button>
        </div>
      </div>

        <div className="detail-grid">
          <div className="detail-card">
            <h2>Datos generales</h2>

            <div className="detail-row"><strong>Proyecto:</strong><span>#010</span></div>
            <div className="detail-row"><strong>Cliente:</strong><span>Comercial Sur</span></div>
            <div className="detail-row"><strong>Tipo de servicio:</strong><span>Mantención eléctrica</span></div>
            <div className="detail-row"><strong>Fecha inicio:</strong><span>20/04/2026</span></div>
            <div className="detail-row"><strong>Fecha término:</strong><span>28/04/2026</span></div>
            <div className="detail-row"><strong>Responsable:</strong><span>Técnico 1</span></div>
            <div className="detail-row"><strong>Estado:</strong><span className="detail-badge success">Finalizado</span></div>
            <div className="detail-row"><strong>Dirección:</strong><span>Quilpué</span></div>
          </div>

          <div className="detail-card">
            <h2>Costos y recursos</h2>

            <div className="detail-row"><strong>Costo estimado:</strong><span>$270.000</span></div>
            <div className="detail-row"><strong>Costo final:</strong><span>$290.000</span></div>
            <div className="detail-row"><strong>Diferencia:</strong><span className="text-positive">+$20.000</span></div>
            <div className="detail-row"><strong>Materiales utilizados:</strong><span>3</span></div>
            <div className="detail-row"><strong>Recursos pendientes:</strong><span>0</span></div>

            <h3>Materiales usados</h3>
            <ul>
              <li>Cable 2,5 mm — 20 m</li>
              <li>Interruptor automático — 2</li>
              <li>Tablero eléctrico — 1</li>
            </ul>

            <button className="detail-action-btn">Ver gastos</button>
          </div>

          <div className="detail-card">
            <h2>Documentos y cierre</h2>

            <div className="detail-row"><strong>Facturas asociadas:</strong><span>2</span></div>
            <div className="detail-row"><strong>Reporte final:</strong><span className="text-positive">Disponible</span></div>
            <div className="detail-row"><strong>Última actualización:</strong><span>28/04/2026</span></div>

            <h3>Observación de cierre</h3>
            <p className="text-positive fw-bold">Proyecto ejecutado correctamente</p>
            <p>Se completó la mantención y se registraron todos los materiales utilizados.</p>

            <div className="detail-actions">
              <button>Ver factura</button>
              <button>Descargar reporte</button>
              <button>Ver historial</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default DetalleProyecto;