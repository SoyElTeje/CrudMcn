import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./components/ui/table";
import { Button } from "./components/ui/button";
import { EditRecordModal } from "./components/EditRecordModal";
import { AddRecordModal } from "./components/AddRecordModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { BulkDeleteConfirmationModal } from "./components/BulkDeleteConfirmationModal";
import { LoginModal } from "./components/LoginModal";
import { UserManagement } from "./components/UserManagement";
import "./App.css";

interface TableInfo {
  schema: string;
  name: string;
}

interface TableData {
  database: string;
  table: string;
  count: number;
  data: any[];
}

interface TableStructure {
  tableName: string;
  columns: any[];
  primaryKeys: string[];
}

function App() {
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [currentView, setCurrentView] = useState<"database" | "users">(
    "database"
  );

  // Estados de base de datos
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | undefined>(undefined);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | undefined>(
    undefined
  );
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Estados para agregar registros
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  
  const [tableStructure, setTableStructure] = useState<TableStructure | null>(
    null
  );

  // Estados para eliminación individual
  const [deletingRecord, setDeletingRecord] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para eliminación múltiple
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Configurar axios con interceptor para token
  const api = axios.create({
    baseURL: "http://localhost:3001",
  });

  // Agregar interceptor para incluir token en todas las peticiones
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Función para manejar login exitoso
  const handleLogin = (newToken: string, user: any) => {
    setToken(newToken);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowLogin(false);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowLogin(true);
    setCurrentView("database");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Verificar token guardado al cargar la aplicación
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setToken(savedToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowLogin(false);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Función para limpiar el estado cuando cambia la base de datos
  const handleDatabaseChange = (newDb: string) => {
    setSelectedDb(newDb);
    setSelectedTable(undefined);
    setTableData(null);
    setError(null);
    setLoading(false);
    setSelectedRecords([]);
  };

  // Función para abrir el modal de edición
  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // Función para obtener la estructura de la tabla
  const fetchTableStructure = async (dbName: string, tableName: string) => {
    try {
      const response = await api.get(
        `/api/databases/${dbName}/tables/${tableName}/structure`
      );
      setTableStructure(response.data);
    } catch (error: any) {
      console.error("Error fetching table structure:", error);
      setTableStructure(null);
    }
  };

  // Función para crear un nuevo registro
  const handleAddRecord = async (newRecord: any) => {
    if (!selectedDb || !selectedTable) return;

    setAddLoading(true);
    try {
      await api.post(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`,
        {
          record: newRecord,
        }
      );

      // Recargar los datos de la tabla
      const response = await api.get(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`
      );
      setTableData(response.data);

      setIsAddModalOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setAddLoading(false);
    }
  };

  // Función para guardar los cambios de un registro
  const handleSaveRecord = async (updatedRecord: any) => {
    if (!selectedDb || !selectedTable || !editingRecord || !tableStructure)
      return;

    setEditLoading(true);
    try {
      // Crear objeto con valores de clave primaria
      const primaryKeyValues: any = {};
      tableStructure.primaryKeys.forEach((key) => {
        primaryKeyValues[key] = editingRecord[key];
      });

      await api.put(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`,
        {
          record: updatedRecord,
          primaryKeyValues: primaryKeyValues,
        }
      );

      // Recargar los datos de la tabla
      const response = await api.get(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`
      );
      setTableData(response.data);

      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Función para abrir el modal de confirmación de eliminación individual
  const handleDeleteRecord = (record: any) => {
    setDeletingRecord(record);
    setIsDeleteModalOpen(true);
  };

  // Función para confirmar eliminación individual
  const handleConfirmDelete = async () => {
    if (!selectedDb || !selectedTable || !tableStructure || !deletingRecord)
      return;

    setDeleteLoading(true);
    try {
      // Crear objeto con valores de clave primaria
      const primaryKeyValues: any = {};
      tableStructure.primaryKeys.forEach((key) => {
        primaryKeyValues[key] = deletingRecord[key];
      });

      await api.delete(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`,
        {
          data: { primaryKeyValues },
        }
      );

      // Recargar los datos de la tabla
      const response = await api.get(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`
      );
      setTableData(response.data);

      // Limpiar selección si el registro eliminado estaba seleccionado
      setSelectedRecords((prev) =>
        prev.filter((record) => {
          return !tableStructure.primaryKeys.every(
            (key) => record[key] === deletingRecord[key]
          );
        })
      );

      setIsDeleteModalOpen(false);
      setDeletingRecord(null);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Función para manejar selección de registros
  const handleRecordSelection = (record: any, isSelected: boolean) => {
    if (isSelected) {
      setSelectedRecords((prev) => [...prev, record]);
    } else {
      setSelectedRecords((prev) =>
        prev.filter((r) => {
          return !tableStructure?.primaryKeys.every(
            (key) => r[key] === record[key]
          );
        })
      );
    }
  };

  // Función para seleccionar/deseleccionar todos los registros
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedRecords(tableData ? [...tableData.data] : []);
    } else {
      setSelectedRecords([]);
    }
  };

  // Función para abrir el modal de confirmación de eliminación múltiple
  const handleBulkDelete = () => {
    if (selectedRecords.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  // Función para confirmar eliminación múltiple
  const handleConfirmBulkDelete = async () => {
    if (!selectedDb || !selectedTable || selectedRecords.length === 0) return;

    setBulkDeleteLoading(true);
    try {
      await api.delete(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records/bulk`,
        {
          data: { records: selectedRecords },
        }
      );

      // Recargar los datos de la tabla
      const response = await api.get(
        `/api/databases/${selectedDb}/tables/${selectedTable}/records`
      );
      setTableData(response.data);

      // Limpiar selección
      setSelectedRecords([]);
      setIsBulkDeleteModalOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Fetch databases on mount
  useEffect(() => {
    if (isAuthenticated) {
      api
        .get("/api/databases")
        .then((res) => setDatabases(res.data))
        .catch(() => setDatabases([]));
    }
  }, [isAuthenticated]);

  // Fetch tables when database changes
  useEffect(() => {
    if (selectedDb && isAuthenticated) {
      api
        .get(`/api/databases/${selectedDb}/tables`)
        .then((res) => setTables(res.data))
        .catch(() => setTables([]));
    } else {
      setTables([]);
    }
  }, [selectedDb, isAuthenticated]);

  // Fetch table data when table changes
  useEffect(() => {
    if (
      selectedDb &&
      selectedTable &&
      selectedTable.trim() !== "" &&
      isAuthenticated
    ) {
      setLoading(true);
      setError(null);

      // Obtener datos de la tabla y estructura en paralelo
      Promise.all([
        api.get(`/api/databases/${selectedDb}/tables/${selectedTable}/records`),
        fetchTableStructure(selectedDb, selectedTable),
      ])
        .then(([tableResponse]) => setTableData(tableResponse.data))
        .catch((err) => setError(err.response?.data?.error || err.message))
        .finally(() => setLoading(false));
    } else {
      setTableData(null);
      setTableStructure(null);
      setError(null);
    }
  }, [selectedDb, selectedTable, isAuthenticated]);

  // Render
  if (showLogin) {
    return (
      <LoginModal
        isOpen={showLogin}
        onLogin={handleLogin}
        onClose={() => setShowLogin(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Sistema de Gestión de Bases de Datos
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Bienvenido,{" "}
                <span className="font-semibold">{currentUser?.username}</span>
                {currentUser?.isAdmin && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-sm"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setCurrentView("database")}
              variant={currentView === "database" ? "default" : "outline"}
            >
              Bases de Datos
            </Button>
            {currentUser?.isAdmin && (
              <Button
                onClick={() => setCurrentView("users")}
                variant={currentView === "users" ? "default" : "outline"}
              >
                Gestión de Usuarios
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {currentView === "users" ? (
          <UserManagement
            token={token!}
            isAdmin={currentUser?.isAdmin || false}
          />
        ) : (
          <>
            {/* Selectors Section */}
            <div className="bg-card border border-border/50 rounded-xl p-6 mb-8 shadow-lg backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label className="block mb-3 font-semibold text-sm text-foreground">
                    Base de datos
                  </label>
                  <Select
                    value={selectedDb}
                    onValueChange={handleDatabaseChange}
                  >
                    <SelectTrigger className="h-12 border-2 border-border/50 hover:border-accent/50 transition-colors">
                      <SelectValue placeholder="Selecciona base de datos" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem
                          key={db}
                          value={db}
                          className="hover:bg-accent/10"
                        >
                          {db}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="block mb-3 font-semibold text-sm text-foreground">
                    Tabla
                  </label>
                  <Select
                    value={selectedTable}
                    onValueChange={setSelectedTable}
                    disabled={!selectedDb || tables.length === 0}
                  >
                    <SelectTrigger className="h-12 border-2 border-border/50 hover:border-accent/50 transition-colors">
                      <SelectValue placeholder="Selecciona tabla" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((tbl) => (
                        <SelectItem
                          key={tbl.name}
                          value={tbl.name}
                          className="hover:bg-accent/10"
                        >
                          {tbl.schema}.{tbl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Data Section */}
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg backdrop-blur-sm">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-muted-foreground font-medium">
                      Cargando datos...
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              )}

              {tableData && (
                <div>
                  <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-foreground mb-1">
                          Datos de {tableData.database}.{tableData.table}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {tableData.count > 0
                            ? `Mostrando ${tableData.count} registros`
                            : "No hay registros en esta tabla"}
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700"
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
                        Agregar Registro
                      </Button>
                    </div>
                  </div>

                  {tableData.data.length > 0 ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                      {/* Barra de herramientas para eliminación múltiple */}
                      {selectedRecords.length > 0 && (
                        <div className="bg-accent/10 border-b border-border/50 p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">
                              {selectedRecords.length} registro
                              {selectedRecords.length !== 1 ? "s" : ""}{" "}
                              seleccionado
                              {selectedRecords.length !== 1 ? "s" : ""}
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={handleBulkDelete}
                              className="h-8"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Eliminar Seleccionados
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRecords([])}
                            className="h-8 text-muted-foreground hover:text-foreground"
                          >
                            Limpiar Selección
                          </Button>
                        </div>
                      )}

                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold text-foreground w-12">
                              <input
                                type="checkbox"
                                checked={
                                  tableData.data.length > 0 &&
                                  selectedRecords.length ===
                                    tableData.data.length
                                }
                                onChange={(e) =>
                                  handleSelectAll(e.target.checked)
                                }
                                className="w-4 h-4 text-primary bg-background border-border/50 rounded focus:ring-primary/50"
                              />
                            </TableHead>
                            {Object.keys(tableData.data[0]).map((col) => (
                              <TableHead
                                key={col}
                                className="font-semibold text-foreground"
                              >
                                {col}
                              </TableHead>
                            ))}
                            <TableHead className="font-semibold text-foreground w-32">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.data.map((row, i) => {
                            const isSelected = selectedRecords.some((record) =>
                              tableStructure?.primaryKeys.every(
                                (key) => record[key] === row[key]
                              )
                            );

                            return (
                              <TableRow
                                key={i}
                                className={`hover:bg-accent/5 transition-colors ${
                                  isSelected ? "bg-accent/10" : ""
                                }`}
                              >
                                <TableCell className="w-12">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) =>
                                      handleRecordSelection(
                                        row,
                                        e.target.checked
                                      )
                                    }
                                    className="w-4 h-4 text-primary bg-background border-border/50 rounded focus:ring-primary/50"
                                  />
                                </TableCell>
                                {Object.keys(row).map((col) => (
                                  <TableCell
                                    key={col}
                                    className="font-mono text-sm"
                                  >
                                    {row[col] === null ? (
                                      <span className="text-muted-foreground italic">
                                        null
                                      </span>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell className="w-32">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditRecord(row)}
                                      className="h-8 px-2"
                                    >
                                      <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteRecord(row)}
                                      className="h-8 px-2 text-white hover:text-white"
                                    >
                                      <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                        </div>
                        <p className="text-muted-foreground font-medium">
                          No hay registros en esta tabla
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          La tabla está vacía o no contiene datos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loading && !error && !tableData && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-secondary"
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
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Selecciona una base de datos y tabla para ver los datos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal de edición */}
        <EditRecordModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          record={editingRecord}
          onSave={handleSaveRecord}
          loading={editLoading}
        />

        {/* Modal de agregar registro */}
        <AddRecordModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
          }}
          tableStructure={tableStructure}
          onSave={handleAddRecord}
          loading={addLoading}
        />

        {/* Modal de confirmación de eliminación individual */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingRecord(null);
          }}
          onConfirm={handleConfirmDelete}
          record={deletingRecord}
          loading={deleteLoading}
        />

        {/* Modal de confirmación de eliminación múltiple */}
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
          }}
          onConfirm={handleConfirmBulkDelete}
          selectedRecords={selectedRecords}
          loading={bulkDeleteLoading}
        />
      </div>
    </div>
  );
}

export default App;
