import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { login } from "../services/api";

function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [tipoError, setTipoError] = useState("danger");
    const [cargando, setCargando] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
            await login(correo, password);
            navigate("/home");
        } catch (err) {
            const mensaje = err.message || "Error al iniciar sesión";

            // Si el mensaje contiene "pendiente de aprobación", mostrar como info
            if (mensaje.toLowerCase().includes("pendiente")) {
                setTipoError("warning");
            } else {
                setTipoError("danger");
            }

            setError(mensaje);
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthLayout>
            <div className="card shadow-sm rounded-4 p-4" style={{ width: "420px" }}>
                <div className="text-center mb-4">
                    <h1 className="fw-bold">ServiElec Manager</h1>
                    <p className="text-muted mb-0">
                        Sistema de gestión de servicios eléctricos
                    </p>
                </div>
                <h2 className="h4 text-center mb-3">Iniciar sesión</h2>

                {error && (
                    <div className={`alert alert-${tipoError}`} role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Correo</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="ejemplo@correo.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={cargando}
                    >
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-muted mb-1">¿No tienes cuenta?</p>
                    <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => navigate("/register")}
                    >
                        Crear cuenta
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Login;