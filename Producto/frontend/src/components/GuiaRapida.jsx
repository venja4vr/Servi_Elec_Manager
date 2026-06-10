import { useState } from "react";

const SECCIONES = [
    {
        icono: "⌂",
        nombre: "Home",
        descripcion: "Panel principal con estadísticas, proyectos recientes y notificaciones.",
    },
    {
        icono: "▣",
        nombre: "Proyectos",
        descripcion: "Lista todos los proyectos por estado. Crea, edita, cambia estado y descarga PDFs.",
    },
    {
        icono: "☰",
        nombre: "Plantillas",
        descripcion: "Plantillas de servicios que el bot ofrece a clientes. Crea, edita o desactiva. Asigna materiales con cantidades.",
    },
    {
        icono: "◈",
        nombre: "Inventario",
        descripcion: "Materiales en stock con precio interno y precio Sodimac actualizado. Link al histórico de precios por material.",
    },
    {
        icono: "⇄",
        nombre: "Comparador",
        descripcion: "Busca precios reales en Sodimac, ve histórico de precios de los últimos 30 días con gráfico y actualiza precios manualmente.",
    },
    {
        icono: "✓",
        nombre: "Solicitudes",
        descripcion: "Aprobar o rechazar nuevos registros de usuarios. Solo SuperAdmin.",
    },
    {
        icono: "⌛",
        nombre: "Recursos Pendientes",
        descripcion: "Materiales pendientes de reposición o por asignar a proyectos.",
    },
    {
        icono: "+",
        nombre: "Agregar Producto",
        descripcion: "Formulario para sumar materiales nuevos al inventario.",
    },
];

function GuiaRapida() {
    const [abierto, setAbierto] = useState(false);

    const abrir = () => setAbierto(true);
    const cerrar = () => setAbierto(false);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) cerrar();
    };

    return (
        <>
            <button className="guia-trigger" onClick={abrir}>
                Guía rápida
            </button>

            {abierto && (
                <div className="guia-overlay" onClick={handleOverlayClick}>
                    <div className="guia-modal">
                        <div className="guia-modal-header">
                            <div>
                                <h4>Guía rápida de Servi Elec Manager</h4>
                                <p>Conoce las secciones disponibles en el sistema.</p>
                            </div>
                            <button className="guia-close" onClick={cerrar}>✕</button>
                        </div>

                        <div className="guia-modal-body">
                            {SECCIONES.map((sec) => (
                                <div key={sec.nombre} className="guia-item">
                                    <div className="guia-item-icon">{sec.icono}</div>
                                    <div className="guia-item-texto">
                                        <strong>{sec.nombre}</strong>
                                        <p>{sec.descripcion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default GuiaRapida;
