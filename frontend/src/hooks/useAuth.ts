"use client";

/**
 * Convenience hook — reads auth state from AuthContext.
 * Components just call useAuth() without knowing about Context directly.
 */
export { useAuthContext as useAuth } from "@/contexts/AuthContext";
