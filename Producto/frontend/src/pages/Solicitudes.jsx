import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ConfirmarPasswordModal from "../components/ConfirmarPasswordModal";
import {
    getUsuariosPendientes,
    getUsuariosActivos,
    aprobarUsuario,
    rechazarUsuario,
    getUsuarioId,
} from "../services/api";

function Solicitudes() {
    const [tab, setTab] = useState("pendientes");
    const [pendientes, setPendientes] = useState([]);
    const [activos, setActivos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);

    // Estado para el modal de confirmación de eliminación
    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

    const idUsuarioActual = getUsuarioId();

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        setError("");
        try {
            const [pend, act] = await Promise.all([
                getUsuariosPendientes(),
                getUsuariosActivos(),
            ]);
            setPendientes(pend);
            setActivos(act);
        } catch (err) {
            setError(err.message || "Error al cargar los datos");
        } finally {
            setCargando(false);
        }
    };

    const handleAprobar = async (usuario) => {
        if (!window.confirm(`¿Aprobar la cuenta de ${usuario.nombre_usuario}?`)) {
            return;
        }

        setProcesandoId(usuario.id_usuario);
        setError("");
        setMensajeExito("");

        try {
            await aprobarUsuario(usuario.id_usuario);
            setMensajeExito(`Cuenta de ${usuario.nombre_usuario} aprobada correctamente`);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al aprobar la cuenta");
        } finally {
            setProcesandoId(null);
        }
    };

    const handleRechazarPendiente = async (usuario) => {
        if (!window.confirm(
            `¿Rechazar y eliminar la cuenta de ${usuario.nombre_usuario}?\n\nEsta acción no se puede deshacer.`
        )) {
            return;
        }

        setProcesandoId(usuario.id_usuario);
        setError("");
        setMensajeExito("");

        try {
            await rechazarUsuario(usuario.id_usuario);
            setMensajeExito(`Cuenta de ${usuario.nombre_usuario} rechazada y eliminada`);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al rechazar la cuenta");
        } finally {
            setProcesandoId(null);
        }
    };

    // Para usuarios activos, abrimos el modal de contraseña antes de eliminar
    const handleSolicitarEliminar = (usuario) => {
        setUsuarioAEliminar(usuario);
    };

    const handleConfirmarEliminar = async () => {
        const usuario = usuarioAEliminar;
        setUsuarioAEliminar(null);
        setProcesandoId(usuario.id_usuario);
        setError("");
        setMensajeExito("");

        try {
            await rechazarUsuario(usuario.id_usuario);
            setMensajeExito(`Cuenta de ${usuario.nombre_usuario} eliminada correctamente`);
            await cargarDatos();
        } catch (err) {
            setError(err.message || "Error al eliminar la cuenta");
        } finally {
            setProcesandoId(null);
        }
    };

    const traducirRol = (rol) => {
        if (rol === "S") return "SuperAdmin";
        if (rol === "A") return "Administrador";
        if (rol === "T") return "Técnico";
        return rol;
    };

    const colorBadgeRol = (rol) => {
        if (rol === "S") return "bg-warning text-dark";
        if (rol === "A") return "bg-primary";
        return "bg-secondary";
    };

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-4" style={{ background: "#f8f9fa", minHeight: "100vh" }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="mb-1">Gestión de cuentas</h2>
                        <p className="text-muted mb-0">
                            Aprueba solicitudes pendientes y administra usuarios activos
                        </p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={cargarDatos}
                        disabled={cargando}
                    >
                        {cargando ? "Cargando..." : "Refrescar"}
                    </button>
                </div>

                {/* TABS */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${tab === "pendientes" ? "active" : ""}`}
                            onClick={() => setTab("pendientes")}
                        >
                            Pendientes
                            {pendientes.length > 0 && (
                                <span className="badge bg-danger ms-2">{pendientes.length}</span>
                            )}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${tab === "activos" ? "active" : ""}`}
                            onClick={() => setTab("activos")}
                        >
                            Usuarios activos
                            <span className="badge bg-secondary ms-2">{activos.length}</span>
                        </button>
                    </li>
                </ul>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {mensajeExito && (
                    <div className="alert alert-success" role="alert">
                        {mensajeExito}
                    </div>
                )}

                {cargando ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                ) : tab === "pendientes" ? (
                    pendientes.length === 0 ? (
                        <div className="card shadow-sm">
                            <div className="card-body text-center p-5">
                                <div style={{ fontSize: "3rem" }}>✓</div>
                                <h5 className="mt-3">No hay solicitudes pendientes</h5>
                                <p className="text-muted mb-0">
                                    Cuando un usuario se registre, su solicitud aparecerá aquí.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Correo</th>
                                            <th>Rol solicitado</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendientes.map((usuario) => (
                                            <tr key={usuario.id_usuario}>
                                                <td>{usuario.nombre_usuario}</td>
                                                <td>{usuario.correo}</td>
                                                <td>
                                                    <span className={`badge ${colorBadgeRol(usuario.rol)}`}>
                                                        {traducirRol(usuario.rol)}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-success me-2"
                                                        onClick={() => handleAprobar(usuario)}
                                                        disabled={procesandoId === usuario.id_usuario}
                                                    >
                                                        {procesandoId === usuario.id_usuario ? "..." : "Aprobar"}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRechazarPendiente(usuario)}
                                                        disabled={procesandoId === usuario.id_usuario}
                                                    >
                                                        {procesandoId === usuario.id_usuario ? "..." : "Rechazar"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    // TAB DE ACTIVOS
                    <div className="card shadow-sm">
                        <div className="card-body p-0">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Correo</th>
                                        <th>Rol</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activos.map((usuario) => {
                                        const esYoMismo = usuario.id_usuario === idUsuarioActual;
                                        const esSuperAdmin = usuario.rol === "S";
                                        const noEliminable = esYoMismo || esSuperAdmin;

                                        return (
                                            <tr key={usuario.id_usuario}>
                                                <td>
                                                    {usuario.nombre_usuario}
                                                    {esYoMismo && (
                                                        <span className="badge bg-info text-dark ms-2">Tú</span>
                                                    )}
                                                </td>
                                                <td>{usuario.correo}</td>
                                                <td>
                                                    <span className={`badge ${colorBadgeRol(usuario.rol)}`}>
                                                        {traducirRol(usuario.rol)}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleSolicitarEliminar(usuario)}
                                                        disabled={noEliminable || procesandoId === usuario.id_usuario}
                                                        title={
                                                            esYoMismo
                                                                ? "No puedes eliminarte a ti mismo"
                                                                : esSuperAdmin
                                                                ? "No se puede eliminar a un SuperAdmin"
                                                                : "Eliminar usuario"
                                                        }
                                                    >
                                                        {procesandoId === usuario.id_usuario ? "..." : "Eliminar"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmación de eliminación con contraseña */}
            <ConfirmarPasswordModal
                mostrar={!!usuarioAEliminar}
                titulo="Eliminar usuario"
                mensaje={
                    usuarioAEliminar
                        ? `Vas a eliminar permanentemente la cuenta de ${usuarioAEliminar.nombre_usuario} (${usuarioAEliminar.correo}). Esta acción no se puede deshacer.`
                        : ""
                }
                colorBoton="btn-danger"
                textoBoton="Eliminar usuario"
                onConfirmar={handleConfirmarEliminar}
                onCancelar={() => setUsuarioAEliminar(null)}
            />
        </div>
    );
}

export default Solicitudes;