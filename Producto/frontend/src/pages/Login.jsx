import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

function Login() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        navigate("/home");
    };

    return (
        <AuthLayout>
            <div className="auth-card">  
                <h2>Iniciar sesión</h2>
                <p className="auth-subtitle">Ingresa tus credenciales para continuar</p>

                <form onSubmit={handleLogin}>
                    <div className="auth-field">
                    <label>Correo</label>
            <div className="auth-input-group">
                <input 
                type="email" 
                placeholder="ejemplo@correo.com"
                maxLength={80}
                />
            </div>
            </div>

            <div className="auth-field">
            <label>Contraseña</label>
            <div className="auth-input-group">
                <input type="password" 
                placeholder="Ingresa tu contraseña"
                maxLength={30}
                />
            </div>
            </div>

            <label className="remember-row">
            <input type="checkbox" />
            Recuérdame
            </label>

            <button type="submit" className="auth-main-btn">
            Ingresar
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