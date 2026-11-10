export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Erreurs PostgreSQL attendues, traduites en réponses HTTP.
const PG_ERRORS = {
  23505: [409, 'Un élément identique existe déjà'],
  23503: [409, 'Élément référencé introuvable ou encore utilisé'],
  23514: [400, 'Valeur refusée par une règle de validation'],
  '22P02': [400, 'Valeur invalide'],
}

export const toHttpError = (err) => {
  if (err instanceof HttpError) return err
  const known = PG_ERRORS[err.code]
  if (known) return new HttpError(...known)
  // Erreurs de express.json() (corps mal formé, trop volumineux…).
  if (err.status >= 400 && err.status < 500 && err.expose) return new HttpError(err.status, err.message)
  return null
}
