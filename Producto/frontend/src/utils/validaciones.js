// Funciones validadoras reutilizables para formularios.
// Cada función recibe un valor y devuelve "" si es válido, o el mensaje de error.

// Regex comunes
export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REGEX_MAYUSCULA = /[A-Z]/;
export const REGEX_NUMERO = /[0-9]/;
export const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]`~';]/;
export const REGEX_SOLO_DIGITOS = /^[0-9]+$/;
export const REGEX_NUMERO_2_DECIMALES = /^\d+(\.\d{1,2})?$/;

// =============== TEXTO ===============
export function validarTexto(valor, { minimo = 3, maximo = 50, etiqueta = "Este campo" } = {}) {
    const v = String(valor || "").trim();
    if (!v) return `${etiqueta} es obligatorio`;
    if (v.length < minimo) return `${etiqueta} debe tener al menos ${minimo} caracteres`;
    if (v.length > maximo) return `${etiqueta} no puede superar ${maximo} caracteres`;
    return "";
}

// =============== TEXTO OPCIONAL (solo valida longitud máxima si hay valor) ===============
export function validarTextoOpcional(valor, { maximo = 250, etiqueta = "Este campo" } = {}) {
    const v = String(valor || "").trim();
    if (!v) return "";
    if (v.length > maximo) return `${etiqueta} no puede superar ${maximo} caracteres`;
    return "";
}

// =============== CORREO ===============
export function validarCorreo(valor) {
    const v = String(valor || "").trim();
    if (!v) return "El correo es obligatorio";
    if (v.length > 40) return "El correo no puede superar 40 caracteres";
    if (!REGEX_CORREO.test(v)) return "Formato de correo inválido";
    return "";
}

// =============== PASSWORD ===============
export function validarPasswordFuerte(valor) {
    if (!valor) return "La contraseña es obligatoria";
    if (valor.length < 8) return "Debe tener al menos 8 caracteres";
    if (!REGEX_MAYUSCULA.test(valor)) return "Debe incluir al menos una mayúscula";
    if (!REGEX_NUMERO.test(valor)) return "Debe incluir al menos un número";
    if (!REGEX_ESPECIAL.test(valor)) return "Debe incluir al menos un carácter especial";
    return "";
}

// =============== NÚMEROS ===============
export function validarEnteroPositivo(valor, { etiqueta = "Este campo" } = {}) {
    if (valor === "" || valor === null || valor === undefined) {
        return `${etiqueta} es obligatorio`;
    }
    const n = Number(valor);
    if (Number.isNaN(n)) return `${etiqueta} debe ser un número válido`;
    if (!Number.isInteger(n)) return `${etiqueta} debe ser un número entero`;
    if (n < 0) return `${etiqueta} no puede ser negativo`;
    return "";
}

export function validarPrecio(valor, { etiqueta = "Precio" } = {}) {
    if (valor === "" || valor === null || valor === undefined) {
        return `${etiqueta} es obligatorio`;
    }
    const str = String(valor);
    if (!REGEX_NUMERO_2_DECIMALES.test(str)) {
        return `${etiqueta} debe ser un número con máximo 2 decimales`;
    }
    const n = Number(str);
    if (n < 0) return `${etiqueta} no puede ser negativo`;
    return "";
}

// =============== TELÉFONO ===============
// Acepta: +56 9 XXXX XXXX | +5691234 5678 | 569XXXXXXXX | 9XXXXXXXX
export function validarTelefono(valor, { obligatorio = true } = {}) {
    const v = String(valor || "").trim();
    if (!v) {
        return obligatorio ? "El teléfono es obligatorio" : "";
    }
    // Normalizar: quitar +, espacios, guiones, paréntesis
    const normalizado = v.replace(/[\s+\-()]/g, "");
    if (!/^\d+$/.test(normalizado)) {
        return "El teléfono solo puede contener dígitos, +, espacios o guiones";
    }
    // Aceptar: 569XXXXXXXX (11 dígitos) o 9XXXXXXXX (9 dígitos)
    if (/^569\d{8}$/.test(normalizado) || /^9\d{8}$/.test(normalizado)) {
        return "";
    }
    return "Formato inválido. Use +56 9 XXXX XXXX o 9 XXXX XXXX";
}

// =============== SELECT ===============
export function validarSeleccion(valor, etiqueta = "Este campo") {
    if (!valor) return `Debes seleccionar ${etiqueta.toLowerCase()}`;
    return "";
}