import { useState, useEffect } from "react";
import { verificarPassword } from "../services/api";

/**
 * Modal de confirmación de contraseña antes de ejecutar acciones críticas.
 *
 * Props:
 * - mostrar: boolean - si el modal está visible
 * - titulo: string - título del modal (ej: "Confirmar eliminación")
 * - mensaje: string - descripción de la acción que se va a ejecutar
 * - colorBoton: string - clase Bootstrap del botón confirmar (ej: "btn-danger")
 * - textoBoton: string - texto del botón confirmar (ej: "Eliminar")
 * - onConfirmar: function - se ejecuta cuando la contraseña es correcta
 * - onCancelar: function - se ejecuta al cerrar el modal
 */
function ConfirmarPasswordModal({
    mostrar,
    titulo,
    mensaje,
    colorBoton = "btn-primary",
    textoBoton = "Confirmar",
    onConfirmar,
    onCancelar,
}) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [verificando, setVerificando] = useState(false);

    useEffect(() => {
        if (mostrar) {
            setPassword("");
            setError("");
        }
    }, [mostrar]);

    const handleConfirmar = async (e) => {
        e.preventDefault();
        setError("");

        if (!password) {
            setError("Debes ingresar tu contraseña");
            return;
        }

        setVerificando(true);
        try {
            await verificarPassword(password);
            // Contraseña correcta → ejecutar la acción
            onConfirmar();
        } catch (err) {
            setError(err.message || "Contraseña incorrecta");
        } finally {
            setVerificando(false);
        }
    };

    if (!mostrar) return null;

    return (
        <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{titulo}</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onCancelar}
                            disabled={verificando}
                        ></button>
                    </div>
                    <form onSubmit={handleConfirmar}>
                        <div className="modal-body">
                            <p>{mensaje}</p>

                            <div className="alert alert-info small">
                                Por seguridad, debes ingresar tu contraseña para confirmar esta acción.
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Tu contraseña</label>
                                <input
                                    type="password"
                                    className={`form-control ${error && !password ? "is-invalid" : ""}`}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); if (e.target.value) setError(""); }}
                                    onBlur={() => { if (!password) setError("Debes ingresar tu contraseña"); }}
                                    autoFocus
                                    disabled={verificando}
                                />
                            </div>

                            {error && (
                                <div className="alert alert-danger mb-0 small">
                                    {error}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={onCancelar}
                                disabled={verificando}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`btn ${colorBoton}`}
                                disabled={verificando}
                            >
                                {verificando ? "Verificando..." : textoBoton}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ConfirmarPasswordModal;