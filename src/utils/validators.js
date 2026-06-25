// ============================================================
// FacturaFlow AAA — Validadores de formularios
// ============================================================

/**
 * Resultado de validación.
 * @typedef {{ valid: boolean, message?: string }} ValidationResult
 */

/**
 * Valida que un campo no esté vacío.
 * @param {*} value — Valor a validar
 * @param {string} fieldName — Nombre del campo para el mensaje de error
 * @returns {ValidationResult}
 */
export function required(value, fieldName = 'Este campo') {
  if (value === null || value === undefined || String(value).trim() === '') {
    return { valid: false, message: `${fieldName} es obligatorio` }
  }
  return { valid: true }
}

/**
 * Valida formato de correo electrónico.
 * @param {string} email
 * @returns {ValidationResult}
 */
export function validateEmail(email) {
  if (!email || String(email).trim() === '') {
    return { valid: false, message: 'El correo electrónico es obligatorio' }
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'El correo electrónico no es válido' }
  }

  return { valid: true }
}

/**
 * Valida un RFC mexicano (persona física o moral).
 * Acepta formatos: XAXX010101000, ABC123456789, etc.
 * @param {string} rfc
 * @returns {ValidationResult}
 */
export function validateTaxId(rfc) {
  if (!rfc || String(rfc).trim() === '') {
    return { valid: false, message: 'El RFC es obligatorio' }
  }

  const trimmed = rfc.trim().toUpperCase()
  const rfcRegex = /^[A-Z&Ñ]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2,3}$/

  if (!rfcRegex.test(trimmed)) {
    return { valid: false, message: 'El RFC no es válido. Formato esperado: XAXX010101XXX' }
  }

  if (trimmed.length < 12 || trimmed.length > 13) {
    return { valid: false, message: 'El RFC debe tener 12 (moral) o 13 (física) caracteres' }
  }

  return { valid: true }
}

/**
 * Valida un número de teléfono.
 * Acepta entre 7 y 15 dígitos (formatos nacionales e internacionales).
 * @param {string} phone
 * @returns {ValidationResult}
 */
export function validatePhone(phone) {
  if (!phone || String(phone).trim() === '') {
    return { valid: false, message: 'El teléfono es obligatorio' }
  }

  const digits = phone.replace(/[\s\-\(\)\+]/g, '')

  if (!/^\d+$/.test(digits)) {
    return { valid: false, message: 'El teléfono solo debe contener números' }
  }

  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, message: 'El teléfono debe tener entre 7 y 15 dígitos' }
  }

  return { valid: true }
}

/**
 * Valida longitud mínima de un texto.
 * @param {string} value
 * @param {number} min — Longitud mínima
 * @param {string} fieldName
 * @returns {ValidationResult}
 */
export function minLength(value, min, fieldName = 'Este campo') {
  if (!value || String(value).length < min) {
    return { valid: false, message: `${fieldName} debe tener al menos ${min} caracteres` }
  }
  return { valid: true }
}

/**
 * Valida longitud máxima de un texto.
 * @param {string} value
 * @param {number} max — Longitud máxima
 * @param {string} fieldName
 * @returns {ValidationResult}
 */
export function maxLength(value, max, fieldName = 'Este campo') {
  if (value && String(value).length > max) {
    return { valid: false, message: `${fieldName} no debe exceder ${max} caracteres` }
  }
  return { valid: true }
}

/**
 * Valida que un valor sea numérico.
 * @param {*} value
 * @param {string} fieldName
 * @returns {ValidationResult}
 */
export function numeric(value, fieldName = 'Este campo') {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} es obligatorio` }
  }

  const num = Number(value)
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} debe ser un número válido` }
  }

  return { valid: true }
}

/**
 * Valida que un número sea positivo (mayor que 0).
 * @param {*} value
 * @param {string} fieldName
 * @returns {ValidationResult}
 */
export function positiveNumber(value, fieldName = 'Este campo') {
  const numCheck = numeric(value, fieldName)
  if (!numCheck.valid) return numCheck

  const num = Number(value)
  if (num <= 0) {
    return { valid: false, message: `${fieldName} debe ser mayor a 0` }
  }

  return { valid: true }
}

/**
 * Valida que un valor sea un número no negativo (>= 0).
 * @param {*} value
 * @param {string} fieldName
 * @returns {ValidationResult}
 */
export function nonNegativeNumber(value, fieldName = 'Este campo') {
  const numCheck = numeric(value, fieldName)
  if (!numCheck.valid) return numCheck

  const num = Number(value)
  if (num < 0) {
    return { valid: false, message: `${fieldName} no puede ser negativo` }
  }

  return { valid: true }
}

/**
 * Valida un código postal mexicano (5 dígitos).
 * @param {string} value
 * @returns {ValidationResult}
 */
export function validateZipCode(value) {
  if (!value || String(value).trim() === '') {
    return { valid: false, message: 'El código postal es obligatorio' }
  }

  const zipRegex = /^\d{5}$/
  if (!zipRegex.test(value.trim())) {
    return { valid: false, message: 'El código postal debe tener 5 dígitos' }
  }

  return { valid: true }
}

/**
 * Valida una URL.
 * @param {string} url
 * @returns {ValidationResult}
 */
export function validateUrl(url) {
  if (!url) return { valid: true } // Opcional

  try {
    new URL(url.startsWith('http') ? url : `https://${url}`)
    return { valid: true }
  } catch {
    return { valid: false, message: 'La URL no es válida' }
  }
}

/**
 * Valida múltiples reglas en cadena. Retorna el primer error encontrado.
 * @param {Array<(value: any) => ValidationResult>} validators — Lista de funciones validadoras
 * @param {*} value — Valor a validar
 * @returns {ValidationResult}
 */
export function validateAll(validators, value) {
  for (const validator of validators) {
    const result = validator(value)
    if (!result.valid) return result
  }
  return { valid: true }
}

/**
 * Valida un objeto completo con un esquema de reglas.
 * @param {Object.<string, (value: any) => ValidationResult>} schema — Mapa campo -> validador
 * @param {Object} data — Datos a validar
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 */
export function validateSchema(schema, data) {
  const errors = {}

  for (const [field, validator] of Object.entries(schema)) {
    const result = validator(data[field])
    if (!result.valid) {
      errors[field] = result.message
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}