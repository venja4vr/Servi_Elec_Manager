import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

function Register(){
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();

        // De momento es una simulación, todavia no se guarda en la base de datos, proximamente se modifica para la incorporacioó de la BD
        navigate("/");
    };

    return (
        <AuthLayout>
            <div className="card shadow-sw rounded-4 p-4" style={{ width: "420px" }}>
                <div className="text-center mb-4">
                    <h1 className="fw-bold">Crear cuenta</h1>
                    <p className="text-muted mb-0">
                        Registra un nuevo usuario en ServiElec Manager
                    </p>
                </div>

                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                        type="text"
                        className="form-control"
                        placeholder="Ingresa tu nombre"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Correo</label>
                        <input 
                        type="email"
                        className="form-control"
                        placeholder="ejemplo@correo.com"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <input
                        type="password"
                        className="form-control"
                        placeholder="Crea una contraseña"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Confirmar contraseña</label>
                        <input
                        type="password"
                        className="form-control"
                        placeholder="Repite la contraseña"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                        Crear cuenta
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-muted mb-1">¿Ya tienes cuenta?</p>
                    <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => navigate("/")}
                    >
                        Iniciar Sesion
                    </button>
                </div>
            </div>
        </AuthLayout>
    )
}

export default Register;