import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h2>Crear cuenta</h2>
        <p className="auth-subtitle">
          Registra un nuevo usuario en ServiElec Manager
        </p>

        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Nombre</label>
            <div className="auth-input-group">
              <input type="text" 
              placeholder="Ingresa tu nombre"
              maxLength={80} />
            </div>
          </div>

          <div className="auth-field">
            <label>Correo</label>
            <div className="auth-input-group">
              <input type="email" 
              placeholder="ejemplo@correo.com"
              maxLength={80} />
            </div>
          </div>

          <div className="auth-field">
            <label>Contraseña</label>
            <div className="auth-input-group">
              <input type="password"
              placeholder="Crea una contraseña"
              maxLength={40} />
            </div>
          </div>

          <div className="auth-field">
            <label>Confirmar contraseña</label>
            <div className="auth-input-group">
              <input type="password" 
              placeholder="Repite la contraseña"
              maxLength={40} />
            </div>
          </div>

          <button type="submit" className="auth-main-btn">
            Crear cuenta
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