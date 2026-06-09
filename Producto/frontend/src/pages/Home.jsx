import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import GuiaRapida from "../components/GuiaRapida";

function Home() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="dashboard-header">
        <div>
          <span className="page-label">Panel principal</span>
          <h1>Home</h1>
          <p>Resumen general de la empresa y actividad reciente.</p>
        </div>

        <div className="header-actions">
            <GuiaRapida
              titulo="Guía rápida del Home"
              descripcion="Aquí encontrarás un resumen general del sistema, incluyendo estadísticas, proyectos recientes y notificaciones importantes de la empresa."
            />

          <div className="user-box">
            <div className="user-avatar">JP</div>
            <div>
              <strong>Juan Pérez</strong>
              <span>Administrador</span>
            </div>
          </div>
        </div>
      </div>

      <section className="welcome-card home-hero-card">
        <div className="welcome-left">
          <div className="welcome-icon">👋</div>
          <div>
            <h2>¡Bienvenido, Juan!</h2>
            <p>
              Aquí puedes revisar rápidamente los indicadores principales de
              ServiElec Manager.
            </p>
          </div>
        </div>

        <button onClick={() => navigate("/proyectos")}>
          Ver proyectos <span>→</span>
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div>
              <span>Proyectos activos</span>
              <h3>12</h3>
            </div>
            <div className="stat-icon">▣</div>
          </div>
          <p className="positive">↑ 2 desde la semana pasada</p>
          <div className="sparkline positive-line"></div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <span>Inventario total</span>
              <h3>248</h3>
            </div>
            <div className="stat-icon">◈</div>
          </div>
          <p className="positive">↑ 18 desde la semana pasada</p>
          <div className="sparkline positive-line"></div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <span>Clientes registrados</span>
              <h3>56</h3>
            </div>
            <div className="stat-icon">☷</div>
          </div>
          <p className="positive">↑ 5 desde la semana pasada</p>
          <div className="sparkline positive-line"></div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <span>Órdenes de trabajo</span>
              <h3>23</h3>
            </div>
            <div className="stat-icon warning-icon">▤</div>
          </div>
          <p className="negative">↓ 3 desde la semana pasada</p>
          <div className="sparkline negative-line"></div>
        </div>
      </section>

      <section className="home-grid">
        <div className="dashboard-card activity-card">
          <div className="card-title-row">
            <h2>Actividad reciente</h2>
            <button className="period-btn">Últimos 7 días ▾</button>
          </div>

          <div className="line-chart">
            <div className="chart-grid"></div>
            <svg viewBox="0 0 600 260" preserveAspectRatio="none">
              <path
                className="chart-area"
                d="M0,205 L90,150 L180,175 L270,95 L360,140 L450,120 L600,165 L600,260 L0,260 Z"
              />
              <path
                className="chart-line"
                d="M0,205 L90,150 L180,175 L270,95 L360,140 L450,120 L600,165"
              />
              <circle cx="0" cy="205" r="6" />
              <circle cx="90" cy="150" r="6" />
              <circle cx="180" cy="175" r="6" />
              <circle cx="270" cy="95" r="6" />
              <circle cx="360" cy="140" r="6" />
              <circle cx="450" cy="120" r="6" />
              <circle cx="600" cy="165" r="6" />
            </svg>

            <div className="chart-labels">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>

          <div className="chart-summary">
            <div>
              <span>Nuevos proyectos</span>
              <strong>+4</strong>
              <small>12%</small>
            </div>
            <div>
              <span>Órdenes completadas</span>
              <strong>+7</strong>
              <small>18%</small>
            </div>
            <div>
              <span>Nuevos clientes</span>
              <strong>+3</strong>
              <small>9%</small>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-title-row">
            <h2>Proyectos recientes</h2>
            <button onClick={() => navigate("/proyectos")}>Ver todos</button>
          </div>

          <div className="project-item modern-project">
            <div className="project-icon">▦</div>
            <div>
              <strong>Instalación eléctrica - Edificio Torres</strong>
              <p>Cliente: Constructora del Norte</p>
            </div>
            <span className="status in-progress">En progreso</span>
          </div>

          <div className="project-item modern-project">
            <div className="project-icon yellow">⚡</div>
            <div>
              <strong>Mantenimiento - Local Comercial</strong>
              <p>Cliente: Supermercados del Sur</p>
            </div>
            <span className="status pending">Pendiente</span>
          </div>

          <div className="project-item modern-project">
            <div className="project-icon green">✓</div>
            <div>
              <strong>Cableado industrial - Planta 3</strong>
              <p>Cliente: Industrias Metalúrgicas</p>
            </div>
            <span className="status done">Completado</span>
          </div>
        </div>

        <div className="dashboard-card notifications-card">
          <div className="card-title-row">
            <h2>Notificaciones</h2>
          </div>

          <div className="notification-item danger">
            <div className="notification-icon">!</div>
            <div>
              <strong>Stock bajo en cable THHN 12 AWG</strong>
              <span>Hace 15 min</span>
            </div>
          </div>

          <div className="notification-item warning">
            <div className="notification-icon">⌛</div>
            <div>
              <strong>Cotización #COT-2024-045 pendiente</strong>
              <span>Hace 1 hora</span>
            </div>
          </div>

          <div className="notification-item info">
            <div className="notification-icon">i</div>
            <div>
              <strong>Nueva orden de trabajo asignada</strong>
              <span>Hace 3 horas</span>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

export default Home;