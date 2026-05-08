import { BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Proyectos from "../pages/Proyectos";
import Buscador from "../pages/Buscador";
import RecursosPendientes from "../pages/RecursosPendientes";


function AppRoutes(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/proyectos" element={<Proyectos />} />
                <Route path="/buscador" element={<Buscador />} />
                <Route path="/recursos-pendientes" element={<RecursosPendientes />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;