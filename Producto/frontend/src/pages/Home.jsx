import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AppLayout from "../components/AppLayout";
import { getUsuarioNombre, getProyectos, getMateriales, getAlertasProyectos } from "../services/api";
import GuiaRapida from "../components/GuiaRapida";

const COLORES_ESTADO = {
    pendiente: "#2563EB",
    en_curso: "#FACC15",
    finalizado: "#22C55E",
    cancelado: "#EF4444",
};

const NOMBRES_ESTADO = {
    pendiente: "Pendientes",
    en_curso: "En curso",
    finalizado: "Finalizados",
    cancelado: "Cancelados",
};

function Home() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [statsProyectos, setStatsProyectos] = useState({ total: 0, activos: 0 });
    const [statsInventario, setStatsInventario] = useState({ total: 0, criticos: 0 });
    const [proyectosRecientes, setProyectosRecientes] = useState([]);
    const [alertas, setAlertas] = useState([]);
    const [alertasProyectos, setAlertasProyectos] = useState([]);
    const [datosGrafico, setDatosGrafico] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        setNombre(getUsuarioNombre());
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [proyectos, materiales, alertasFecha] = await Promise.all([
                getProyectos(),
                getMateriales(),
                getAlertasProyectos(3).catch(() => []),
            ]);
            setAlertasProyectos(alertasFecha);

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

    // Obtener iniciales del nombre para el avatar
    const obtenerIniciales = (nombreCompleto) => {
        if (!nombreCompleto) return "U";
        const partes = nombreCompleto.trim().split(" ");
        if (partes.length === 1) return partes[0][0].toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    };

    const formatearEstadoVisual = (estado) => {
        // Mapea estado interno → clase CSS de Hans + texto
        switch (estado) {
            case "pendiente":
                return { clase: "pending", texto: "Pendiente" };
            case "en_curso":
                return { clase: "in-progress", texto: "En progreso" };
            case "finalizado":
                return { clase: "done", texto: "Completado" };
            case "cancelado":
                return { clase: "cancelled", texto: "Cancelado" };
            default:
                return { clase: "", texto: estado };
        }
    };

    const iconoEstado = (estado) => {
        switch (estado) {
            case "pendiente":
                return { icono: "⚡", clase: "yellow" };
            case "en_curso":
                return { icono: "▦", clase: "" };
            case "finalizado":
                return { icono: "✓", clase: "green" };
            case "cancelado":
                return { icono: "✕", clase: "red" };
            default:
                return { icono: "▦", clase: "" };
        }
    };

    return (
        <AppLayout>
            <div className="dashboard-header">
                <div>
                    <span className="page-label">Panel principal</span>
                    <h1>Home</h1>
                    <p>Resumen general de la empresa y actividad reciente.</p>
                </div>

                <div className="header-actions">
                    <GuiaRapida />
                    <div className="user-box">
                        <div className="user-avatar">{obtenerIniciales(nombre)}</div>
                        <div>
                            <strong>{nombre || "Usuario"}</strong>
                            <span>Administrador</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="welcome-card home-hero-card">
                <div className="welcome-left">
                    <div className="welcome-icon">👋</div>
                    <div>
                        <h2>¡Bienvenido, {nombre || "Usuario"}!</h2>
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
                            <h3>{cargando ? "..." : statsProyectos.activos}</h3>
                        </div>
                        <div className="stat-icon">▣</div>
                    </div>
                    <p>de {statsProyectos.total} en total</p>
                </div>

                <div className="stat-card">
                    <div className="stat-top">
                        <div>
                            <span>Inventario total</span>
                            <h3>{cargando ? "..." : statsInventario.total}</h3>
                        </div>
                        <div className="stat-icon">◈</div>
                    </div>
                    <p>recursos registrados</p>
                </div>

                <div className="stat-card">
                    <div className="stat-top">
                        <div>
                            <span>Stock crítico</span>
                            <h3>{cargando ? "..." : statsInventario.criticos}</h3>
                        </div>
                        <div className="stat-icon warning-icon">▤</div>
                    </div>
                    <p className={statsInventario.criticos > 0 ? "negative" : ""}>
                        {statsInventario.criticos > 0
                            ? "materiales en alerta"
                            : "todo en orden"}
                    </p>
                </div>

                <div className="stat-card">
                    <div className="stat-top">
                        <div>
                            <span>Total proyectos</span>
                            <h3>{cargando ? "..." : statsProyectos.total}</h3>
                        </div>
                        <div className="stat-icon">☷</div>
                    </div>
                    <p>en el sistema</p>
                </div>
            </section>

            <section className="home-grid">
                <div className="dashboard-card activity-card">
                    <div className="card-title-row">
                        <h2>Gráfico de proyectos</h2>
                    </div>

                    {cargando ? (
                        <p style={{ textAlign: "center", padding: "2rem" }}>
                            Cargando gráfico...
                        </p>
                    ) : datosGrafico.length === 0 ? (
                        <p style={{ textAlign: "center", padding: "2rem" }}>
                            Aún no hay proyectos para graficar.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={datosGrafico}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={110}
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

                <div className="dashboard-card">
                    <div className="card-title-row">
                        <h2>Proyectos recientes</h2>
                        <button onClick={() => navigate("/proyectos")}>Ver todos</button>
                    </div>

                    {cargando ? (
                        <p>Cargando proyectos...</p>
                    ) : proyectosRecientes.length === 0 ? (
                        <p>Aún no hay proyectos registrados.</p>
                    ) : (
                        proyectosRecientes.map((proyecto) => {
                            const estadoVisual = formatearEstadoVisual(proyecto.estado);
                            const icono = iconoEstado(proyecto.estado);
                            return (
                                <div
                                    key={proyecto.id_proyecto}
                                    className="project-item modern-project"
                                    onClick={() => navigate(`/proyectos/${proyecto.id_proyecto}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className={`project-icon ${icono.clase}`}>
                                        {icono.icono}
                                    </div>
                                    <div>
                                        <strong>{proyecto.nombre_proyecto}</strong>
                                        <p>Cliente: {proyecto.nombre_cliente}</p>
                                    </div>
                                    <span className={`status ${estadoVisual.clase}`}>
                                        {estadoVisual.texto}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="dashboard-card notifications-card">
                    <div className="card-title-row">
                        <h2>Alertas de inventario</h2>
                    </div>

                    {cargando ? (
                        <p>Cargando alertas...</p>
                    ) : alertas.length === 0 ? (
                        <div className="notification-item info">
                            <div className="notification-icon">i</div>
                            <div>
                                <strong>Todo el inventario está en orden</strong>
                                <span>Sin materiales en stock crítico</span>
                            </div>
                        </div>
                    ) : (
                        alertas.map((material) => (
                            <div
                                key={material.id_material}
                                className={`notification-item ${
                                    material.stock_actual === 0 ? "danger" : "warning"
                                }`}
                            >
                                <div className="notification-icon">
                                    {material.stock_actual === 0 ? "!" : "⌛"}
                                </div>
                                <div>
                                    <strong>
                                        {material.stock_actual === 0
                                            ? "Sin stock: "
                                            : "Stock bajo: "}
                                        {material.nombre_material}
                                    </strong>
                                    <span>
                                        Disponible: {material.stock_actual} | Crítico:{" "}
                                        {material.stock_critico}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Widget proyectos próximos ─────────────────────────── */}
                <div className="dashboard-card notifications-card">
                    <div className="card-title-row">
                        <h2>Proyectos próximos</h2>
                        <button onClick={() => navigate("/proyectos")}>Ver todos</button>
                    </div>

                    {cargando ? (
                        <p>Cargando...</p>
                    ) : alertasProyectos.length === 0 ? (
                        <div className="notification-item info">
                            <div className="notification-icon">i</div>
                            <div>
                                <strong>Sin proyectos próximos</strong>
                                <span>Ningún proyecto con fecha crítica en los próximos 3 días</span>
                            </div>
                        </div>
                    ) : (
                        alertasProyectos.map((a) => {
                            const cfg = a.tipo_alerta === "atrasado"
                                ? { clase: "danger", icono: "!", etiqueta: "Atrasado" }
                                : a.tipo_alerta === "finalizar_pronto"
                                ? { clase: "warning", icono: "⌛", etiqueta: "Finalizar pronto" }
                                : { clase: "warning", icono: "⌛", etiqueta: "Iniciar pronto" };

                            const diasTexto = a.dias_restantes < 0
                                ? `Hace ${Math.abs(a.dias_restantes)} día${Math.abs(a.dias_restantes) !== 1 ? "s" : ""}`
                                : a.dias_restantes === 0
                                ? "Hoy"
                                : `En ${a.dias_restantes} día${a.dias_restantes !== 1 ? "s" : ""}`;

                            return (
                                <div
                                    key={a.id_proyecto}
                                    className={`notification-item ${cfg.clase}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/proyectos/${a.id_proyecto}`)}
                                >
                                    <div className="notification-icon">{cfg.icono}</div>
                                    <div>
                                        <strong>{cfg.etiqueta}: {a.nombre_proyecto}</strong>
                                        <span>
                                            {a.nombre_cliente} · {diasTexto}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </AppLayout>
    );
}

export default Home;