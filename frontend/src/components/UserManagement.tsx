import { useState, useEffect } from "react";
// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
import { formatDate } from "../lib/dateUtils";
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
import { ConfirmationModal } from "./ui/confirmation-modal";

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
  isAdmin: boolean;
  api: any; // Agregar la instancia de axios del App.tsx
}

export function UserManagement({ isAdmin, api }: UserManagementProps) {
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

  // Estados para modales de confirmación
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [
    showRemoveDatabasePermissionModal,
    setShowRemoveDatabasePermissionModal,
  ] = useState(false);
  const [databasePermissionToRemove, setDatabasePermissionToRemove] =
    useState<string>("");
  const [showRemoveTablePermissionModal, setShowRemoveTablePermissionModal] =
    useState(false);
  const [tablePermissionToRemove, setTablePermissionToRemove] = useState<{
    databaseName: string;
    tableName: string;
  } | null>(null);

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
      console.log("🔍 DEBUG - Cargando bases de datos...");
      const response = await api.get("/api/databases");
      console.log("🔍 DEBUG - Respuesta de bases de datos:", response.data);
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

    // Debug: Verificar el token

    try {
      setCreatingUser(true);

      // Debug: Verificar headers antes de la petición
      console.log("🔍 DEBUG - API_BASE_URL:", API_BASE_URL);
      console.log("🔍 DEBUG - URL completa:", `${API_BASE_URL}/api/auth/users`);

      // Usar la instancia de axios configurada que ya tiene el baseURL y el token
      const response = await api.post("/api/auth/users", newUser);

      if (response.data.success) {
        setNewUser({ username: "", password: "", isAdmin: false });
        setShowCreateForm(false);
        loadUsers();
      } else {
        setError("Error creando usuario");
      }
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
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/api/auth/users/${userToDelete.id}`);
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

      // Convertir permisos booleanos a array de strings como espera el backend
      const permissionsArray = [];
      if (databasePermissions.hasAccess) {
        permissionsArray.push("read", "write", "create", "delete");
      }

      await api.post(
        `/api/auth/users/${selectedUserForPermissions.id}/database-permissions`,
        {
          databaseName: selectedDatabase,
          permissions: permissionsArray,
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

      // Convertir permisos booleanos a array de strings como espera el backend
      const permissionsArray = [];
      if (tablePermissions.hasAccess) {
        permissionsArray.push("read", "write", "create", "delete");
      }

      await api.post(
        `/api/auth/users/${selectedUserForPermissions.id}/table-permissions`,
        {
          databaseName: selectedDatabase,
          tableName: selectedTable,
          permissions: permissionsArray,
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

  // Eliminar permisos de base de datos
  const handleRemoveDatabasePermissions = async (databaseName: string) => {
    if (!selectedUserForPermissions) {
      setError("Usuario no seleccionado");
      return;
    }

    setDatabasePermissionToRemove(databaseName);
    setShowRemoveDatabasePermissionModal(true);
  };

  const confirmRemoveDatabasePermissions = async () => {
    if (!selectedUserForPermissions || !databasePermissionToRemove) return;

    try {
      setSavingPermissions(true);
      await api.delete(
        `/api/auth/users/${selectedUserForPermissions.id}/database-permissions`,
        {
          data: { databaseName: databasePermissionToRemove },
        }
      );
      await loadUserPermissions(selectedUserForPermissions);
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Error eliminando permisos de base de datos"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  // Eliminar permisos de tabla
  const handleRemoveTablePermissions = async (
    databaseName: string,
    tableName: string
  ) => {
    if (!selectedUserForPermissions) {
      setError("Usuario no seleccionado");
      return;
    }

    setTablePermissionToRemove({ databaseName, tableName });
    setShowRemoveTablePermissionModal(true);
  };

  const confirmRemoveTablePermissions = async () => {
    if (!selectedUserForPermissions || !tablePermissionToRemove) return;

    try {
      setSavingPermissions(true);
      await api.delete(
        `/api/auth/users/${selectedUserForPermissions.id}/table-permissions`,
        {
          data: {
            databaseName: tablePermissionToRemove.databaseName,
            tableName: tablePermissionToRemove.tableName,
          },
        }
      );
      await loadUserPermissions(selectedUserForPermissions);
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Error eliminando permisos de tabla"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadDatabases();
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Gestión de Usuarios
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra usuarios y sus permisos
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black w-full sm:w-auto"
        >
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
      <div className="bg-card border border-border/50 rounded-xl p-3 sm:p-6 shadow-lg overflow-x-auto">
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
          <div className="min-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="whitespace-nowrap">Usuario</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Administrador
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Fecha Creación
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-nowrap">
                      {user.id}
                    </TableCell>
                    <TableCell className="font-medium break-all">
                      {user.username}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell className="whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          key="password-button"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs"
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditForm(true);
                          }}
                        >
                          <span
                            key="desktop-password"
                            className="hidden sm:inline"
                          >
                            Cambiar Contraseña
                          </span>
                          <span key="mobile-password" className="sm:hidden">
                            Contraseña
                          </span>
                        </Button>
                        <Button
                          key="permissions-button"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs"
                          onClick={() => openPermissionsModal(user)}
                        >
                          Permisos
                        </Button>
                        <Button
                          key="admin-button"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs"
                          onClick={() => handleToggleAdmin(user)}
                        >
                          <span
                            key="desktop-admin"
                            className="hidden sm:inline"
                          >
                            {user.isAdmin ? "Quitar Admin" : "Hacer Admin"}
                          </span>
                          <span key="mobile-admin" className="sm:hidden">
                            {user.isAdmin ? "Quitar" : "Admin"}
                          </span>
                        </Button>
                        <Button
                          key="delete-button"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal para crear usuario */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto">
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
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                onClick={() => setShowCreateForm(false)}
                className="bg-[#447cd7] hover:bg-[#3a6bc4] text-white w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className={`w-full sm:w-auto ${
                  newUser.isAdmin
                    ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                    : "bg-[#0d206c] hover:bg-[#0a1a5a] text-white"
                }`}
              >
                {creatingUser ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar contraseña */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-300 rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto">
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
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                onClick={() => setShowEditForm(false)}
                className="bg-[#447cd7] hover:bg-[#3a6bc4] text-white w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={updatingUser}
                className="bg-[#0d206c] hover:bg-[#0a1a5a] text-white w-full sm:w-auto"
              >
                {updatingUser ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de permisos */}
      {showPermissionsModal && selectedUserForPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Gestión de Permisos
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Usuario:{" "}
                  <span className="font-semibold text-blue-600 break-all">
                    {selectedUserForPermissions.username}
                  </span>
                </p>
              </div>
              <Button
                onClick={() => setShowPermissionsModal(false)}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors self-end sm:self-auto"
                title="Cerrar modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
              {/* Panel de Asignación de Permisos */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
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
                    Asignar Permisos de Base de Datos
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Base de Datos
                      </label>
                      <Select
                        value={selectedDatabase}
                        onValueChange={setSelectedDatabase}
                      >
                        <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors text-gray-900">
                          <SelectValue
                            placeholder="Elegir base de datos..."
                            className="text-gray-900"
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900 border border-gray-200">
                          {databases.map((db: string) => (
                            <SelectItem
                              key={db}
                              value={db}
                              className="text-gray-900 hover:bg-gray-100"
                            >
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-2 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                                  />
                                </svg>
                                {db}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-800">
                            Acceso Completo
                          </p>
                          <p className="text-sm text-blue-700">
                            El usuario podrá leer, escribir y eliminar en todas
                            las tablas de esta base de datos
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleAssignDatabasePermissions}
                      disabled={savingPermissions || !selectedDatabase}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingPermissions ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Asignando...
                        </div>
                      ) : (
                        <div className="flex items-center">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Asignar Permisos de Base de Datos
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Asignar Permisos de Tabla Específica
                  </h4>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          <SelectTrigger className="bg-white border-gray-300 hover:border-green-400 focus:border-green-500 transition-colors text-gray-900">
                            <SelectValue
                              placeholder="Elegir base de datos..."
                              className="text-gray-900"
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-gray-900 border border-gray-200">
                            {(() => {
                              console.log(
                                "🔍 DEBUG - Renderizando select de bases de datos, databases:",
                                databases
                              );
                              return databases.map((db: string) => (
                                <SelectItem
                                  key={db}
                                  value={db}
                                  className="text-gray-900 hover:bg-gray-100"
                                >
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-2 text-green-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                                      />
                                    </svg>
                                    {db}
                                  </div>
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tabla
                        </label>
                        <Select
                          value={selectedTable}
                          onValueChange={setSelectedTable}
                          disabled={!selectedDatabase}
                        >
                          <SelectTrigger className="bg-white border-gray-300 hover:border-green-400 focus:border-green-500 transition-colors disabled:opacity-50 text-gray-900">
                            <SelectValue
                              placeholder="Elegir tabla..."
                              className="text-gray-900"
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-gray-900 border border-gray-200">
                            {tables.map((table) => (
                              <SelectItem
                                key={table.name}
                                value={table.name}
                                className="text-gray-900 hover:bg-gray-100"
                              >
                                <div className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                  {table.schema}.{table.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Acceso Completo a Tabla
                          </p>
                          <p className="text-sm text-green-700">
                            El usuario podrá leer, escribir y eliminar en esta
                            tabla específica
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleAssignTablePermissions}
                      disabled={
                        savingPermissions || !selectedDatabase || !selectedTable
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingPermissions ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Asignando...
                        </div>
                      ) : (
                        <div className="flex items-center">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Asignar Permisos de Tabla
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Panel de Permisos Actuales */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Permisos Actuales
                </h4>

                {loadingPermissions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600 font-medium">
                        Cargando permisos...
                      </span>
                    </div>
                  </div>
                ) : userPermissions ? (
                  <div className="space-y-6">
                    {/* Permisos de Base de Datos */}
                    {userPermissions?.databasePermissions?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                            />
                          </svg>
                          Bases de Datos
                        </h5>
                        <div className="space-y-2">
                          {userPermissions.databasePermissions?.map(
                            (perm, index) => (
                              <div
                                key={`db-perm-${perm.databaseName}-${index}`}
                                className="bg-white rounded-lg p-3 border border-gray-200"
                              >
                                <div
                                  key="permission-content"
                                  className="flex flex-col gap-2"
                                >
                                  <div
                                    key="permission-header"
                                    className="flex items-start justify-between gap-2"
                                  >
                                    <span className="font-medium text-gray-900 break-all flex-1 min-w-0">
                                      {perm.databaseName}
                                    </span>
                                    <Button
                                      key={`remove-db-${perm.databaseName}`}
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveDatabasePermissions(
                                          perm.databaseName
                                        )
                                      }
                                      className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-shrink-0"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-green-500 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-sm text-green-600 font-medium">
                                      Acceso Completo
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Permisos de Tablas */}
                    {userPermissions?.tablePermissions?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          Tablas Específicas
                        </h5>
                        <div className="space-y-2">
                          {userPermissions.tablePermissions?.map(
                            (perm, index) => (
                              <div
                                key={`table-perm-${perm.databaseName}-${perm.tableName}-${index}`}
                                className="bg-white rounded-lg p-3 border border-gray-200"
                              >
                                <div
                                  key="table-permission-content"
                                  className="flex flex-col gap-2"
                                >
                                  <div
                                    key="table-permission-header"
                                    className="flex items-start justify-between gap-2"
                                  >
                                    <span className="font-medium text-gray-900 break-all flex-1 min-w-0">
                                      {perm.databaseName}.{perm.tableName}
                                    </span>
                                    <Button
                                      key={`remove-table-${perm.databaseName}-${perm.tableName}`}
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveTablePermissions(
                                          perm.databaseName,
                                          perm.tableName
                                        )
                                      }
                                      className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-shrink-0"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-green-500 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-sm text-green-600 font-medium">
                                      Acceso Completo
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {userPermissions?.databasePermissions?.length === 0 &&
                      userPermissions?.tablePermissions?.length === 0 && (
                        <div className="text-center py-8">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-gray-500 text-sm">
                            No hay permisos específicos asignados
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Asigna permisos usando los paneles de la izquierda
                          </p>
                        </div>
                      )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales de confirmación */}
      <ConfirmationModal
        isOpen={showDeleteUserModal}
        onClose={() => setShowDeleteUserModal(false)}
        onConfirm={confirmDeleteUser}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete?.username}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showRemoveDatabasePermissionModal}
        onClose={() => setShowRemoveDatabasePermissionModal(false)}
        onConfirm={confirmRemoveDatabasePermissions}
        title="Eliminar Permisos de Base de Datos"
        message={`¿Estás seguro de que quieres eliminar los permisos de la base de datos "${databasePermissionToRemove}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showRemoveTablePermissionModal}
        onClose={() => setShowRemoveTablePermissionModal(false)}
        onConfirm={confirmRemoveTablePermissions}
        title="Eliminar Permisos de Tabla"
        message={`¿Estás seguro de que quieres eliminar los permisos de la tabla "${tablePermissionToRemove?.databaseName}.${tablePermissionToRemove?.tableName}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
