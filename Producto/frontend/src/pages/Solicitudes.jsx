import { useState } from "react";
import AppLayout from "../components/AppLayout";
import ConfirmarPasswordModal from "../components/ConfirmarPasswordModal";
import GuiaRapida from "../components/GuiaRapida";

function Solicitudes() {
    const [tab, setTab] = useState("pendientes");
    const [mensaje, setMensaje] = useState("");
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

    const [pendientes, setPendientes] = useState([
        {
            id_usuario: 1,
            nombre_usuario: "Juan Pérez",
            correo: "juan@mail.com",
            rol: "A",
        },
        {
            id_usuario: 2,
            nombre_usuario: "Ana López",
            correo: "ana@mail.com",
            rol: "T",
        },
    ]);

    const [activos, setActivos] = useState([
        {
            id_usuario: 3,
            nombre_usuario: "Carlos Ruiz",
            correo: "carlos@mail.com",
            rol: "A",
        },
        {
            id_usuario: 99,
            nombre_usuario: "Hans Bravo",
            correo: "superadmin@servielec.cl",
            rol: "S",
        },
    ]);

    const traducirRol = (rol) => {
        if (rol === "S") return "SuperAdmin";
        if (rol === "A") return "Administrador";
        if (rol === "T") return "Técnico";
        return rol;
    };

    const aprobarUsuario = (usuario) => {
        setPendientes(
            pendientes.filter((u) => u.id_usuario !== usuario.id_usuario)
        );

        setActivos([...activos, usuario]);

        setMensaje(
            `✅ Usuario ${usuario.nombre_usuario} aprobado correctamente`
        );
    };

    const rechazarUsuario = (usuario) => {
        setPendientes(
            pendientes.filter((u) => u.id_usuario !== usuario.id_usuario)
        );

        setMensaje(
            `❌ Usuario ${usuario.nombre_usuario} rechazado`
        );
    };

    const eliminarUsuario = () => {
        if (!usuarioSeleccionado) return;

        setActivos(
            activos.filter(
                (u) =>
                    u.id_usuario !== usuarioSeleccionado.id_usuario
            )
        );

        setMensaje(
            `🗑 Usuario ${usuarioSeleccionado.nombre_usuario} eliminado`
        );

        setUsuarioSeleccionado(null);
    };

    const obtenerClaseRol = (rol) => {
        if (rol === "S") return "pending";
        if (rol === "A") return "done";
        return "in-progress";
    };

    return (
        <AppLayout>
            <div className="dashboard-header">
                <div>
                    <span className="page-label">
                        ADMIN / SOLICITUDES
                    </span>

                    <h1>Gestión de usuarios</h1>

                    <p>
                        Aprueba solicitudes y administra las
                        cuentas del sistema.
                    </p>
                </div>

                <GuiaRapida
                    titulo="Guía rápida de Solicitudes"
                    descripcion="Aquí puedes revisar las solicitudes de recursos registradas por los usuarios. Gestiona estados, consulta detalles y realiza el seguimiento de cada solicitud pendiente o procesada."
                />
            </div>

            {/* RESUMEN */}
            <div className="stats-grid">

                <div className="stat-card">
                    <span>Solicitudes pendientes</span>
                    <h3>{pendientes.length}</h3>
                    <p className="positive">
                        Esperando aprobación
                    </p>
                </div>

                <div className="stat-card">
                    <span>Usuarios activos</span>
                    <h3>{activos.length}</h3>
                    <p className="positive">
                        Cuentas habilitadas
                    </p>
                </div>

            </div>

            {/* TABS */}
            <div className="projects-tabs">

                <button
                    className={
                        tab === "pendientes" ? "active" : ""
                    }
                    onClick={() =>
                        setTab("pendientes")
                    }
                >
                    Pendientes ({pendientes.length})
                </button>

                <button
                    className={
                        tab === "activos" ? "active" : ""
                    }
                    onClick={() =>
                        setTab("activos")
                    }
                >
                    Activos ({activos.length})
                </button>

            </div>

            {/* MENSAJE */}
            {mensaje && (
                <div
                    className="detail-card"
                    style={{
                        marginBottom: "20px",
                    }}
                >
                    {mensaje}
                </div>
            )}

            {/* PENDIENTES */}
            {tab === "pendientes" && (
                <div className="detail-card">

                    <h2>Solicitudes pendientes</h2>

                    {pendientes.length === 0 ? (
                        <p>
                            No existen solicitudes pendientes.
                        </p>
                    ) : (
                        pendientes.map((u) => (
                            <div
                                className="project-item modern-project"
                                key={u.id_usuario}
                            >
                                <div>
                                    <strong>
                                        {u.nombre_usuario}
                                    </strong>

                                    <p>{u.correo}</p>
                                </div>

                                <div
                                    className={`status ${obtenerClaseRol(
                                        u.rol
                                    )}`}
                                >
                                    {traducirRol(u.rol)}
                                </div>

                                <div className="project-actions">

                                    <button
                                        className="primary-btn"
                                        onClick={() =>
                                            aprobarUsuario(u)
                                        }
                                    >
                                        Aprobar
                                    </button>

                                    <button
                                        className="secondary-btn"
                                        onClick={() =>
                                            rechazarUsuario(u)
                                        }
                                    >
                                        Rechazar
                                    </button>

                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ACTIVOS */}
            {tab === "activos" && (
                <div className="detail-card">

                    <h2>Usuarios activos</h2>

                    {activos.map((u) => {
                        const esSuperAdmin =
                            u.rol === "S";

                        return (
                            <div
                                className="project-item modern-project"
                                key={u.id_usuario}
                            >
                                <div>
                                    <strong>
                                        {u.nombre_usuario}
                                    </strong>

                                    <p>{u.correo}</p>
                                </div>

                                <div
                                    className={`status ${obtenerClaseRol(
                                        u.rol
                                    )}`}
                                >
                                    {traducirRol(u.rol)}
                                </div>

                                <div className="project-actions">
                                    <button
                                        className="secondary-btn"
                                        disabled={
                                            esSuperAdmin
                                        }
                                        onClick={() =>
                                            setUsuarioSeleccionado(
                                                u
                                            )
                                        }
                                    >
                                        {esSuperAdmin
                                            ? "Protegido"
                                            : "Eliminar"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmarPasswordModal
                mostrar={!!usuarioSeleccionado}
                titulo="Eliminar usuario"
                mensaje={
                    usuarioSeleccionado
                        ? `¿Deseas eliminar a ${usuarioSeleccionado.nombre_usuario}? Esta acción no se puede deshacer.`
                        : ""
                }
                textoBoton="Eliminar"
                onCancelar={() =>
                    setUsuarioSeleccionado(null)
                }
                onConfirmar={eliminarUsuario}
            />
        </AppLayout>
    );
}

export default Solicitudes;