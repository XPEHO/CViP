// Frontend URL: Vite in dev (5173), nginx in the Docker stack (8080 by default, see FRONTEND_PORT).
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
