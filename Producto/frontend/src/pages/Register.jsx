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

    // Errores por campo
    const [errorNombre, setErrorNombre] = useState("");
    const [errorCorreo, setErrorCorreo] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [errorConfirmar, setErrorConfirmar] = useState("");

    const [errorGeneral, setErrorGeneral] = useState("");
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);

    // ====== VALIDADORES ======
    const validarNombre = (valor) => {
        const v = valor.trim();
        if (!v) return "El nombre es obligatorio";
        if (v.length < 3) return "El nombre debe tener al menos 3 caracteres";
        if (v.length > 50) return "El nombre no puede superar 50 caracteres";
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

    // ====== HANDLERS DE BLUR ======
    const handleBlurNombre = () => setErrorNombre(validarNombre(nombre));
    const handleBlurCorreo = () => setErrorCorreo(validarCorreo(correo));
    const handleBlurPassword = () => {
        setErrorPassword(validarPassword(password));
        // Si ya escribió confirmar, revalida también
        if (confirmarPassword) {
            setErrorConfirmar(validarConfirmar(confirmarPassword, password));
        }
    };
    const handleBlurConfirmar = () => setErrorConfirmar(validarConfirmar(confirmarPassword));

    // ====== SUBMIT ======
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorGeneral("");

        // Validar todo
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
                <div className="card shadow-sm rounded-4 p-4" style={{ width: "420px" }}>
                    <div className="text-center mb-4">
                        <div className="mb-3" style={{ fontSize: "3rem" }}>✅</div>
                        <h2 className="fw-bold">¡Cuenta creada!</h2>
                    </div>
                    <div className="alert alert-info text-center" role="alert">
                        Tu cuenta fue registrada correctamente y está <strong>pendiente de aprobación</strong> por el administrador.
                        <br /><br />
                        Recibirás acceso al sistema una vez que tu cuenta sea aprobada.
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary w-100"
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
            <div className="card shadow-sm rounded-4 p-4" style={{ width: "420px" }}>
                <div className="text-center mb-4">
                    <h1 className="fw-bold">Crear cuenta</h1>
                    <p className="text-muted mb-0">
                        Registra un nuevo usuario en ServiElec Manager
                    </p>
                </div>

                {errorGeneral && (
                    <div className="alert alert-danger" role="alert">
                        {errorGeneral}
                    </div>
                )}

                <form onSubmit={handleRegister} noValidate>
                    <div className="mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            className={`form-control ${errorNombre ? "is-invalid" : ""}`}
                            placeholder="Ingresa tu nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={handleBlurNombre}
                            maxLength={50}
                        />
                        {errorNombre && (
                            <div className="invalid-feedback">{errorNombre}</div>
                        )}
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Correo</label>
                        <input
                            type="email"
                            className={`form-control ${errorCorreo ? "is-invalid" : ""}`}
                            placeholder="ejemplo@correo.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            onBlur={handleBlurCorreo}
                            maxLength={40}
                        />
                        {errorCorreo && (
                            <div className="invalid-feedback">{errorCorreo}</div>
                        )}
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className={`form-control ${errorPassword ? "is-invalid" : ""}`}
                            placeholder="Crea una contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={handleBlurPassword}
                        />
                        {errorPassword ? (
                            <div className="invalid-feedback">{errorPassword}</div>
                        ) : (
                            <small className="text-muted">
                                Mínimo 8 caracteres, con mayúscula, número y carácter especial.
                            </small>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Confirmar contraseña</label>
                        <input
                            type="password"
                            className={`form-control ${errorConfirmar ? "is-invalid" : ""}`}
                            placeholder="Repite la contraseña"
                            value={confirmarPassword}
                            onChange={(e) => setConfirmarPassword(e.target.value)}
                            onBlur={handleBlurConfirmar}
                        />
                        {errorConfirmar && (
                            <div className="invalid-feedback">{errorConfirmar}</div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={cargando}
                    >
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-muted mb-1">¿Ya tienes cuenta?</p>
                    <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => navigate("/")}
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Register;