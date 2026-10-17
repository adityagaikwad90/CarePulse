// Base API URL helper
// Uses VITE_API_BASE_URL if set, or empty string (relative /api path) for unified Vercel deployment and local Vite proxy
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${clean}`;
}
