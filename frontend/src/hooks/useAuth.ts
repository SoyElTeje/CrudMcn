import { useState, useEffect } from "react";

interface User {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const token = localStorage.getItem("authToken");
    if (token) {
      // Por simplicidad, asumimos que el token es el username
      // En producción, deberías verificar el token con el backend
      setUser({
        userId: 1, // Placeholder
        username: token,
        isAdmin: token === "admin", // Asumimos que 'admin' es el usuario administrador
      });
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("authToken", userData.username);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    user,
    loading,
    login,
    logout,
    getAuthHeaders,
    isAuthenticated: !!user,
  };
}
