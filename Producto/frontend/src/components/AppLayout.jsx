import { Children } from "react";
import Sidebar from "./Sidebar";

function AppLayout({ children }){
    return(
        <div className="d-flex">
            <Sidebar />

            <main
            className="flex-grow-1 p-4"
            style={{
                minHeight: "100vh",
                backgroundColor: "#F4F6F8",
            }}
            >
                {children}
            </main>
        </div>
    );
}

export default AppLayout;