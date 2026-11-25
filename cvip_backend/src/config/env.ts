/** Application configuration read from environment variables. */

/** Value of a required environment variable; throws if it is missing. */
const required = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

/** Configuration validated when the module loads: the application does not start if it is incomplete. */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
}
