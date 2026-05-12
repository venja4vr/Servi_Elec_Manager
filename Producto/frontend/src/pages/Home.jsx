import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AppLayout from "../components/AppLayout";
import { getUsuarioNombre, getProyectos, getMateriales } from "../services/api";

const COLORES_ESTADO = {
    pendiente: "#2563EB",   // azul
    en_curso: "#FACC15",    // amarillo
    finalizado: "#22C55E",  // verde
    cancelado: "#EF4444",   // rojo
};

const NOMBRES_ESTADO = {
    pendiente: "Pendientes",
    en_curso: "En curso",
    finalizado: "Finalizados",
    cancelado: "Cancelados",
};

function Home() {
    const [nombre, setNombre] = useState("");
    const [statsProyectos, setStatsProyectos] = useState({ total: 0, activos: 0 });
    const [statsInventario, setStatsInventario] = useState({ total: 0, criticos: 0 });
    const [proyectosRecientes, setProyectosRecientes] = useState([]);
    const [alertas, setAlertas] = useState([]);
    const [datosGrafico, setDatosGrafico] = useState([]);
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

            // Datos para el gráfico de torta
            const conteo = {
                pendiente: 0,
                en_curso: 0,
                finalizado: 0,
                cancelado: 0,
            };
            proyectos.forEach((p) => {
                if (conteo[p.estado] !== undefined) {
                    conteo[p.estado]++;
                }
            });

            const datos = Object.keys(conteo)
                .filter((estado) => conteo[estado] > 0)
                .map((estado) => ({
                    name: NOMBRES_ESTADO[estado],
                    value: conteo[estado],
                    color: COLORES_ESTADO[estado],
                }));
            setDatosGrafico(datos);
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

    const renderEtiquetaCustom = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontWeight="bold"
                fontSize="14"
            >
                {value}
            </text>
        );
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

            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
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
                                    <p className="text-muted mb-1 small">
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

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <h2 className="h5 fw-bold mb-3">Gráfico de proyectos</h2>

                        {cargando ? (
                            <p className="text-muted">Cargando gráfico...</p>
                        ) : datosGrafico.length === 0 ? (
                            <p className="text-muted">
                                Aún no hay proyectos para graficar.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={datosGrafico}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        labelLine={false}
                                        label={renderEtiquetaCustom}
                                    >
                                        {datosGrafico.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
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