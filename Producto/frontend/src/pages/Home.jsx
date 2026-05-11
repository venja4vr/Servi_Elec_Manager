import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { getUsuarioNombre, getProyectos, getMateriales } from "../services/api";

function Home() {
    const [nombre, setNombre] = useState("");
    const [statsProyectos, setStatsProyectos] = useState({ total: 0, activos: 0 });
    const [statsInventario, setStatsInventario] = useState({ total: 0, criticos: 0 });
    const [proyectosRecientes, setProyectosRecientes] = useState([]);
    const [alertas, setAlertas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        setNombre(getUsuarioNombre());
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [proyectos, materiales] = await Promise.all([
                getProyectos(),
                getMateriales(),
            ]);

            // Stats proyectos
            const activos = proyectos.filter(
                (p) => p.estado === "pendiente" || p.estado === "en_curso"
            ).length;
            setStatsProyectos({ total: proyectos.length, activos });

            // Stats inventario
            const criticos = materiales.filter(
                (m) => m.stock_actual <= m.stock_critico
            ).length;
            setStatsInventario({ total: materiales.length, criticos });

            // 3 proyectos más recientes
            setProyectosRecientes(proyectos.slice(0, 3));

            // Alertas: materiales con stock crítico
            const materialesCriticos = materiales
                .filter((m) => m.stock_actual <= m.stock_critico)
                .slice(0, 3);
            setAlertas(materialesCriticos);
        } catch (err) {
            console.error("Error cargando dashboard:", err);
        } finally {
            setCargando(false);
        }
    };

    const getBadgeEstado = (estado) => {
        switch (estado) {
            case "pendiente":
                return "bg-warning text-dark";
            case "en_curso":
                return "bg-primary";
            case "finalizado":
                return "bg-success";
            case "cancelado":
                return "bg-secondary";
            default:
                return "bg-secondary";
        }
    };

    const formatearEstado = (estado) => {
        const mapa = {
            pendiente: "Pendiente",
            en_curso: "En curso",
            finalizado: "Finalizado",
            cancelado: "Cancelado",
        };
        return mapa[estado] || estado;
    };

    return (
        <AppLayout>
            <div className="mb-4">
                <h1 className="fw-bold">Home</h1>
                <p className="text-muted">Resumen general de la empresa.</p>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h2 className="h4 fw-bold">¡Bienvenido, {nombre}!</h2>
                <p className="text-muted mb-0">
                    Aquí puedes revisar rápidamente la actividad principal del sistema.
                </p>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3">
                        <p className="text-muted mb-1">Proyectos activos</p>
                        <h3 className="fw-bold">{cargando ? "..." : statsProyectos.activos}</h3>
                        <small className="text-muted">
                            de {statsProyectos.total} en total
                        </small>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3">
                        <p className="text-muted mb-1">Inventario total</p>
                        <h3 className="fw-bold">{cargando ? "..." : statsInventario.total}</h3>
                        <small className="text-muted">recursos registrados</small>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3">
                        <p className="text-muted mb-1">Stock crítico</p>
                        <h3 className="fw-bold text-warning">
                            {cargando ? "..." : statsInventario.criticos}
                        </h3>
                        <small className="text-muted">materiales en alerta</small>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3">
                        <p className="text-muted mb-1">Total proyectos</p>
                        <h3 className="fw-bold">{cargando ? "..." : statsProyectos.total}</h3>
                        <small className="text-muted">en el sistema</small>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-7">
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h2 className="h5 fw-bold mb-3">Proyectos recientes</h2>

                        {cargando ? (
                            <p className="text-muted">Cargando proyectos...</p>
                        ) : proyectosRecientes.length === 0 ? (
                            <p className="text-muted">
                                Aún no hay proyectos registrados.
                            </p>
                        ) : (
                            proyectosRecientes.map((proyecto, index) => (
                                <div
                                    key={proyecto.id_proyecto}
                                    className={index < proyectosRecientes.length - 1 ? "border-bottom py-3" : "py-3"}
                                >
                                    <strong>{proyecto.nombre_proyecto}</strong>
                                    <p className="text-muted mb-1">
                                        Cliente: {proyecto.nombre_cliente}
                                    </p>
                                    <span className={`badge ${getBadgeEstado(proyecto.estado)}`}>
                                        {formatearEstado(proyecto.estado)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h2 className="h5 fw-bold mb-3">Alertas de inventario</h2>

                        {cargando ? (
                            <p className="text-muted">Cargando alertas...</p>
                        ) : alertas.length === 0 ? (
                            <div className="alert alert-success mb-0">
                                Todos los materiales tienen stock adecuado.
                            </div>
                        ) : (
                            alertas.map((material) => (
                                <div
                                    key={material.id_material}
                                    className={`alert ${
                                        material.stock_actual === 0
                                            ? "alert-danger"
                                            : "alert-warning"
                                    } mb-2`}
                                >
                                    {material.stock_actual === 0
                                        ? "Sin stock: "
                                        : "Stock bajo: "}
                                    <strong>{material.nombre_material}</strong>
                                    <small className="d-block">
                                        Disponible: {material.stock_actual} | Crítico:{" "}
                                        {material.stock_critico}
                                    </small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default Home;