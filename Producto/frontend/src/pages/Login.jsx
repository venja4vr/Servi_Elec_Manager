import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout" 

function Login(){
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        navigate("/home");
    }

    return(
        <AuthLayout>
            <div className="card shadow-sm rounded-4 p-4" style={{width: "420px"}}>
                <div className="text-center mb-4">
                    <h1 className="fw-bold">ServiElec Manager</h1>
                    <p className="text-muted mb-0">
                        Sistema de gestión de servicios eléctricos
                    </p>
                </div>

                <h2 className="h4 text-center mb-3">Iniciar sesion</h2>

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Correo</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="ejemplo@correo.com"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Contraseña</label>
                        <input
                        type="password"
                        className="form-control"
                        placeholder="Ingresa tu contraseña"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                        Ingresar
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
    )
}

export default Login;