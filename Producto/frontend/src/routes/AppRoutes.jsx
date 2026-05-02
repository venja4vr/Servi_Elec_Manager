import { BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Proyectos from "../pages/Proyectos";


function AppRoutes(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/proyectos" element={<Proyectos />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;