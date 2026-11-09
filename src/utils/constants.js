// In production (Vercel) set VITE_API_URL to your deployed backend URL.
// Locally it falls back to the backend running on your machine.
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7777";