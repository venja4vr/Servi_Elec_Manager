import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { register } from "../services/api";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_MAYUSCULA = /[A-Z]/;
const REGEX_NUMERO = /[0-9]/;
const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]`~';]/;

function Register() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");

    const [errorNombre, setErrorNombre] = useState("");
    const [errorCorreo, setErrorCorreo] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [errorConfirmar, setErrorConfirmar] = useState("");

    const [errorGeneral, setErrorGeneral] = useState("");
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);

    const validarNombre = (valor) => {
        const v = valor.trim();
        if (!v) return "El nombre es obligatorio";
        if (v.length < 3) return "El nombre debe tener al menos 3 caracteres";
        if (v.length > 80) return "El nombre no puede superar 80 caracteres";
        return "";
    };

    const validarCorreo = (valor) => {
        if (!valor.trim()) return "El correo es obligatorio";
        if (valor.length > 40) return "El correo no puede superar 40 caracteres";
        if (!REGEX_CORREO.test(valor)) return "Formato de correo inválido";
        return "";
    };

    const validarPassword = (valor) => {
        if (!valor) return "La contraseña es obligatoria";
        if (valor.length < 8) return "Debe tener al menos 8 caracteres";
        if (!REGEX_MAYUSCULA.test(valor)) return "Debe incluir al menos una mayúscula";
        if (!REGEX_NUMERO.test(valor)) return "Debe incluir al menos un número";
        if (!REGEX_ESPECIAL.test(valor)) return "Debe incluir al menos un carácter especial";
        return "";
    };

    const validarConfirmar = (valor, pass = password) => {
        if (!valor) return "Debes confirmar la contraseña";
        if (valor !== pass) return "Las contraseñas no coinciden";
        return "";
    };

    const handleBlurNombre = () => setErrorNombre(validarNombre(nombre));
    const handleBlurCorreo = () => setErrorCorreo(validarCorreo(correo));
    const handleBlurPassword = () => {
        setErrorPassword(validarPassword(password));
        if (confirmarPassword) {
            setErrorConfirmar(validarConfirmar(confirmarPassword, password));
        }
    };
    const handleBlurConfirmar = () => setErrorConfirmar(validarConfirmar(confirmarPassword));

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorGeneral("");

        const errN = validarNombre(nombre);
        const errC = validarCorreo(correo);
        const errP = validarPassword(password);
        const errCF = validarConfirmar(confirmarPassword);
        setErrorNombre(errN);
        setErrorCorreo(errC);
        setErrorPassword(errP);
        setErrorConfirmar(errCF);

        if (errN || errC || errP || errCF) return;

        setCargando(true);

        try {
            await register(nombre.trim(), correo.trim(), password);
            setExito(true);
        } catch (err) {
            setErrorGeneral(err.message || "Error al crear la cuenta");
        } finally {
            setCargando(false);
        }
    };

    if (exito) {
        return (
            <AuthLayout>
                <div className="auth-card">
                    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✅</div>
                        <h2>¡Cuenta creada!</h2>
                    </div>
                    <div className="alert alert-info" role="alert" style={{ textAlign: "center" }}>
                        Tu cuenta fue registrada correctamente y está <strong>pendiente de aprobación</strong> por el administrador.
                        <br /><br />
                        Recibirás acceso al sistema una vez que tu cuenta sea aprobada.
                    </div>
                    <button
                        type="button"
                        className="auth-main-btn"
                        onClick={() => navigate("/")}
                    >
                        Volver al login
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="auth-card">
                <h2>Crear cuenta</h2>
                <p className="auth-subtitle">
                    Registra un nuevo usuario en ServiElec Manager
                </p>

                {errorGeneral && (
                    <div className="alert alert-danger" role="alert">
                        {errorGeneral}
                    </div>
                )}

                <form onSubmit={handleRegister} noValidate>
                    <div className="auth-field">
                        <label>Nombre</label>
                        <div className="auth-input-group">
                            <input
                                type="text"
                                placeholder="Ingresa tu nombre"
                                maxLength={80}
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                onBlur={handleBlurNombre}
                                className={errorNombre ? "is-invalid" : ""}
                            />
                        </div>
                        {errorNombre && (
                            <small className="auth-error">{errorNombre}</small>
                        )}
                    </div>

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
                                placeholder="Crea una contraseña"
                                maxLength={40}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={handleBlurPassword}
                                className={errorPassword ? "is-invalid" : ""}
                            />
                        </div>
                        {errorPassword ? (
                            <small className="auth-error">{errorPassword}</small>
                        ) : (
                            <small className="auth-hint">
                                Mínimo 8 caracteres, con mayúscula, número y carácter especial.
                            </small>
                        )}
                    </div>

                    <div className="auth-field">
                        <label>Confirmar contraseña</label>
                        <div className="auth-input-group">
                            <input
                                type="password"
                                placeholder="Repite la contraseña"
                                maxLength={40}
                                value={confirmarPassword}
                                onChange={(e) => setConfirmarPassword(e.target.value)}
                                onBlur={handleBlurConfirmar}
                                className={errorConfirmar ? "is-invalid" : ""}
                            />
                        </div>
                        {errorConfirmar && (
                            <small className="auth-error">{errorConfirmar}</small>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-main-btn"
                        disabled={cargando}
                    >
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>¿Ya tienes cuenta?</span>
                    <button type="button" onClick={() => navigate("/")}>
                        Iniciar sesión
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Register;