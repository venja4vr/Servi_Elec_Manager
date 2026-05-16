import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
    getUsuariosPendientes,
    aprobarUsuario,
    rechazarUsuario,
} from "../services/api";

function Solicitudes() {
    const [pendientes, setPendientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);

    useEffect(() => {
        cargarPendientes();
    }, []);

    const cargarPendientes = async () => {
        setCargando(true);
        setError("");
        try {
            const data = await getUsuariosPendientes();
            setPendientes(data);
        } catch (err) {
            setError(err.message || "Error al cargar las solicitudes");
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
            await cargarPendientes();
        } catch (err) {
            setError(err.message || "Error al aprobar la cuenta");
        } finally {
            setProcesandoId(null);
        }
    };

    const handleRechazar = async (usuario) => {
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
            await cargarPendientes();
        } catch (err) {
            setError(err.message || "Error al rechazar la cuenta");
        } finally {
            setProcesandoId(null);
        }
    };

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-4" style={{ background: "#f8f9fa", minHeight: "100vh" }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="mb-1">Solicitudes de cuenta</h2>
                        <p className="text-muted mb-0">
                            Revisa y gestiona las solicitudes de registro pendientes
                        </p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={cargarPendientes}
                        disabled={cargando}
                    >
                        {cargando ? "Cargando..." : "Refrescar"}
                    </button>
                </div>

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
                ) : pendientes.length === 0 ? (
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
                                                <span className="badge bg-secondary">
                                                    {usuario.rol === "A" ? "Administrador" : usuario.rol}
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
                                                    onClick={() => handleRechazar(usuario)}
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
                )}
            </div>
        </div>
    );
}

export default Solicitudes;