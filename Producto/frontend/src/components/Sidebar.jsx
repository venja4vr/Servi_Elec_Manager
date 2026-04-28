import { useNavigate } from "react-router-dom";

function Sidebar(){
    const navigate = useNavigate();

    return(
        <div 
        className="d-flex flex-column p-3 text-white"
        style={{
            width: "250px",
            height: "100vh",
            background: "#1E293B",
        }}
        >
            <h4 className="mb-4">ServiElec</h4>

            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <button
                    className="nav-link text-white bg-primary mb-2"
                    onClick={() => navigate("/home")}
                    >
                        Home
                    </button>
                    </li>
                    
                    <li>
                        <button className="nav-link text-white mb-2">
                            Buscador
                        </button>
                    </li>

                    <li>
                        <button className="nav-link text-white mb-2">
                            Proyectos
                        </button>
                    </li>
            </ul>


            <hr />
            
            <button
            className="btn btn-danger"
            onClick={() => navigate("/")}
            >
                Cerrar Sesion
            </button>
        </div>
    );
}

export default Sidebar;