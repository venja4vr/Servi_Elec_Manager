import { BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Proyectos from "../pages/Proyectos";
import NuevoProyecto from "../pages/NuevoProyecto";
import DetalleProyecto from "../pages/DetalleProyecto";
import Buscador from "../pages/Buscador";
import RecursosPendientes from "../pages/RecursosPendientes";
import Inventario from "../pages/Inventario";
import AgregarProducto from "../pages/AgregarProducto";
import Solicitudes from "../pages/Solicitudes";


function AppRoutes(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/proyectos" element={<Proyectos />} />
                <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
                <Route path="/proyectos/:id" element={<DetalleProyecto />} />
                <Route path="/buscador" element={<Buscador />} />
                <Route path="/recursos-pendientes" element={<RecursosPendientes />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/agregar-producto" element={<AgregarProducto />} />
                <Route path="/solicitudes" element={<Solicitudes />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;