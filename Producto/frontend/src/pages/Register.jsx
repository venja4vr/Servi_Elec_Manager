import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { register } from "../services/api";

function Register() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");
    const [error, setError] = useState("");
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmarPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setCargando(true);

        try {
            await register(nombre, correo, password);
            setExito(true);
        } catch (err) {
            setError(err.message || "Error al crear la cuenta");
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

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ingresa tu nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>
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
                    <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Crea una contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Confirmar contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Repite la contraseña"
                            value={confirmarPassword}
                            onChange={(e) => setConfirmarPassword(e.target.value)}
                            required
                        />
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