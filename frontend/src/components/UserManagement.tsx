import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserPermissions {
  databasePermissions: Array<{
    databaseName: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }>;
  tablePermissions: Array<{
    databaseName: string;
    tableName: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }>;
}

interface UserManagementProps {
  token: string;
  isAdmin: boolean;
}

export function UserManagement({ token, isAdmin }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [tables, setTables] = useState<Array<{ schema: string; name: string }>>(
    []
  );

  // Estados para crear usuario
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    isAdmin: false,
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Estados para editar usuario
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatingUser, setUpdatingUser] = useState(false);

  // Estados para permisos
  const [selectedUserForPermissions, setSelectedUserForPermissions] =
    useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [databasePermissions, setDatabasePermissions] = useState({
    hasAccess: true,
  });
  const [tablePermissions, setTablePermissions] = useState({
    hasAccess: true,
  });
  const [savingPermissions, setSavingPermissions] = useState(false);

  const api = axios.create({
    baseURL: "http://localhost:3001",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/auth/users");
      setUsers(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  // Cargar bases de datos
  const loadDatabases = async () => {
    try {
      const response = await api.get("/api/databases");
      setDatabases(response.data);
    } catch (error: any) {
      console.error("Error cargando bases de datos:", error);
    }
  };

  // Cargar tablas de una base de datos
  const loadTables = async (databaseName: string) => {
    try {
      const response = await api.get(`/api/databases/${databaseName}/tables`);
      setTables(response.data);
    } catch (error: any) {
      console.error("Error cargando tablas:", error);
      setTables([]);
    }
  };

  // Crear usuario
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError("Usuario y contraseña son requeridos");
      return;
    }

    try {
      setCreatingUser(true);
      await api.post("/api/auth/users", newUser);
      setNewUser({ username: "", password: "", isAdmin: false });
      setShowCreateForm(false);
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || "Error creando usuario");
    } finally {
      setCreatingUser(false);
    }
  };

  // Actualizar contraseña
  const handleUpdatePassword = async () => {
    if (!editingUser || !newPassword) {
      setError("Nueva contraseña es requerida");
      return;
    }

    try {
      setUpdatingUser(true);
      await api.put(`/api/auth/users/${editingUser.id}/password`, {
        newPassword,
      });
      setNewPassword("");
      setEditingUser(null);
      setShowEditForm(false);
    } catch (error: any) {
      setError(error.response?.data?.error || "Error actualizando contraseña");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Actualizar estado de administrador
  const handleToggleAdmin = async (user: User) => {
    try {
      await api.put(`/api/auth/users/${user.id}/admin`, {
        isAdmin: !user.isAdmin,
      });
      loadUsers();
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Error actualizando permisos de administrador"
      );
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar al usuario "${user.username}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/auth/users/${user.id}`);
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || "Error eliminando usuario");
    }
  };

  // Cargar permisos de usuario
  const loadUserPermissions = async (user: User) => {
    try {
      setLoadingPermissions(true);
      const response = await api.get(`/api/auth/users/${user.id}/permissions`);
      setUserPermissions(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "Error cargando permisos");
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Abrir modal de permisos
  const openPermissionsModal = async (user: User) => {
    setSelectedUserForPermissions(user);
    setShowPermissionsModal(true);
    await loadUserPermissions(user);
    await loadDatabases();
  };

  // Asignar permisos de base de datos
  const handleAssignDatabasePermissions = async () => {
    if (!selectedUserForPermissions || !selectedDatabase) {
      setError("Usuario y base de datos son requeridos");
      return;
    }

    try {
      setSavingPermissions(true);
      await api.post(
        `/api/auth/users/${selectedUserForPermissions.id}/database-permissions`,
        {
          databaseName: selectedDatabase,
          permissions: {
            canRead: databasePermissions.hasAccess,
            canWrite: databasePermissions.hasAccess,
            canDelete: databasePermissions.hasAccess,
          },
        }
      );
      await loadUserPermissions(selectedUserForPermissions);
      setSelectedDatabase("");
      setDatabasePermissions({
        hasAccess: true,
      });
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Error asignando permisos de base de datos"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  // Asignar permisos de tabla
  const handleAssignTablePermissions = async () => {
    if (!selectedUserForPermissions || !selectedDatabase || !selectedTable) {
      setError("Usuario, base de datos y tabla son requeridos");
      return;
    }

    try {
      setSavingPermissions(true);
      await api.post(
        `/api/auth/users/${selectedUserForPermissions.id}/table-permissions`,
        {
          databaseName: selectedDatabase,
          tableName: selectedTable,
          permissions: {
            canRead: tablePermissions.hasAccess,
            canWrite: tablePermissions.hasAccess,
            canDelete: tablePermissions.hasAccess,
          },
        }
      );
      await loadUserPermissions(selectedUserForPermissions);
      setSelectedTable("");
      setTablePermissions({ hasAccess: true });
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Error asignando permisos de tabla"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Acceso Denegado
          </h3>
          <p className="text-muted-foreground">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground">
            Administra usuarios y sus permisos
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Crear Usuario
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
            <span className="text-red-800">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground font-medium">
                Cargando usuarios...
              </span>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Usuario
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditForm(true);
                        }}
                      >
                        Cambiar Contraseña
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => openPermissionsModal(user)}
                      >
                        Permisos
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => handleToggleAdmin(user)}
                      >
                        {user.isAdmin ? "Quitar Admin" : "Hacer Admin"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal para crear usuario */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Crear Nuevo Usuario
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Usuario
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-black"
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-black"
                  placeholder="Contraseña"
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
                <label htmlFor="isAdmin" className="text-sm text-black">
                  Es Administrador
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowCreateForm(false)}
                className="bg-[#447cd7] hover:bg-[#3a6bc4] text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className="bg-[#0d206c] hover:bg-[#0a1a5a] text-white"
              >
                {creatingUser ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar contraseña */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Cambiar Contraseña - {editingUser.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-black"
                  placeholder="Nueva contraseña"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowEditForm(false)}
                className="bg-[#447cd7] hover:bg-[#3a6bc4] text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={updatingUser}
                className="bg-[#0d206c] hover:bg-[#0a1a5a] text-white"
              >
                {updatingUser ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de permisos */}
      {showPermissionsModal && selectedUserForPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Permisos - {selectedUserForPermissions.username}
            </h3>

            {/* Permisos de Base de Datos */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-black">
                Asignar Permisos de Base de Datos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Base de Datos
                  </label>
                  <Select
                    value={selectedDatabase}
                    onValueChange={setSelectedDatabase}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-black">
                      <SelectValue placeholder="Seleccionar base de datos" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem key={db} value={db}>
                          {db}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dbAccess"
                    checked={databasePermissions.hasAccess}
                    onChange={(e) =>
                      setDatabasePermissions({
                        hasAccess: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="dbAccess" className="text-sm text-black">
                    Acceso Completo (Lectura, Escritura, Eliminación)
                  </label>
                </div>
              </div>
              <Button
                onClick={handleAssignDatabasePermissions}
                disabled={savingPermissions || !selectedDatabase}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingPermissions ? "Guardando..." : "Asignar Permisos de BD"}
              </Button>
            </div>

            {/* Permisos de Tabla */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-black">
                Asignar Permisos de Tabla Específica
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Base de Datos
                  </label>
                  <Select
                    value={selectedDatabase}
                    onValueChange={(value) => {
                      setSelectedDatabase(value);
                      setSelectedTable("");
                      loadTables(value);
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-black">
                      <SelectValue placeholder="Seleccionar base de datos" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem key={db} value={db}>
                          {db}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">
                    Tabla
                  </label>
                  <Select
                    value={selectedTable}
                    onValueChange={setSelectedTable}
                    disabled={!selectedDatabase}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-black">
                      <SelectValue placeholder="Seleccionar tabla" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.schema}.{table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tableAccess"
                    checked={tablePermissions.hasAccess}
                    onChange={(e) =>
                      setTablePermissions({
                        hasAccess: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="tableAccess" className="text-sm text-black">
                    Acceso Completo (Lectura, Escritura, Eliminación)
                  </label>
                </div>
              </div>
              <Button
                onClick={handleAssignTablePermissions}
                disabled={
                  savingPermissions || !selectedDatabase || !selectedTable
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingPermissions
                  ? "Guardando..."
                  : "Asignar Permisos de Tabla"}
              </Button>
            </div>

            {/* Permisos Actuales */}
            {loadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-black font-medium">
                    Cargando permisos...
                  </span>
                </div>
              </div>
            ) : (
              userPermissions && (
                <div>
                  <h4 className="text-md font-medium mb-3 text-black">
                    Permisos Actuales
                  </h4>

                  {/* Permisos de Base de Datos */}
                  {userPermissions.databasePermissions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2 text-black">
                        Bases de Datos:
                      </h5>
                      <div className="space-y-2">
                        {userPermissions.databasePermissions.map(
                          (perm, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 text-sm"
                            >
                              <span className="font-medium text-black">
                                {perm.databaseName}
                              </span>
                              <span
                                className={
                                  perm.canRead &&
                                  perm.canWrite &&
                                  perm.canDelete
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {perm.canRead && perm.canWrite && perm.canDelete
                                  ? "✓"
                                  : "✗"}{" "}
                                Acceso Completo
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Permisos de Tablas */}
                  {userPermissions.tablePermissions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-black">
                        Tablas Específicas:
                      </h5>
                      <div className="space-y-2">
                        {userPermissions.tablePermissions.map((perm, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 text-sm"
                          >
                            <span className="font-medium text-black">
                              {perm.databaseName}.{perm.tableName}
                            </span>
                            <span
                              className={
                                perm.canRead && perm.canWrite && perm.canDelete
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {perm.canRead && perm.canWrite && perm.canDelete
                                ? "✓"
                                : "✗"}{" "}
                              Acceso Completo
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {userPermissions.databasePermissions.length === 0 &&
                    userPermissions.tablePermissions.length === 0 && (
                      <p className="text-gray-600 text-sm">
                        No hay permisos específicos asignados.
                      </p>
                    )}
                </div>
              )
            )}

            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setShowPermissionsModal(false)}
                className="bg-[#447cd7] hover:bg-[#3a6bc4] text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
