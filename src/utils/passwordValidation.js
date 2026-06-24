const sequences = [
    "0123456789",
    "9876543210",
    "abcdefghijklmnopqrstuvwxyz",
    "zyxwvutsrqponmlkjihgfedcba",
    "qwertyuiop",
    "poiuytrewq",
]

const normalize = (value = "") =>
    String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

const hasSequence = (password) => {
    const value = normalize(password)
    return sequences.some((sequence) => {
        for (let index = 0; index <= sequence.length - 4; index += 1) {
            if (value.includes(sequence.slice(index, index + 4))) return true
        }
        return false
    })
}

export const validateStrongPassword = (password = "") => {
    if (password.length < 12) return "La contraseña debe tener al menos 12 caracteres"
    if (password.length > 72) return "La contraseña no puede superar 72 caracteres"
    if (/\s/.test(password)) return "La contraseña no puede tener espacios"
    if (!/[A-Z]/.test(password)) return "Debe tener al menos una mayúscula"
    if (!/[a-z]/.test(password)) return "Debe tener al menos una minúscula"
    if (!/[0-9]/.test(password)) return "Debe tener al menos un número"
    if (!/[!@#$%^&*._-]/.test(password)) return "Debe tener al menos un símbolo: ! @ # $ % ^ & * . _ -"
    if (/[^A-Za-z0-9!@#$%^&*._-]/.test(password)) return "Usa solo letras, números y estos símbolos: ! @ # $ % ^ & * . _ -"
    if (/(.)\1{2,}/.test(password)) return "No uses el mismo carácter 3 veces seguidas"
    if (hasSequence(password)) return "No uses secuencias como 1234, abcd o qwerty"
    return null
}

export const passwordRequirements = [
    "Mín. 12 caracteres",
    "1 mayúscula",
    "1 minúscula",
    "1 número",
    "1 símbolo permitido",
    "Sin espacios ni secuencias",
]
