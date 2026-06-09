import { useState, useEffect } from "react";

function ConfirmarPasswordModal({
    mostrar,
    titulo,
    mensaje,
    textoBoton = "Confirmar",
    onConfirmar,
    onCancelar,
}) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mostrar) {
            setPassword("");
            setError("");
        }
    }, [mostrar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!password) {
            setError("Debes ingresar tu contraseña");
            return;
        }

        setLoading(true);

        // 🔥 SIMULACIÓN (sin backend por ahora)
        setTimeout(() => {
            setLoading(false);

            // aquí luego conectas API real
            const fakePassword = "1234";

            if (password === fakePassword) {
                onConfirmar();
            } else {
                setError("Contraseña incorrecta");
            }
        }, 600);
    };

    if (!mostrar) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="detail-card modal-card">

                    <div className="modal-header-custom">
                        <h2>{titulo}</h2>
                        <button className="close-btn" onClick={onCancelar}>
                            ✕
                        </button>
                    </div>

                    <p className="modal-text">{mensaje}</p>

                    <div className="info-box">
                        Ingresa tu contraseña para confirmar la acción.
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-field">
                            <label>Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        {error && <div className="error-box">{error}</div>}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={onCancelar}
                                disabled={loading}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={loading}
                            >
                                {loading ? "Verificando..." : textoBoton}
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </div>
    );
}

export default ConfirmarPasswordModal;