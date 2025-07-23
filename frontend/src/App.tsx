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
import { ExcelImportModal } from "./components/ExcelImportModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { BulkDeleteModal } from "./components/BulkDeleteModal";
import { Pagination } from "./components/Pagination";
import { PageSizeSelector } from "./components/PageSizeSelector";
import { TableFilters } from "./components/TableFilters";
import { LoginModal } from "./components/LoginModal";
import { UserManagement } from "./components/UserManagement";
import { LogsViewer } from "./components/LogsViewer";
import type { FilterCondition } from "./components/TableFilters";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

interface TableInfo {
  schema: string;
  name: string;
}

interface TableData {
  database: string;
  table: string;
  count: number;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: any[];
  appliedFilters?: FilterCondition[];
}

function App() {
  const {
    user,
    loading: authLoading,
    login,
    logout,
    getAuthHeaders,
    isAuthenticated,
  } = useAuth();
  // State
  const [databases, setDatabases] = useState<string[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableSchema, setTableSchema] = useState<any[]>([]);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<any>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [logsViewerOpen, setLogsViewerOpen] = useState(false);

  // Función para manejar el login
  const handleLogin = (userData: {
    userId: number;
    username: string;
    isAdmin: boolean;
  }) => {
    login(userData);
    setLoginModalOpen(false);
  };

  // Función para manejar el logout
  const handleLogout = () => {
    logout();
    setSelectedDb("");
    setSelectedTable("");
    setTableData(null);
    setDatabases([]);
    setTables([]);
  };

  // Función para limpiar el estado cuando cambia la base de datos
  const handleDatabaseChange = (newDb: string) => {
    setSelectedDb(newDb);
    setSelectedTable("");
    setTableData(null);
    setError(null);
    setLoading(false);
    setCurrentPage(1); // Reset pagination
    setActiveFilters([]); // Reset filters
    setTableSchema([]); // Reset schema
    setSelectedRecords([]); // Reset selected records
  };

  // Función para abrir el modal de edición
  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setEditModalOpen(true);
  };

  // Función para cerrar el modal de edición
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingRecord(null);
  };

  // Función para abrir modal de eliminación
  const handleDeleteRecord = (record: any) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  };

  // Función para cerrar modal de eliminación
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingRecord(null);
  };

  // Función para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingRecord || !selectedDb || !selectedTable) return;

    setLoading(true);
    try {
      // Find the primary key field
      const primaryKeyField =
        Object.keys(deletingRecord).find(
          (key) =>
            key.toLowerCase().includes("id") ||
            key.toLowerCase().includes("key")
        ) || Object.keys(deletingRecord)[0];

      const recordId = deletingRecord[primaryKeyField];

      const response = await axios.delete(
        `http://localhost:3001/api/databases/${selectedDb}/tables/${selectedTable}/records/${recordId}`
      );

      if (response.data.success) {
        // Refresh the table data
        handleRecordUpdated();
        handleCloseDeleteModal();
      }
    } catch (error: any) {
      console.error("Error deleting record:", error);
      setError(error.response?.data?.error || "Error al eliminar el registro");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar selección de registros
  const handleRecordSelection = (record: any, isSelected: boolean) => {
    if (isSelected) {
      setSelectedRecords((prev) => [...prev, record]);
    } else {
      setSelectedRecords((prev) => prev.filter((r) => r !== record));
    }
  };

  // Función para seleccionar/deseleccionar todos
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedRecords(tableData?.data || []);
    } else {
      setSelectedRecords([]);
    }
  };

  // Función para abrir modal de eliminación múltiple
  const handleBulkDelete = () => {
    if (selectedRecords.length === 0) return;
    setBulkDeleteModalOpen(true);
  };

  // Función para cerrar modal de eliminación múltiple
  const handleCloseBulkDeleteModal = () => {
    setBulkDeleteModalOpen(false);
  };

  // Función para confirmar eliminación múltiple
  const handleConfirmBulkDelete = async () => {
    if (selectedRecords.length === 0 || !selectedDb || !selectedTable) return;

    setLoading(true);
    try {
      // Find the primary key field from the first record
      const primaryKeyField =
        Object.keys(selectedRecords[0]).find(
          (key) =>
            key.toLowerCase().includes("id") ||
            key.toLowerCase().includes("key")
        ) || Object.keys(selectedRecords[0])[0];

      // Extract IDs from selected records
      const ids = selectedRecords.map((record) => record[primaryKeyField]);

      const response = await axios.delete(
        `http://localhost:3001/api/databases/${selectedDb}/tables/${selectedTable}/records`,
        { data: { ids } }
      );

      if (response.data.success) {
        // Refresh the table data and clear selection
        handleRecordUpdated();
        setSelectedRecords([]);
        handleCloseBulkDeleteModal();
      }
    } catch (error: any) {
      console.error("Error bulk deleting records:", error);
      setError(
        error.response?.data?.error || "Error al eliminar los registros"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar datos después de editar
  const handleRecordUpdated = () => {
    // Refrescar los datos de la tabla
    if (selectedDb && selectedTable) {
      setLoading(true);
      axios
        .get(`http://localhost:3001/api/trial/table`, {
          params: {
            db: selectedDb,
            table: selectedTable,
            page: currentPage,
            pageSize: pageSize,
            filters: JSON.stringify(activeFilters),
          },
        })
        .then((res) => setTableData(res.data))
        .catch((err) => setError(err.response?.data?.error || err.message))
        .finally(() => setLoading(false));
    }
  };

  // Función para refrescar datos después de importar
  const handleImportSuccess = () => {
    handleRecordUpdated();
  };

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para manejar cambio de tamaño de página
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Función para manejar cambios de filtros
  const handleFiltersChange = (filters: FilterCondition[]) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Función para exportar a Excel
  const handleExportExcel = async (exportAll: boolean = false) => {
    if (!selectedDb || !selectedTable) return;

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        exportAll: exportAll.toString(),
        filters: JSON.stringify(activeFilters),
      });

      const response = await axios.get(
        `http://localhost:3001/api/databases/${selectedDb}/tables/${selectedTable}/export?${params}`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${selectedTable}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      if (error.response?.status === 401) {
        logout();
        setLoginModalOpen(true);
      } else if (error.response?.status === 403) {
        setError("No tienes permisos para exportar esta tabla");
      } else {
        setError("Error al exportar a Excel");
      }
    }
  };

  // Fetch databases on mount
  useEffect(() => {
    if (isAuthenticated) {
      axios
        .get("http://localhost:3001/api/databases", {
          headers: getAuthHeaders(),
        })
        .then((res) => setDatabases(res.data.databases || res.data))
        .catch((err) => {
          console.error("Error fetching databases:", err);
          if (err.response?.status === 401) {
            logout();
            setLoginModalOpen(true);
          }
          setDatabases([]);
        });
    } else {
      setDatabases([]);
    }
  }, [isAuthenticated, getAuthHeaders, logout]);

  // Mostrar modal de login si no está autenticado y no está cargando
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLoginModalOpen(true);
    }
  }, [authLoading, isAuthenticated]);

  // Fetch tables when database changes
  useEffect(() => {
    if (selectedDb && isAuthenticated) {
      setTablesError(null);
      setLoading(true);
      axios
        .get(`http://localhost:3001/api/databases/${selectedDb}/tables`, {
          headers: getAuthHeaders(),
        })
        .then((res) => {
          setTables(res.data.tables || res.data);
          setTablesError(null);
        })
        .catch((err) => {
          console.error("Error fetching tables:", err);
          if (err.response?.status === 401) {
            logout();
            setLoginModalOpen(true);
          } else {
            setTablesError(
              err.response?.data?.error || "Error al obtener las tablas"
            );
            setTables([]);
          }
        })
        .finally(() => setLoading(false));
    } else if (!selectedDb || !isAuthenticated) {
      setTables([]);
      setTablesError(null);
    }
  }, [selectedDb, isAuthenticated, getAuthHeaders, logout]);

  // Fetch table schema when table changes
  useEffect(() => {
    if (selectedDb && selectedTable && selectedTable.trim() !== "") {
      axios
        .get(
          `http://localhost:3001/api/databases/${selectedDb}/tables/${selectedTable}/schema`
        )
        .then((res) => {
          const schema = res.data.map((col: any) => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
          }));
          setTableSchema(schema);
        })
        .catch((err) => {
          console.error("Error fetching schema:", err);
          setTableSchema([]);
        });
    } else {
      setTableSchema([]);
    }
  }, [selectedDb, selectedTable]);

  // Fetch table data when table changes
  useEffect(() => {
    // Solo hacer la consulta si tenemos tanto base de datos como tabla seleccionada
    if (
      selectedDb &&
      selectedTable &&
      selectedTable.trim() !== "" &&
      isAuthenticated
    ) {
      setLoading(true);
      setError(null);
      axios
        .get(
          `http://localhost:3001/api/databases/${selectedDb}/tables/${selectedTable}/data`,
          {
            headers: getAuthHeaders(),
            params: {
              page: currentPage,
              pageSize: pageSize,
              filters: JSON.stringify(activeFilters),
            },
          }
        )
        .then((res) => setTableData(res.data))
        .catch((err) => {
          console.error("Error fetching table data:", err);
          if (err.response?.status === 401) {
            logout();
            setLoginModalOpen(true);
          } else if (err.response?.status === 403) {
            setError("No tienes permisos para acceder a esta tabla");
          } else {
            setError(err.response?.data?.error || err.message);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setTableData(null);
      setError(null);
    }
  }, [
    selectedDb,
    selectedTable,
    currentPage,
    pageSize,
    activeFilters,
    isAuthenticated,
    getAuthHeaders,
    logout,
  ]);

  // Render
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Visualizador de Base de Datos
              </h1>
              <p className="text-muted-foreground mt-2">
                Selecciona una base de datos y tabla para explorar los datos
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Bienvenido, {user?.username}
                  </span>
                  {user?.isAdmin && (
                    <>
                      <Button
                        onClick={() => setUserManagementOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-gray-900"
                      >
                        Gestión de Usuarios
                      </Button>
                      <Button
                        onClick={() => setLogsViewerOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                      >
                        Ver Logs
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-brand-blue-dark hover:bg-brand-blue text-white"
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Selectors Section */}
        <div className="bg-card border border-border/50 rounded-xl p-6 mb-8 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block mb-3 font-semibold text-sm text-foreground">
                Base de datos
              </label>
              <Select value={selectedDb} onValueChange={handleDatabaseChange}>
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
              {tablesError && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-destructive">
                      {tablesError}
                    </span>
                    <Button
                      onClick={() => setTablesError(null)}
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}
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

          {tableData &&
            tableData.appliedFilters &&
            tableData.appliedFilters.length > 0 &&
            tableData.data.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-yellow-800 font-medium mb-2">
                    No se encontraron registros con los filtros aplicados
                  </p>
                  <p className="text-sm text-yellow-700">
                    Intenta ajustar o limpiar los filtros para ver más
                    resultados
                  </p>
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
                        ? `Mostrando ${tableData.count} de ${tableData.totalCount} registros`
                        : "No hay registros en esta tabla"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExportExcel(false)}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white border-brand-blue"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Exportar Página
                    </Button>
                    <Button
                      onClick={() => handleExportExcel(true)}
                      className="bg-brand-blue-dark hover:bg-brand-blue text-white border-brand-blue-dark"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Exportar Todo
                    </Button>
                    <Button
                      onClick={() => setImportModalOpen(true)}
                      className="bg-brand-orange hover:bg-brand-orange-dark text-gray-900"
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Importar Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Barra de selección múltiple */}
              {selectedRecords.length > 0 && (
                <div className="bg-brand-blue-lighter border border-brand-blue-light rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-brand-blue"
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
                      <span className="text-brand-blue-dark font-medium">
                        {selectedRecords.length} registro(s) seleccionado(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleBulkDelete}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
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
                      <Button
                        onClick={() => setSelectedRecords([])}
                        size="sm"
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Limpiar Selección
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selector de registros por página */}
              <div className="mb-4">
                <PageSizeSelector
                  pageSize={tableData.pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>

              {/* Filtros */}
              <div className="mb-4">
                <TableFilters
                  columns={
                    tableData.data.length > 0
                      ? Object.keys(tableData.data[0]).map((col) => ({
                          name: col,
                          type:
                            typeof tableData.data[0][col] === "number"
                              ? "int"
                              : "varchar",
                        }))
                      : tableSchema.length > 0
                      ? tableSchema
                      : []
                  }
                  onFiltersChange={handleFiltersChange}
                  activeFilters={activeFilters}
                />
              </div>

              {tableData.data.length > 0 ? (
                <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold text-foreground w-12">
                          <input
                            type="checkbox"
                            checked={
                              selectedRecords.length ===
                                tableData.data.length &&
                              tableData.data.length > 0
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
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
                        <TableHead className="font-semibold text-foreground text-center">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.data.map((row, i) => (
                        <TableRow
                          key={i}
                          className="hover:bg-accent/5 transition-colors"
                        >
                          <TableCell className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedRecords.some((r) => r === row)}
                              onChange={(e) =>
                                handleRecordSelection(row, e.target.checked)
                              }
                              className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                            />
                          </TableCell>
                          {Object.keys(row).map((col) => (
                            <TableCell key={col} className="font-mono text-sm">
                              {row[col] === null ? (
                                <span className="text-muted-foreground italic">
                                  null
                                </span>
                              ) : (
                                String(row[col])
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => handleEditRecord(row)}
                                size="sm"
                                className="bg-brand-blue hover:bg-brand-blue-dark text-white"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                Editar
                              </Button>
                              <Button
                                onClick={() => handleDeleteRecord(row)}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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

              {/* Pagination */}
              {tableData && (
                <div className="mt-6">
                  <Pagination
                    currentPage={tableData.page}
                    totalPages={tableData.totalPages}
                    pageSize={tableData.pageSize}
                    totalCount={tableData.totalCount}
                    onPageChange={handlePageChange}
                  />
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
      </div>

      {/* Modal de edición */}
      {editingRecord && (
        <EditRecordModal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          record={editingRecord}
          database={selectedDb || ""}
          table={selectedTable || ""}
          onRecordUpdated={handleRecordUpdated}
        />
      )}

      {/* Modal de importación Excel */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        database={selectedDb || ""}
        table={selectedTable || ""}
        onImportSuccess={handleImportSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        record={deletingRecord}
        database={selectedDb || ""}
        table={selectedTable || ""}
        loading={loading}
      />

      {/* Modal de confirmación de eliminación múltiple */}
      <BulkDeleteModal
        isOpen={bulkDeleteModalOpen}
        onClose={handleCloseBulkDeleteModal}
        onConfirm={handleConfirmBulkDelete}
        selectedRecords={selectedRecords}
        database={selectedDb || ""}
        table={selectedTable || ""}
        loading={loading}
      />

      {/* Modal de login */}
      <LoginModal isOpen={loginModalOpen} onLogin={handleLogin} />

      {/* Modal de gestión de usuarios */}
      <UserManagement
        isOpen={userManagementOpen}
        onClose={() => setUserManagementOpen(false)}
        getAuthHeaders={getAuthHeaders}
      />

      {/* Modal de logs */}
      <LogsViewer
        isOpen={logsViewerOpen}
        onClose={() => setLogsViewerOpen(false)}
        getAuthHeaders={getAuthHeaders}
      />
    </div>
  );
}

export default App;
