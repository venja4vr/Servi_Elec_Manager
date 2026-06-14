// Configuración central de la API
// const API_URL = "http://98.95.225.248:8000";
const API_URL = "http://localhost:8000";

// Función helper para hacer peticiones autenticadas
export async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && endpoint !== "/auth/login") {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario_nombre");
            localStorage.removeItem("usuario_rol");
            localStorage.removeItem("usuario_id");
            window.location.href = "/login?expired=1";
            return;
        }

        const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
        const detail = error.detail;

        if (typeof detail === "object" && detail !== null) {
            const err = new Error(detail.mensaje || detail.resumen || "Error en la operación");
            err.faltantes = detail.faltantes;
            err.detalleCompleto = detail;
            throw err;
        }

        throw new Error(detail || `Error ${response.status}`);
    }

    return response.json();
}

// =============== AUTENTICACIÓN ===============

export async function login(correo, password) {
    const data = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo, password }),
    });
    // Guarda token y datos del usuario
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario_nombre", data.nombre);
    localStorage.setItem("usuario_rol", data.rol);
    localStorage.setItem("usuario_id", data.usuario_id);
    return data;
}

export async function register(nombre_usuario, correo, password) {
    return fetchAPI("/usuarios/", {
        method: "POST",
        body: JSON.stringify({ nombre_usuario, correo, password }),
    });
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_nombre");
    localStorage.removeItem("usuario_rol");
    localStorage.removeItem("usuario_id");
}

export function isAuthenticated() {
    return !!localStorage.getItem("token");
}

export function getUsuarioNombre() {
    return localStorage.getItem("usuario_nombre") || "Usuario";
}

export function getUsuarioRol() {
    return localStorage.getItem("usuario_rol") || "T";
}

export function getUsuarioId() {
    return localStorage.getItem("usuario_id") || null;
}

// =============== ENDPOINTS DE NEGOCIO ===============

export async function getProyectos(estado = "") {
    const endpoint = estado ? `/proyectos/?estado=${estado}` : "/proyectos/";
    return fetchAPI(endpoint);
}

export async function getAlertasProyectos(dias = 3) {
    return fetchAPI(`/proyectos/alertas?dias=${dias}`);
}

export async function getProyecto(id) {
    return fetchAPI(`/proyectos/${id}`);
}

