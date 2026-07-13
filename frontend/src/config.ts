/**
 * API base URL configuration.
 *
 * In development (npm run dev), the Vite proxy forwards /api → localhost:8000,
 * so the default "/api" works out of the box.
 *
 * For production with separate domains, set the VITE_API_BASE_URL environment
 * variable at build time or in your .env file:
 *
 *   VITE_API_BASE_URL=https://domainname-api.something.com/api
 *
 * All API calls in the app read from this single constant.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "/api";
