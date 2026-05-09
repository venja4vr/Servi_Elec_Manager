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
    // Guarda el token automáticamente
    localStorage.setItem("token", data.access_token);
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
}

export function isAuthenticated() {
    return !!localStorage.getItem("token");
}

// =============== ENDPOINTS DE NEGOCIO (para usar después) ===============

export async function getProyectos() {
    return fetchAPI("/proyectos/");
}

export async function getCategorias() {
    return fetchAPI("/categorias/");
}

export async function getMateriales() {
    return fetchAPI("/materiales/");
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