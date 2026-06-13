import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { login } from "../services/api";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sesionExpirada = searchParams.get("expired") === "1";

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");

    const [errorCorreo, setErrorCorreo] = useState("");
    const [errorPassword, setErrorPassword] = useState("");

    const [error, setError] = useState("");
    const [tipoError, setTipoError] = useState("danger");
    const [cargando, setCargando] = useState(false);

    const validarCorreo = (valor) => {
        if (!valor.trim()) return "El correo es obligatorio";
        if (!REGEX_CORREO.test(valor)) return "Formato de correo inválido";
        return "";
    };

    const validarPassword = (valor) => {
        if (!valor) return "La contraseña es obligatoria";
        return "";
    };

    const handleBlurCorreo = () => setErrorCorreo(validarCorreo(correo));
    const handleBlurPassword = () => setErrorPassword(validarPassword(password));

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const errC = validarCorreo(correo);
        const errP = validarPassword(password);
        setErrorCorreo(errC);
        setErrorPassword(errP);

        if (errC || errP) return;

        setCargando(true);

        try {
            await login(correo, password);
            navigate("/home");
        } catch (err) {
            const mensaje = err.message || "Error al iniciar sesión";
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
            <div className="auth-card">
                <h2>Iniciar sesión</h2>
                <p className="auth-subtitle">Ingresa tus credenciales para continuar</p>

                {sesionExpirada && (
                    <div className="alert alert-warning" role="alert">
                        Tu cuenta fue eliminada o tu sesión expiró. Inicia sesión nuevamente.
                    </div>
                )}

                {error && (
                    <div className={`alert alert-${tipoError}`} role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} noValidate>
                    <div className="auth-field">
                        <label>Correo</label>
                        <div className="auth-input-group">
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                maxLength={40}
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                onBlur={handleBlurCorreo}
                                className={errorCorreo ? "is-invalid" : ""}
                            />
                        </div>
                        {errorCorreo && (
                            <small className="auth-error">{errorCorreo}</small>
                        )}
                    </div>

                    <div className="auth-field">
                        <label>Contraseña</label>
                        <div className="auth-input-group">
                            <input
                                type="password"
                                placeholder="Ingresa tu contraseña"
                                maxLength={30}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={handleBlurPassword}
                                className={errorPassword ? "is-invalid" : ""}
                            />
                        </div>
                        {errorPassword && (
                            <small className="auth-error">{errorPassword}</small>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-main-btn"
                        disabled={cargando}
                    >
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>¿No tienes cuenta?</span>
                    <button type="button" onClick={() => navigate("/register")}>
                        Crear cuenta
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Login;