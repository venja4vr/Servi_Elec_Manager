import AppLayout from "../components/AppLayout";

function Home(){
    return(
    <AppLayout>
        <div className="mb-4">
            <h1 className="fw-bold">Home</h1>
            <p className="text-muted">Resumen general de la empresa.</p>
        </div>

        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h2 className="h4 fw-bold">¡Bienvenido, Juan!</h2>
            <p className="text-muted mb-0">
            Aquí puedes revisar rápidamente la actividad principal del sistema.
            </p>
        </div>

        <div className="row g-4 mb-4">
            <div className="col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-3">
                    <p className="text-muted mb-1">Proyectos activos</p>
                    <h3 className="fw-bold">12</h3>
                    <small className="text-success">+2 desde la semana pasada</small>
                </div>
            </div>

        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3">
                <p className="text-muted mb-1">Inventario total</p>
                <h3 className="fw-bold">248</h3>
                <small className="text-success">+18 desde la semana pasada</small>
            </div>
        </div>

        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3">
                <p className="text-muted mb-1">Clientes registrados</p>
                <h3 className="fw-bold">56</h3>
                <small className="text-success">+5 desde la semana pasada</small>
            </div>
        </div>

        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3">
                <p className="text-muted mb-1">Órdenes de trabajo</p>
                <h3 className="fw-bold">23</h3>
                <small className="text-danger">-3 desde la semana pasada</small>
            </div>
        </div>
    </div>

    <div className="row g-4">
        <div className="col-md-7">
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <h2 className="h5 fw-bold mb-3">Actividad reciente</h2>
            <div
                className="d-flex justify-content-center align-items-center text-muted"
                style={{ height: "260px", border: "1px dashed #CBD5E1" }}
            >
                Gráfico de actividad reciente
            </div>
        </div>
    </div>

    <div className="col-md-5">
        <div className="card border-0 shadow-sm rounded-4 p-4">
            <h2 className="h5 fw-bold mb-3">Proyectos recientes</h2>

            <div className="border-bottom py-3">
                <strong>Instalación eléctrica - Edificio Torres</strong>
                <p className="text-muted mb-1">Cliente: Constructora del Norte</p>
                <span className="badge bg-primary">En progreso</span>
            </div>

            <div className="border-bottom py-3">
                <strong>Mantenimiento - Local Comercial</strong>
                <p className="text-muted mb-1">Cliente: Supermercados del Sur</p>
                <span className="badge bg-warning text-dark">Pendiente</span>
            </div>

            <div className="py-3">
                <strong>Cableado industrial - Planta 3</strong>
                <p className="text-muted mb-1">Cliente: Industrias Metalúrgicas</p>
                <span className="badge bg-success">Completado</span>
            </div>

            <button className="btn btn-link px-0 mt-2">
                Ver todos los proyectos
            </button>
        </div>
    </div>

    <div className="col-md-7">
        <div className="card border-0 shadow-sm rounded-4 p-4">
            <h2 className="h5 fw-bold mb-3">Alertas y notificaciones</h2>

            <div className="alert alert-danger mb-2">
                Stock bajo en cable THHN 12 AWG
            </div>

            <div className="alert alert-warning mb-2">
                Cotización #COT-2024-045 pendiente
            </div>

            <div className="alert alert-primary mb-0">
                Nueva orden de trabajo asignada
            </div>
            </div>
            </div>
        </div>
    </AppLayout>
    );
}

export default Home;