import React, { useState } from "react";
import axios from "axios";
// API configuration
const API_BASE_URL = import.meta.env.VITE_CURRENT_IP || "http://localhost:3001";
import { Button } from "./ui/button";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (token: string, user: any) => void;
  onClose: () => void;
}

export function LoginModal({ isOpen, onLogin }: LoginModalProps) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      setError("Usuario y contraseña son requeridos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        credentials
      );

      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
      } else {
        setError("Error en la autenticación");
      }
    } catch (error: any) {
      // Extraer el mensaje de error correctamente
      let errorMessage = "Error de conexión";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Si es un objeto de error complejo, extraer el mensaje
        if (typeof errorData === 'object') {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            // Si error es un objeto, extraer el mensaje
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border/50 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-muted-foreground">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className="w-full p-3 border border-border/50 rounded-lg bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Ingresa tu usuario"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full p-3 border border-border/50 rounded-lg bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
