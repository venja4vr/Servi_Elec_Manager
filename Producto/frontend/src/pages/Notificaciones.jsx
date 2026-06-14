import { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import {
    getNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    getAlertasProyectos,
    getMateriales,
} from "../services/api";

const STORAGE_KEY = "notificaciones_virtuales_leidas";

const TIPO_LABEL = {
    nueva_cotizacion: "Cotizacion",
    nueva_solicitud_usuario: "Solicitud",
    stock_critico: "Stock",
    alerta_proyecto: "Proyecto",
    stock_bajo: "Stock",
};

function formatearFecha(iso) {
    const d = new Date(iso);
    return d.toLocaleString("es-CL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// Construye notificaciones virtuales desde alertas de proyectos y stock
function alertasAVirtuales(alertasProyecto, materialesCriticos) {
    const ahora = new Date().toISOString();
    const virtuales = [];

    for (const a of alertasProyecto) {
        const diasTexto = a.dias_restantes < 0
            ? `Atrasado ${Math.abs(a.dias_restantes)} dia${Math.abs(a.dias_restantes) !== 1 ? "s" : ""}`
            : a.dias_restantes === 0
            ? "Vence hoy"
            : `Vence en ${a.dias_restantes} dia${a.dias_restantes !== 1 ? "s" : ""}`;

        const tipoLabel = a.tipo_alerta === "atrasado" ? "Atrasado" : "Vence pronto";

        virtuales.push({
            id_notificacion: `virtual-proy-${a.id_proyecto}`,
            tipo: "alerta_proyecto",
            titulo: `${tipoLabel}: ${a.nombre_proyecto}`,
            mensaje: `${a.nombre_cliente} — ${diasTexto}`,
            leida: false,
            creada_en: ahora,
            virtual: true,
            link: `/proyectos/${a.id_proyecto}`,
        });
    }

    for (const m of materialesCriticos) {
        virtuales.push({
            id_notificacion: `virtual-stock-${m.id_material}`,
            tipo: "stock_bajo",
            titulo: `${m.stock_actual === 0 ? "Sin stock" : "Stock bajo"}: ${m.nombre_material}`,
            mensaje: `Disponible: ${m.stock_actual} | Critico: ${m.stock_critico}`,
            leida: false,
            creada_en: ahora,
            virtual: true,
        });
    }

    return virtuales;
}

function leerIdsLeidas() {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
        return new Set();
    }
}

function guardarIdsLeidas(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function Notificaciones() {
    const [notificaciones, setNotificaciones] = useState([]);
    const [filtro, setFiltro] = useState("todas");
    const [cargando, setCargando] = useState(true);
    const [marcandoTodas, setMarcandoTodas] = useState(false);
    const idsVirtualesLeidas = useRef(leerIdsLeidas());

    const cargar = async () => {
        setCargando(true);
        try {
            const [notifBD, alertasFecha, materiales] = await Promise.all([
                getNotificaciones(false).catch(() => []),
                getAlertasProyectos(3).catch(() => []),
                getMateriales().catch(() => []),
            ]);

            const materialesCriticos = materiales.filter(
                (m) => m.stock_actual <= m.stock_critico
            );

            const virtuales = alertasAVirtuales(alertasFecha, materialesCriticos).map((v) => ({
                ...v,
                leida: idsVirtualesLeidas.current.has(v.id_notificacion),
            }));

            setNotificaciones([...virtuales, ...notifBD]);
        } catch {
            setNotificaciones([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const handleMarcarLeida = async (id) => {
        if (id.startsWith("virtual-")) {
            idsVirtualesLeidas.current.add(id);
            guardarIdsLeidas(idsVirtualesLeidas.current);
            setNotificaciones((prev) =>
                prev.map((n) => n.id_notificacion === id ? { ...n, leida: true } : n)
            );
        } else {
            setNotificaciones((prev) =>
                prev.map((n) => n.id_notificacion === id ? { ...n, leida: true } : n)
            );
            try {
                await marcarLeida(id);
            } catch {
                // silencioso
            }
        }
    };

    const handleMarcarTodas = async () => {
        setMarcandoTodas(true);
        // Persistir todas las virtuales como leídas
        const todasIds = notificaciones
            .filter((n) => n.id_notificacion.startsWith("virtual-"))
            .map((n) => n.id_notificacion);
        todasIds.forEach((id) => idsVirtualesLeidas.current.add(id));
        guardarIdsLeidas(idsVirtualesLeidas.current);
        // Marcar reales en backend
        try {
            await marcarTodasLeidas();
        } catch {
            // silencioso
        }
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
        setMarcandoTodas(false);
    };

    const visibles = filtro === "no_leidas"
        ? notificaciones.filter((n) => !n.leida)
        : notificaciones;

    const sinLeer = notificaciones.filter((n) => !n.leida).length;

    return (
        <AppLayout>
            <div className="dashboard-header">
                <div>
                    <span className="page-label">Sistema</span>
                    <h1>Notificaciones</h1>
                    <p>Alertas y avisos del sistema.</p>
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "18px", alignItems: "center" }}>
                <button
                    className={`filter-btn ${filtro === "todas" ? "active" : ""}`}
                    onClick={() => setFiltro("todas")}
                >
                    Todas
                </button>
                <button
                    className={`filter-btn ${filtro === "no_leidas" ? "active" : ""}`}
                    onClick={() => setFiltro("no_leidas")}
                >
                    No leidas {sinLeer > 0 && `(${sinLeer})`}
                </button>

                {sinLeer > 0 && (
                    <button
                        className="btn-secondary"
                        onClick={handleMarcarTodas}
                        disabled={marcandoTodas}
                        style={{ marginLeft: "auto" }}
                    >
                        {marcandoTodas ? "Marcando..." : "Marcar todas como leidas"}
                    </button>
                )}
            </div>

            <div className="dashboard-card">
                {cargando ? (
                    <p style={{ padding: "1rem" }}>Cargando notificaciones...</p>
                ) : visibles.length === 0 ? (
                    <p style={{ padding: "1rem", color: "#888" }}>
                        {filtro === "no_leidas" ? "No hay notificaciones sin leer." : "No hay notificaciones."}
                    </p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #e5e1d7", textAlign: "left" }}>
                                <th style={{ padding: "10px 8px", width: "110px" }}>Tipo</th>
                                <th style={{ padding: "10px 8px" }}>Titulo</th>
                                <th style={{ padding: "10px 8px" }}>Mensaje</th>
                                <th style={{ padding: "10px 8px", width: "140px" }}>Fecha</th>
                                <th style={{ padding: "10px 8px", width: "80px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map((n) => (
                                <tr
                                    key={n.id_notificacion}
                                    style={{
                                        borderBottom: "1px solid #e5e1d7",
                                        background: n.leida ? "transparent" : "#f0f4ec",
                                        fontWeight: n.leida ? "normal" : "600",
                                    }}
                                >
                                    <td style={{ padding: "10px 8px" }}>
                                        <span className="notif-tipo-badge">
                                            {TIPO_LABEL[n.tipo] ?? n.tipo}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 8px" }}>{n.titulo}</td>
                                    <td style={{ padding: "10px 8px", color: "#555" }}>{n.mensaje}</td>
                                    <td style={{ padding: "10px 8px", color: "#777", fontSize: "0.82rem" }}>
                                        {formatearFecha(n.creada_en)}
                                    </td>
                                    <td style={{ padding: "10px 8px" }}>
                                        {!n.leida && (
                                            <button
                                                className="btn-small"
                                                onClick={() => handleMarcarLeida(n.id_notificacion)}
                                            >
                                                Leida
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AppLayout>
    );
}

export default Notificaciones;
