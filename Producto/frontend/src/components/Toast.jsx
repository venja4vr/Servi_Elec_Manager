import { useEffect } from "react";

function Toast({ mensaje, titulo, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className="toast-notificacion">
            <div className="toast-body">
                <strong className="toast-titulo">{titulo}</strong>
                <span className="toast-mensaje">{mensaje}</span>
            </div>
            <button className="toast-cerrar" onClick={onClose}>x</button>
        </div>
    );
}

export default Toast;
