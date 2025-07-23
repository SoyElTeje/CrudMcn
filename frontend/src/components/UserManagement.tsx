import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Permission {
  databases: string[];
  tables: Array<{
    database: string;
    table: string;
    schema: string;
  }>;
}

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export function UserManagement({
  isOpen,
  onClose,
  getAuthHeaders,
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPermissionsForm, setShowPermissionsForm] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    isAdmin: false,
  });
  const [newPassword, setNewPassword] = useState("");
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<
    Array<{ schema: string; name: string }>
  >([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadAvailableDatabases();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/users", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError("Error cargando usuarios");
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDatabases = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/api/admin/databases",
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableDatabases(data.databases);
      }
    } catch (error) {
      console.error("Error cargando bases de datos:", error);
    }
  };

  const loadAvailableTables = async (databaseName: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/admin/databases/${databaseName}/tables`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableTables(data.tables);
      }
    } catch (error) {
      console.error("Error cargando tablas:", error);
    }
  };

  const loadUserPermissions = async (userId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${userId}/permissions`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions);
      }
    } catch (error) {
      console.error("Error cargando permisos:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewUser({ username: "", password: "", isAdmin: false });
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Error creando usuario");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${selectedUser.id}/password`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      if (response.ok) {
        setShowPasswordForm(false);
        setNewPassword("");
        setSelectedUser(null);
      } else {
        const data = await response.json();
        setError(data.error || "Error actualizando contraseña");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${userId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Error eliminando usuario");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const handleAssignDatabasePermission = async () => {
    if (!selectedUser || !selectedDatabase) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${selectedUser.id}/permissions/databases`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ databaseName: selectedDatabase }),
        }
      );

      if (response.ok) {
        loadUserPermissions(selectedUser.id);
        setSelectedDatabase("");
      } else {
        const data = await response.json();
        setError(data.error || "Error asignando permiso");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const handleAssignTablePermission = async () => {
    if (!selectedUser || !selectedDatabase || !selectedTable) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${selectedUser.id}/permissions/tables`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            databaseName: selectedDatabase,
            tableName: selectedTable,
            schemaName: "dbo",
          }),
        }
      );

      if (response.ok) {
        loadUserPermissions(selectedUser.id);
        setSelectedTable("");
      } else {
        const data = await response.json();
        setError(data.error || "Error asignando permiso");
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const handleRemoveDatabasePermission = async (databaseName: string) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${selectedUser.id}/permissions/databases/${databaseName}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        loadUserPermissions(selectedUser.id);
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  const handleRemoveTablePermission = async (
    databaseName: string,
    tableName: string
  ) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/users/${selectedUser.id}/permissions/tables/${databaseName}/${tableName}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        loadUserPermissions(selectedUser.id);
      }
    } catch (error) {
      setError("Error de conexión");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h2>
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de usuarios */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Usuarios</h3>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white"
              >
                Crear Usuario
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">Cargando usuarios...</div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-600">
                        {user.isAdmin ? "Administrador" : "Usuario"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          loadUserPermissions(user.id);
                        }}
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white"
                      >
                        Permisos
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordForm(true);
                        }}
                        variant="outline"
                      >
                        Contraseña
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gestión de permisos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Permisos</h3>

            {selectedUser ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">
                    Usuario: {selectedUser.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedUser.isAdmin
                      ? "Administrador (acceso completo)"
                      : "Usuario (permisos específicos)"}
                  </p>
                </div>

                {!selectedUser.isAdmin && (
                  <>
                    {/* Asignar permisos de base de datos */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">
                        Asignar Base de Datos
                      </h4>
                      <div className="flex gap-2">
                        <Select
                          value={selectedDatabase}
                          onValueChange={(value) => {
                            setSelectedDatabase(value);
                            loadAvailableTables(value);
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccionar BD" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDatabases.map((db) => (
                              <SelectItem key={db} value={db}>
                                {db}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAssignDatabasePermission}
                          disabled={!selectedDatabase}
                        >
                          Asignar
                        </Button>
                      </div>
                    </div>

                    {/* Asignar permisos de tabla */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Asignar Tabla</h4>
                      <div className="flex gap-2">
                        <Select
                          value={selectedDatabase}
                          onValueChange={(value) => {
                            setSelectedDatabase(value);
                            loadAvailableTables(value);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="BD" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDatabases.map((db) => (
                              <SelectItem key={db} value={db}>
                                {db}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={selectedTable}
                          onValueChange={setSelectedTable}
                          disabled={!selectedDatabase}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccionar tabla" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTables.map((table) => (
                              <SelectItem key={table.name} value={table.name}>
                                {table.schema}.{table.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAssignTablePermission}
                          disabled={!selectedDatabase || !selectedTable}
                        >
                          Asignar
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Mostrar permisos actuales */}
                {userPermissions && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-2">Permisos Actuales</h4>

                    {userPermissions.databases.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Bases de Datos:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {userPermissions.databases.map((db) => (
                            <span
                              key={db}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1"
                            >
                              {db}
                              {!selectedUser?.isAdmin && (
                                <button
                                  onClick={() =>
                                    handleRemoveDatabasePermission(db)
                                  }
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {userPermissions.tables.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Tablas:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {userPermissions.tables.map((table) => (
                            <span
                              key={`${table.database}.${table.table}`}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1"
                            >
                              {table.database}.{table.schema}.{table.table}
                              {!selectedUser?.isAdmin && (
                                <button
                                  onClick={() =>
                                    handleRemoveTablePermission(
                                      table.database,
                                      table.table
                                    )
                                  }
                                  className="text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {userPermissions.databases.length === 0 &&
                      userPermissions.tables.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Sin permisos específicos
                        </p>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Selecciona un usuario para gestionar sus permisos
              </div>
            )}
          </div>
        </div>

        {/* Modal crear usuario */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Crear Usuario</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newUser.isAdmin}
                    onChange={(e) =>
                      setNewUser({ ...newUser, isAdmin: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="isAdmin" className="text-sm text-gray-700">
                    Es administrador
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-brand-blue hover:bg-brand-blue-dark text-white"
                  >
                    Crear
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal cambiar contraseña */}
        {showPasswordForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-brand-blue hover:bg-brand-blue-dark text-white"
                  >
                    Actualizar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
