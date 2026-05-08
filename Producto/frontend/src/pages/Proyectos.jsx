import { useState } from "react";
import AppLayout from "../components/AppLayout";

const Proyectos = () => {
    const [tabActivo, setTabActivo] = useState("pendientes");

    return (
      <AppLayout>
        <div className="container-fluid">
            {/* Título */}
            <h2 className="mb-4">Proyectos</h2>

            {/* Tabs */}
            <div className="d-flex gap-2 mb-3">
            <button
                className={`btn ${tabActivo === "pendientes" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setTabActivo("pendientes")}
            >
                Pendientes
            </button>

            <button
                className={`btn ${tabActivo === "enCurso" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setTabActivo("enCurso")}
            >
                En curso
            </button>

            <button
                className={`btn ${tabActivo === "finalizado" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setTabActivo("finalizado")}
            >
                Finalizado
            </button>

            <button
                className={`btn ${tabActivo === "cancelado" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setTabActivo("cancelado")}
            >
                Cancelado
            </button>
        </div>

      {/* Filtros */}
      <div className="row mb-4">
        <div className="col-md-3">
          <select className="form-select">
            <option>Filtrar</option>
          </select>
        </div>

        <div className="col-md-7">
          <input type="text" className="form-control" placeholder="Buscar" />
        </div>

        <div className="col-md-2">
          <button className="btn btn-dark w-100">Buscar</button>
        </div>
      </div>

      {/* LISTA DE PROYECTOS */}
      {[1, 2, 3].map((item) => (
        <div className="card mb-3" key={item}>
          <div className="row g-0 p-3">
            
            {/* IZQUIERDA */}
            <div className="col-md-5">
              <h5>Proyecto #00{item}</h5>
              <p className="mb-1">Cliente: Juan Pérez</p>
              <p className="mb-0">Servicio: Instalación eléctrica</p>
            </div>

            {/* CENTRO */}
            <div className="col-md-4">
              <p className="mb-1">Fecha: 18/04/2026</p>
              <p className="mb-1">Costo estimado: $320.000</p>
              <p className="mb-0">Estado: {tabActivo}</p>
            </div>

            {/* DERECHA */}
            <div className="col-md-3 d-flex flex-column gap-2">
              <button className="btn btn-dark">Ver detalle</button>

              {tabActivo === "pendientes" && (
                <>
                  <button className="btn btn-secondary">Aceptar</button>
                  <button className="btn btn-light border">Rechazar</button>
                </>
              )}

              {tabActivo === "enCurso" && (
                <>
                  <button className="btn btn-secondary">Editar</button>
                  <button className="btn btn-outline-secondary">Facturas</button>
                  <button className="btn btn-outline-secondary">Finalizar</button>
                </>
              )}

              {tabActivo === "finalizado" && (
                <button className="btn btn-outline-secondary">Ver gastos</button>
              )}

              {tabActivo === "cancelado" && (
                <button className="btn btn-outline-secondary">Ver motivo</button>
              )}
            </div>

          </div>
        </div>
      ))}
    </div>
    </AppLayout>
  );
};

export default Proyectos;