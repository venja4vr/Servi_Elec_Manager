import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/api";

//este es im componente envoltorio que revisa si hay token
//si no hay redirige a / (login)
//si hay token sigue normal

function ProtectedRoute({ children }) {
    if (!isAuthenticated()) {
        //el replace evita que el usuario pueda volver atras del navegador
        //a una ruta protegida
        return <Navigate to="/" replace />; 
    }
    return children;
}

export default ProtectedRoute;