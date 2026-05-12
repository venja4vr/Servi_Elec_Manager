// Configuración central de la API
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
        const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(error.detail || `Error ${response.status}`);
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

export async function register(nombre_usuario, correo, password, rol = "A") {
    return fetchAPI("/usuarios/", {
        method: "POST",
        body: JSON.stringify({ nombre_usuario, correo, password, rol }),
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