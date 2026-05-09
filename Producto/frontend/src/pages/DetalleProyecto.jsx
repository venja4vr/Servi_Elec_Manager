import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

function DetalleProyecto() {
    const navigate = useNavigate();

    return (
        <div className="d-flex">
            <Sidebar />
        <div
            className="flex-grow-1 p-4"
            style={{ background: "#F1F5F9", minHeight: "100vh" }}
        >

        <div 
            className="d-flex justify-content-between align-items-start mb-4">
        <div>
            <h1 className="fw-bold">Detalles del proyecto</h1>
            <p className="text-muted fs-5">
                Proyecto #010 — Finalizado
            </p>
        </div>

        <button 
            className="btn btn-dark rounded-pill px-4"
            onClick={() => navigate("/proyectos")}
            >
                Volver
            </button>
        </div>

        <div className="row g-4">
        
            {/* DATOS GENERALES */}
            <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
            
                <div
                className="card-header text-white fw-bold"
                style={{
                    background: "#2563EB",
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                }}
                >
                Datos generales
                </div>

                <div className="card-body">

                <p><strong>Proyecto:</strong> #010</p>
                <hr />

                <p><strong>Cliente:</strong> Comercial Sur</p>
                <hr />

                <p><strong>Tipo de servicio:</strong> Mantención eléctrica</p>
                <hr />

                <p><strong>Fecha inicio:</strong> 20/04/2026</p>
                <hr />

                <p><strong>Fecha término:</strong> 28/04/2026</p>
                <hr />

                <p><strong>Responsable:</strong> Técnico 1</p>
                <hr />

                <p>
                    <strong>Estado:</strong>{" "}
                    <span className="badge bg-success">
                    Finalizado
                    </span>
                </p>
                <hr />

                <p><strong>Dirección:</strong> Quilpué</p>

                </div>
            </div>
            </div>

          {/* COSTOS */}
            <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">

                <div
                className="card-header text-white fw-bold"
                style={{
                    background: "#2563EB",
                }}
                >
                Costos y recursos
                </div>

                <div className="card-body">

                <p><strong>Costo estimado:</strong> $270.000</p>
                <hr />

                <p><strong>Costo final:</strong> $290.000</p>
                <hr />

                <p className="text-success">
                    <strong>Diferencia:</strong> +$20.000
                </p>

                <hr />

                <p><strong>Materiales utilizados:</strong> 3</p>
                <hr />

                <p><strong>Recursos pendientes:</strong> 0</p>

                <hr />

                <h5 className="fw-bold mb-3">
                    Materiales / recursos usados
                </h5>

                <ul>
                    <li>Cable 2,5 mm — 20 m</li>
                    <li>Interruptor automático — 2</li>
                    <li>Tablero eléctrico — 1</li>
                </ul>

                <button className="btn btn-dark w-100 mt-4">
                    Ver gastos
                </button>

                </div>
            </div>
            </div>

          {/* DOCUMENTOS */}
            <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">

                <div
                className="card-header text-white fw-bold"
                style={{
                    background: "#2563EB",
                }}
                >
                Documentos y cierre
                </div>

                <div className="card-body">

                <p><strong>Facturas asociadas:</strong> 2</p>
                <hr />

                <p>
                    <strong>Reporte final:</strong>{" "}
                    <span className="text-success fw-bold">
                    Disponible
                    </span>
                </p>

                <hr />

                <p>
                    <strong>Última actualización:</strong> 28/04/2026
                </p>

                <hr />

                <h5 className="fw-bold">
                    Observación de cierre
                </h5>

                <p className="text-success fw-bold">
                    Proyecto ejecutado correctamente
                </p>

                <p>
                    Se completó la mantención y se registraron
                    todos los materiales utilizados.
                </p>

                <div className="d-grid gap-2 mt-4">
                
                    <button className="btn btn-dark">
                    Ver factura
                    </button>

                    <button className="btn btn-dark">
                    Descargar reporte
                    </button>

                    <button className="btn btn-dark">
                    Ver historial
                    </button>

                </div>

                </div>
            </div>
            </div>

        </div>
        </div>
    </div>
    );
}

export default DetalleProyecto;