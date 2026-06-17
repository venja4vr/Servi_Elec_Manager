import { useState, useEffect } from "react";
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
            setError(err.message || "Error al cargar datos");
        } finally {
            setCargando(false);
        }
    };

    const handleAprobar = async (idUsuario) => {
        setProcesandoId(idUsuario);
        setError("");
        try {
            await aprobarUsuario(idUsuario);
            setMensajeExito("Usuario aprobado correctamente");
            await cargarDatos();
            setTimeout(() => setMensajeExito(""), 3000);
        } catch (err) {
            setError(err.message || "Error al aprobar");
        } finally {
            setProcesandoId(null);
        }
    };

    const confirmarEliminacion = async (password) => {
        if (!usuarioAEliminar) return;
        setProcesandoId(usuarioAEliminar.id_usuario);
        setError("");
        try {
            await rechazarUsuario(usuarioAEliminar.id_usuario, password);
            setMensajeExito("Usuario eliminado correctamente");
            setUsuarioAEliminar(null);
            await cargarDatos();
            setTimeout(() => setMensajeExito(""), 3000);
        } catch (err) {
            throw err;
        } finally {
            setProcesandoId(null);
        }
    };

    return (
        <>
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

            {error && <div className="alert alert-danger">{error}</div>}
            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "pendientes" ? "active" : ""}`}
                        onClick={() => setTab("pendientes")}
                    >
                        Pendientes ({pendientes.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${tab === "activos" ? "active" : ""}`}
                        onClick={() => setTab("activos")}
                    >
                        Activos ({activos.length})
                    </button>
                </li>
            </ul>

            {cargando ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : tab === "pendientes" ? (
                pendientes.length === 0 ? (
                    <div className="alert alert-info">No hay solicitudes pendientes</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Rol solicitado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendientes.map((usuario) => (
                                    <tr key={usuario.id_usuario}>
                                        <td>{usuario.nombre_usuario}</td>
                                        <td>{usuario.correo}</td>
                                        <td>
                                            <span className="badge bg-secondary">
                                                {usuario.rol === "A" ? "Administrador" : "Técnico"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-success me-2"
                                                onClick={() => handleAprobar(usuario.id_usuario)}
                                                disabled={procesandoId === usuario.id_usuario}
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => setUsuarioAEliminar(usuario)}
                                                disabled={procesandoId === usuario.id_usuario}
                                            >
                                                Rechazar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                activos.length === 0 ? (
                    <div className="alert alert-info">No hay usuarios activos</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Rol</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activos.map((usuario) => (
                                    <tr key={usuario.id_usuario}>
                                        <td>{usuario.nombre_usuario}</td>
                                        <td>{usuario.correo}</td>
                                        <td>
                                            <span className="badge bg-primary">
                                                {usuario.rol === "S" ? "SuperAdmin" : usuario.rol === "A" ? "Administrador" : "Técnico"}
                                            </span>
                                        </td>
                                        <td>
                                            {usuario.id_usuario !== idUsuarioActual && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => setUsuarioAEliminar(usuario)}
                                                    disabled={procesandoId === usuario.id_usuario}
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {usuarioAEliminar && (
                <ConfirmarPasswordModal
                    titulo={`Eliminar a ${usuarioAEliminar.nombre_usuario}`}
                    mensaje="Esta acción es irreversible. Ingresa tu contraseña para confirmar."
                    onConfirmar={confirmarEliminacion}
                    onCancelar={() => setUsuarioAEliminar(null)}
                />
            )}
        </>
    );
}

export default Solicitudes;