export async function crearProyecto(data) {
    return fetchAPI("/proyectos/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function actualizarProyecto(id, data) {
    return fetchAPI(`/proyectos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function cambiarEstadoProyecto(id, nuevoEstado) {
    return fetchAPI(`/proyectos/${id}/estado?nuevo_estado=${nuevoEstado}`, {
        method: "PATCH",
    });
}

export async function eliminarProyecto(id) {
    return fetchAPI(`/proyectos/${id}`, {
        method: "DELETE",
    });
}

export async function getCategorias() {
    return fetchAPI("/categorias/");
}

export async function crearMaterialDesdeScraper(data) {
    return fetchAPI("/materiales/crear-desde-scraper", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMateriales() {
    return fetchAPI("/materiales/");
}

export async function getMaterial(id) {
    return fetchAPI(`/materiales/${id}`);
}

export async function crearMaterial(data) {
    return fetchAPI("/materiales/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function actualizarMaterial(id, data) {
    return fetchAPI(`/materiales/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function eliminarMaterial(id) {
    return fetchAPI(`/materiales/${id}`, {
        method: "DELETE",
    });
}

export async function getPlantillas() {
    return fetchAPI("/plantillas/");
}

export async function getPlantilla(id) {
    return fetchAPI(`/plantillas/${id}`);
}

export async function crearPlantilla(data) {
    return fetchAPI("/plantillas/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function actualizarPlantilla(id, data) {
    return fetchAPI(`/plantillas/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function eliminarPlantilla(id) {
    return fetchAPI(`/plantillas/${id}`, {
        method: "DELETE",
    });
}

export async function getMovimientos() {
    return fetchAPI("/movimientos/");
}

export async function getMovimientosPorProyecto(proyectoId) {
    return fetchAPI(`/movimientos/proyecto/${proyectoId}`);
}

export async function crearMovimiento(data) {
    return fetchAPI("/movimientos/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// =============== BUSCADOR DE PRECIOS ===============

export async function buscarPrecios(query = "", tienda = "") {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (tienda) params.append("tienda", tienda);

    const queryString = params.toString();
    const endpoint = queryString ? `/buscador/?${queryString}` : "/buscador/";

    return fetchAPI(endpoint);
}

// =============== PLANTILLAS - MATERIALES VINCULADOS ===============

export async function getMaterialesDePlantilla(plantillaId) {
    return fetchAPI(`/plantillas/${plantillaId}/materiales`);
}

// =============== PROYECTOS - CREAR CON MATERIALES ===============

export async function crearProyectoConMateriales(data) {
    return fetchAPI("/proyectos/con-materiales", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMaterialesPlaneadosDeProyecto(proyectoId) {
    return fetchAPI(`/proyectos/${proyectoId}/materiales`);
}

// =============== AJUSTAR STOCK (suma o resta) ===============

export async function ajustarStockMaterial(materialId, cantidad) {
    return fetchAPI(`/materiales/${materialId}/stock?cantidad=${cantidad}`, {
        method: "PATCH",
    });
}

// =============== PRECIOS SODIMAC ===============

export async function actualizarPrecioMaterial(materialId) {
    return fetchAPI(`/materiales/${materialId}/actualizar-precio`, {
        method: "POST",
    });
}

export async function actualizarTodosLosPrecios() {
    return fetchAPI("/materiales/actualizar-precios", {
        method: "POST",
    });
}

export async function guardarPrecioManual(materialId, precio) {
    return fetchAPI(`/materiales/${materialId}/precio-manual`, {
        method: "POST",
        body: JSON.stringify({ precio }),
    });
}

export async function getHistoricoPrecios(materialId, dias = 30) {
    return fetchAPI(`/materiales/${materialId}/historico-precios?dias=${dias}`);
}

export async function actualizarPreciosPlantillas() {
    return fetchAPI("/materiales/actualizar-precios-plantillas", {
        method: "POST",
    });
}

// =============== PDF DE PROYECTO ===============

async function _descargarBlob(url, filename) {
    const token = localStorage.getItem("token");
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
        throw new Error(`Error al generar el PDF (${response.status})`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
}

export async function descargarPdfProyecto(proyectoId) {
    await _descargarBlob(
        `${API_URL}/proyectos/${proyectoId}/pdf`,
        `proyecto_${proyectoId.substring(0, 8).toUpperCase()}.pdf`
    );
}

export async function descargarPdfClienteProyecto(proyectoId) {
    await _descargarBlob(
        `${API_URL}/proyectos/${proyectoId}/pdf-cliente`,
        `proyecto_cliente_${proyectoId.substring(0, 8).toUpperCase()}.pdf`
    );
}

// =============== MATERIALES DE UN PROYECTO (edición en vivo) ===============

export async function agregarMaterialProyecto(proyectoId, payload) {
    // payload: { material_id, cantidad, externo } | { nombre_externo, precio_externo, cantidad }
    return fetchAPI(`/proyectos/${proyectoId}/materiales`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function actualizarCantidadMaterial(proyectoId, idPm, cantidad, ajustarStock) {
    return fetchAPI(`/proyectos/${proyectoId}/materiales/${idPm}`, {
        method: "PUT",
        body: JSON.stringify({ cantidad, ajustar_stock: ajustarStock }),
    });
}

export async function quitarMaterialProyecto(proyectoId, idPm, devolverStock) {
    return fetchAPI(
        `/proyectos/${proyectoId}/materiales/${idPm}?devolver_stock=${devolverStock}`,
        { method: "DELETE" }
    );
}

// =============== VERIFICACIÓN DE CONTRASEÑA ===============

export async function verificarPassword(password) {
    return fetchAPI("/auth/verify-password", {
        method: "POST",
        body: JSON.stringify({ password }),
    });
}

// =============== APROBACIÓN DE CUENTAS (SOLO SUPERADMIN) ===============

export async function getUsuariosPendientes() {
    return fetchAPI("/usuarios/pendientes");
}

export async function getUsuariosActivos() {
    return fetchAPI("/usuarios/activos");
}

export async function aprobarUsuario(usuarioId) {
    return fetchAPI(`/usuarios/${usuarioId}/aprobar`, {
        method: "PATCH",
    });
}

export async function rechazarUsuario(usuarioId) {
    return fetchAPI(`/usuarios/${usuarioId}`, {
        method: "DELETE",
    });
}

// =============== COSTOS DE PROYECTO ===============

export async function getComunaGrupos() {
    return fetchAPI("/comuna-grupos/");
}

export async function getCostosProyecto(proyectoId) {
    return fetchAPI(`/proyectos/${proyectoId}/costos`);
}

export async function actualizarCostosProyecto(proyectoId, data) {
    return fetchAPI(`/proyectos/${proyectoId}/costos`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function recalcularCostosProyecto(proyectoId) {
    return fetchAPI(`/proyectos/${proyectoId}/recalcular-costos`, {
        method: "POST",
    });
}