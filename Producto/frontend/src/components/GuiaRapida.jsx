function GuiaRapida({ titulo, descripcion }) {
    return (
        <div className="guia-rapida">
            <span className="guia-trigger">
                Guía rápida
            </span>

        <div className="guia-tooltip">
            <h4>{titulo}</h4>
            <p>{descripcion}</p>
        </div>
        </div>
    );
}

export default GuiaRapida;