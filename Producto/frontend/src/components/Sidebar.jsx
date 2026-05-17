import { useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">S</div>
        <div>
          <h4>ServiElec</h4>
          <span>Manager</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button className={`sidebar-item ${isActive("/home") ? "active" : ""}`} onClick={() => navigate("/home")}>Home
        </button>

        <button className={`sidebar-item ${isActive("/buscador") ? "active" : ""}`} onClick={() => navigate("/buscador")}> Buscador
        </button>

        <button className={`sidebar-item ${isActive("/proyectos") ? "active" : ""}`} onClick={() => navigate("/proyectos")}> Proyectos
        </button>

        <button className={`sidebar-item ${isActive("/inventario") ? "active" : ""}`} onClick={() => navigate("/inventario")}>Inventario
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-exit" onClick={() => navigate("/")}> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;