import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { login } from "../services/api";

// Regex para validar formato de correo
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");

    // Errores por campo
    const [errorCorreo, setErrorCorreo] = useState("");
    const [errorPassword, setErrorPassword] = useState("");

    const [error, setError] = useState("");
    const [tipoError, setTipoError] = useState("danger");
    const [cargando, setCargando] = useState(false);

    // ====== VALIDADORES ======
    const validarCorreo = (valor) => {
        if (!valor.trim()) return "El correo es obligatorio";
        if (!REGEX_CORREO.test(valor)) return "Formato de correo inválido";
        return "";
    };

    const validarPassword = (valor) => {
        if (!valor) return "La contraseña es obligatoria";
        return "";
    };

    // ====== HANDLERS DE BLUR (al salir del campo) ======
    const handleBlurCorreo = () => setErrorCorreo(validarCorreo(correo));
    const handleBlurPassword = () => setErrorPassword(validarPassword(password));

    // ====== SUBMIT ======
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Validar todos los campos
        const errC = validarCorreo(correo);
        const errP = validarPassword(password);
        setErrorCorreo(errC);
        setErrorPassword(errP);

        if (errC || errP) return; // Si hay errores, no enviar

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

                <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3">
                        <label className="form-label">Correo</label>
                        <input
                            type="email"
                            className={`form-control ${errorCorreo ? "is-invalid" : ""}`}
                            placeholder="ejemplo@correo.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            onBlur={handleBlurCorreo}
                        />
                        {errorCorreo && (
                            <div className="invalid-feedback">{errorCorreo}</div>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className={`form-control ${errorPassword ? "is-invalid" : ""}`}
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={handleBlurPassword}
                        />
                        {errorPassword && (
                            <div className="invalid-feedback">{errorPassword}</div>
                        )}
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