import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import { contadorNoLeidas, getNotificaciones } from "../services/api";

function AppLayout({ children }) {
    const [toasts, setToasts] = useState([]);
    const ultimoContadorRef = useRef(null);

    const quitarToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        let mounted = true;

        const verificarNotificaciones = async () => {
            try {
                const { total } = await contadorNoLeidas();
                if (ultimoContadorRef.current !== null && total > ultimoContadorRef.current) {
                    const nuevas = await getNotificaciones(true);
                    const recientes = nuevas.slice(0, total - ultimoContadorRef.current);
                    if (mounted) {
                        setToasts((prev) => [
                            ...prev,
                            ...recientes.map((n) => ({ id: n.id_notificacion, titulo: n.titulo, mensaje: n.mensaje })),
                        ]);
                    }
                }
                if (mounted) ultimoContadorRef.current = total;
            } catch {
                // silencioso hasta que el backend esté listo
            }
        };

        verificarNotificaciones();
        const intervalo = setInterval(verificarNotificaciones, 30000);
        return () => {
            mounted = false;
            clearInterval(intervalo);
        };
    }, []);

    return (
        <div className="d-flex">
            <Sidebar />

            <main
                className="flex-grow-1 p-4"
                style={{ minHeight: "100vh", backgroundColor: "#F4F6F8" }}
            >
                {children}
            </main>

            <div className="toast-container">
                {toasts.map((t) => (
                    <Toast
                        key={t.id}
                        titulo={t.titulo}
                        mensaje={t.mensaje}
                        onClose={() => quitarToast(t.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default AppLayout;
