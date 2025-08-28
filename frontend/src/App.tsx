import { useEffect, useState } from "react";
import axios from "axios";
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
import { ExcelImportModal } from "./components/ExcelImportModal";
import { ExcelExportModal } from "./components/ExcelExportModal";
import { Pagination } from "./components/Pagination";
import { TableCards } from "./components/TableCards";
import LogsViewer from "./components/LogsViewer";
import { AdvancedFilters } from "./components/AdvancedFilters";
import ActivatedTablesManager from "./components/ActivatedTablesManager";
import { ValidationErrorModal } from "./components/ValidationErrorModal";
import { formatDate, formatDateTime } from "./lib/dateUtils";
import { useTableContext } from "./contexts/TableContext";
import "./App.css";

// Base de datos de la aplicación (no editable - contiene información del sistema)
const APP_DATABASE = "APPDATA";

interface TableInfo {
  schema: string;
  name: string;
  database?: string;
}

interface TableData {
  database: string;
  table: string;
  count: number;
  data: any[];
  totalRecords?: number; // Total de registros en la tabla
  currentPage?: number; // Página actual
  totalPages?: number; // Total de páginas
  recordsPerPage?: number; // Registros por página
}

interface TableStructure {
  tableName: string;
  columns: any[];
  primaryKeys: string[];
}

// Función para formatear valores según el tipo de dato
function formatCellValue(
  value: any,
  columnName: string,
  tableStructure: TableStructure | null
): string {
  if (value === null || value === undefined) {
    return "null";
  }

  // Si no tenemos la estructura de la tabla, mostrar el valor como string
  if (!tableStructure) {
    return String(value);
  }

  // Buscar la columna en la estructura de la tabla
  const column = tableStructure.columns.find(
    (col) => col.COLUMN_NAME === columnName
  );
  if (!column) {
    return String(value);
  }

  const dataType = column.DATA_TYPE.toLowerCase();

  // Para fechas, formatear de manera linda
  if (dataType.includes("date") || dataType.includes("datetime")) {
    // Función simple para convertir ISO a DD/MM/AAAA
    const formatDateFromISO = (dateString: string) => {
      try {
        // Si es un string ISO como "2004-10-10T00:00:00.000Z"
        if (typeof dateString === "string" && dateString.includes("T")) {
          // Parsear manualmente sin usar new Date() para evitar conversión de zona horaria
          const isoMatch = dateString.match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
          );
          if (isoMatch) {
            const [, year, month, day, hours, minutes] = isoMatch;

            // Si es datetime, incluir hora y minutos
            if (dataType.includes("datetime")) {
              return `${day}/${month}/${year} ${hours}:${minutes}`;
            } else {
              // Si es solo date
              return `${day}/${month}/${year}`;
            }
          }
        }

        // Si es un string simple como "2004-10-10"
        if (
          typeof dateString === "string" &&
          dateString.match(/^\d{4}-\d{2}-\d{2}/)
        ) {
          const [year, month, day] = dateString.split("-");
          if (dataType.includes("datetime")) {
            return `${day}/${month}/${year} 00:00`;
          } else {
            return `${day}/${month}/${year}`;
          }
        }

        // Si no se puede parsear, devolver el valor original
        return String(dateString);
      } catch (error) {
        return String(dateString);
      }
    };

    return formatDateFromISO(value);
  }

  // Para otros tipos de datos, mostrar como string
  return String(value);
}

function App() {
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [currentView, setCurrentView] = useState<
    "database" | "users" | "logs" | "activated-tables"
  >("database");
  const [showTableCards, setShowTableCards] = useState(true);

  // Contexto para comunicación entre componentes
  const { setRefreshTables } = useTableContext();

  // Estados de base de datos
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

  // Estados para importación de Excel
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<
    string | null
  >(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Estados para exportación de Excel
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);

  // Estados para errores de validación
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidationErrorModalOpen, setIsValidationErrorModalOpen] =
    useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);

  // Estados para filtros avanzados
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [activeSort, setActiveSort] = useState<any | null>(null);

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

  // Agregar interceptor de respuesta para manejar errores de autenticación
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Si el error es 401 (Unauthorized) o 403 (Forbidden), hacer logout automático
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(
          "Token expirado o inválido, cerrando sesión automáticamente"
        );
        handleLogout();
      }
      return Promise.reject(error);
    }
  );

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

  const handleTableSelect = (table: TableInfo) => {
    setSelectedTable(table.name);
    setShowTableCards(false);
  };

  // Función para abrir el modal de edición
  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // Función auxiliar para obtener información de la tabla (regular o activada)
  const getTableInfo = async (tableName: string) => {
    // Primero buscar en las tablas regulares
    let selectedTableInfo = tables.find((table) => table.name === tableName);

    // Si no se encuentra en las tablas regulares, buscar en las tablas activadas
    if (!selectedTableInfo) {
      try {
        const activatedTablesResponse = await api.get(
          "/api/activated-tables/activated"
        );
        const activatedTable = activatedTablesResponse.data.find(
          (table: any) => table.TableName === tableName
        );

        if (activatedTable) {
          selectedTableInfo = {
            name: activatedTable.TableName,
            database: activatedTable.DatabaseName,
            schema: activatedTable.DatabaseName,
          };
        }
      } catch (error) {
        console.warn("Error obteniendo tablas activadas:", error);
      }
    }

    if (!selectedTableInfo) {
      throw new Error(
        "No se pudo encontrar la base de datos de la tabla seleccionada."
      );
    }

    return selectedTableInfo;
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
    if (!selectedTable) return;

    setAddLoading(true);
    try {
      // Obtener información de la tabla (regular o activada)
      const selectedTableInfo = await getTableInfo(selectedTable);
      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      await api.post(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          record: newRecord,
        }
      );

      // Recargar los datos de la tabla con paginación actual
      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: recordsPerPage,
            offset: (currentPage - 1) * recordsPerPage,
          },
        }
      );
      setTableData(response.data);

      // Actualizar el total de registros
      const newTotal = await fetchTotalRecords(dbName, selectedTable);
      setTotalRecords(newTotal);

      setIsAddModalOpen(false);
    } catch (error: any) {
      // Manejar errores de validación de condiciones específicamente
      if (
        error.response?.data?.details &&
        Array.isArray(error.response.data.details)
      ) {
        setValidationErrors(error.response.data.details);
        setIsValidationErrorModalOpen(true);
      } else {
        // Mejorar mensajes de error para ser más expresivos
        let errorMessage = error.response?.data?.error || error.message;

        // Detectar errores específicos de SQL Server
        if (error.response?.data?.error) {
          const errorText = error.response.data.error.toLowerCase();

          if (
            errorText.includes("primary key") ||
            errorText.includes("duplicate key") ||
            errorText.includes("unique constraint")
          ) {
            errorMessage =
              "Ya existe un registro con la misma clave primaria. Verifique que los valores de clave primaria sean únicos.";
          } else if (
            errorText.includes("foreign key") ||
            errorText.includes("fk_")
          ) {
            errorMessage =
              "Los datos hacen referencia a un registro que no existe en otra tabla. Verifique las referencias.";
          } else if (
            errorText.includes("check constraint") ||
            errorText.includes("check_")
          ) {
            errorMessage =
              "Los datos no cumplen con las restricciones de validación configuradas en la tabla.";
          } else if (
            errorText.includes("cannot insert the value null") ||
            errorText.includes("null value")
          ) {
            errorMessage =
              "No se puede insertar un valor nulo en un campo requerido. Complete todos los campos obligatorios.";
          } else if (
            errorText.includes("conversion failed") ||
            errorText.includes("data type")
          ) {
            errorMessage =
              "El tipo de dato proporcionado no es compatible con el campo. Verifique el formato de los datos.";
          } else if (
            errorText.includes("string or binary data would be truncated")
          ) {
            errorMessage =
              "Los datos proporcionados exceden la longitud máxima permitida para el campo.";
          } else if (
            errorText.includes("table not found") ||
            errorText.includes("object name")
          ) {
            errorMessage =
              "La tabla especificada no existe o no está disponible.";
          } else if (
            errorText.includes("permission") ||
            errorText.includes("access")
          ) {
            errorMessage =
              "No tiene permisos para insertar registros en esta tabla.";
          }
        }

        setError(errorMessage);
      }
    } finally {
      setAddLoading(false);
    }
  };

  // Función para guardar los cambios de un registro
  const handleSaveRecord = async (updatedRecord: any) => {
    if (!selectedTable || !editingRecord || !tableStructure) return;

    setEditLoading(true);
    try {
      // Obtener información de la tabla (regular o activada)
      const selectedTableInfo = await getTableInfo(selectedTable);
      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      // Crear objeto con valores de clave primaria
      const primaryKeyValues: any = {};
      tableStructure.primaryKeys.forEach((key) => {
        primaryKeyValues[key] = editingRecord[key];
      });

      await api.put(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          record: updatedRecord,
          primaryKeyValues: primaryKeyValues,
        }
      );

      // Recargar los datos de la tabla con paginación actual
      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: recordsPerPage,
            offset: (currentPage - 1) * recordsPerPage,
          },
        }
      );
      setTableData(response.data);

      // Cerrar el modal automáticamente al guardar exitosamente
      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error: any) {
      // Manejar errores de validación de condiciones específicamente
      if (
        error.response?.data?.details &&
        Array.isArray(error.response.data.details)
      ) {
        setValidationErrors(error.response.data.details);
        setIsValidationErrorModalOpen(true);
      } else {
        // Mejorar mensajes de error para ser más expresivos
        let errorMessage = error.response?.data?.error || error.message;

        // Detectar errores específicos de SQL Server
        if (error.response?.data?.error) {
          const errorText = error.response.data.error.toLowerCase();

          if (
            errorText.includes("primary key") ||
            errorText.includes("duplicate key") ||
            errorText.includes("unique constraint")
          ) {
            errorMessage =
              "Ya existe un registro con la misma clave primaria. Verifique que los valores de clave primaria sean únicos.";
          } else if (
            errorText.includes("foreign key") ||
            errorText.includes("fk_")
          ) {
            errorMessage =
              "Los datos hacen referencia a un registro que no existe en otra tabla. Verifique las referencias.";
          } else if (
            errorText.includes("check constraint") ||
            errorText.includes("check_")
          ) {
            errorMessage =
              "Los datos no cumplen con las restricciones de validación configuradas en la tabla.";
          } else if (
            errorText.includes("cannot insert the value null") ||
            errorText.includes("null value")
          ) {
            errorMessage =
              "No se puede insertar un valor nulo en un campo requerido. Complete todos los campos obligatorios.";
          } else if (
            errorText.includes("conversion failed") ||
            errorText.includes("data type")
          ) {
            errorMessage =
              "El tipo de dato proporcionado no es compatible con el campo. Verifique el formato de los datos.";
          } else if (
            errorText.includes("string or binary data would be truncated")
          ) {
            errorMessage =
              "Los datos proporcionados exceden la longitud máxima permitida para el campo.";
          } else if (
            errorText.includes("table not found") ||
            errorText.includes("object name")
          ) {
            errorMessage =
              "La tabla especificada no existe o no está disponible.";
          } else if (
            errorText.includes("permission") ||
            errorText.includes("access")
          ) {
            errorMessage =
              "No tiene permisos para modificar registros en esta tabla.";
          }
        }

        setError(errorMessage);
      }
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
    if (!selectedTable || !tableStructure || !deletingRecord) return;

    setDeleteLoading(true);
    try {
      // Obtener información de la tabla (regular o activada)
      const selectedTableInfo = await getTableInfo(selectedTable);
      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      // Crear objeto con valores de clave primaria
      const primaryKeyValues: any = {};
      tableStructure.primaryKeys.forEach((key) => {
        primaryKeyValues[key] = deletingRecord[key];
      });

      await api.delete(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          data: { primaryKeyValues },
        }
      );

      // Recargar los datos de la tabla con paginación actual
      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: recordsPerPage,
            offset: (currentPage - 1) * recordsPerPage,
          },
        }
      );
      setTableData(response.data);

      // Actualizar el total de registros
      const newTotal = await fetchTotalRecords(dbName, selectedTable);
      setTotalRecords(newTotal);

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
    if (!selectedTable || !tableStructure) return;

    setBulkDeleteLoading(true);
    try {
      // Obtener información de la tabla (regular o activada)
      const selectedTableInfo = await getTableInfo(selectedTable);
      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      await api.delete(
        `/api/databases/${dbName}/tables/${selectedTable}/records/bulk`,
        {
          data: { records: selectedRecords },
        }
      );

      // Recargar los datos de la tabla con paginación actual
      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: recordsPerPage,
            offset: (currentPage - 1) * recordsPerPage,
          },
        }
      );
      setTableData(response.data);

      // Actualizar el total de registros
      const newTotal = await fetchTotalRecords(dbName, selectedTable);
      setTotalRecords(newTotal);

      // Limpiar selección
      setSelectedRecords([]);

      setIsBulkDeleteModalOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Función para manejar la importación de Excel completada
  const handleExcelImportComplete = async (result: any) => {
    // Recargar los datos de la tabla
    if (selectedTable) {
      // Obtener información de la tabla (regular o activada)
      const selectedTableInfo = await getTableInfo(selectedTable);
      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      // Obtener datos actualizados y total de registros en paralelo
      const [response, newTotal] = await Promise.all([
        api.get(`/api/databases/${dbName}/tables/${selectedTable}/records`, {
          params: {
            limit: recordsPerPage,
            offset: (currentPage - 1) * recordsPerPage,
          },
        }),
        fetchTotalRecords(dbName, selectedTable),
      ]);

      setTableData(response.data);
      setTotalRecords(newTotal);
    }

    // Mostrar mensaje de éxito
    const message = `Importación exitosa: ${
      result.data?.successCount || result.insertedRows || 0
    } registros insertados${
      result.data?.errorCount > 0 ? `, ${result.data.errorCount} errores` : ""
    }`;
    setImportSuccessMessage(message);

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
      setImportSuccessMessage(null);
    }, 5000);
  };

  // Función para obtener el total de registros en la tabla
  const fetchTotalRecords = async (dbName: string, tableName: string) => {
    try {
      const response = await api.get(
        `/api/databases/${dbName}/tables/${tableName}/count`
      );
      return response.data.count;
    } catch (error) {
      console.error("Error obteniendo total de registros:", error);
      return 0;
    }
  };

  // Función para cambiar de página
  const handlePageChange = async (newPage: number) => {
    if (!selectedTable) return;

    setCurrentPage(newPage);
    setLoading(true);
    setError(null);

    try {
      // Encontrar la base de datos de la tabla seleccionada
      const selectedTableInfo = tables.find(
        (table) => table.name === selectedTable
      );
      if (!selectedTableInfo) {
        throw new Error(
          "No se pudo encontrar la base de datos de la tabla seleccionada."
        );
      }

      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: recordsPerPage,
            offset: (newPage - 1) * recordsPerPage,
            filters:
              activeFilters.length > 0
                ? JSON.stringify(activeFilters)
                : undefined,
            sort: activeSort ? JSON.stringify(activeSort) : undefined,
          },
        }
      );
      setTableData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar registros por página
  const handleRecordsPerPageChange = async (newRecordsPerPage: number) => {
    if (!selectedTable) return;

    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1); // Volver a la primera página
    setLoading(true);
    setError(null);

    try {
      // Encontrar la base de datos de la tabla seleccionada
      const selectedTableInfo = tables.find(
        (table) => table.name === selectedTable
      );
      if (!selectedTableInfo) {
        throw new Error(
          "No se pudo encontrar la base de datos de la tabla seleccionada."
        );
      }

      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: newRecordsPerPage,
            offset: 0,
            filters:
              activeFilters.length > 0
                ? JSON.stringify(activeFilters)
                : undefined,
            sort: activeSort ? JSON.stringify(activeSort) : undefined,
          },
        }
      );
      setTableData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambios en los filtros
  const handleFiltersChange = async (filters: any[]) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Volver a la primera página
    await fetchTableDataWithFilters(filters, activeSort);
  };

  // Función para manejar cambios en el ordenamiento
  const handleSortChange = async (sort: any | null) => {
    setActiveSort(sort);
    setCurrentPage(1); // Volver a la primera página
    await fetchTableDataWithFilters(activeFilters, sort);
  };

  // Función para limpiar filtros
  const handleClearFilters = async () => {
    setActiveFilters([]);
    setActiveSort(null);
    setCurrentPage(1);
    await fetchTableDataWithFilters([], null);
  };

  // Función para obtener datos de la tabla con filtros
  const fetchTableDataWithFilters = async (
    filters: any[],
    sort: any | null
  ) => {
    if (!selectedTable) return;

    setLoading(true);
    setError(null);

    try {
      // Obtener información de la tabla (regular o activada)
      const selectedTableInfo = await getTableInfo(selectedTable);
      const dbName = selectedTableInfo.database || selectedTableInfo.schema;

      const response = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/records`,
        {
          params: {
            limit: recordsPerPage,
            offset: 0,
            filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
            sort: sort ? JSON.stringify(sort) : undefined,
          },
        }
      );
      setTableData(response.data);

      // Actualizar el total de registros con filtros
      const countResponse = await api.get(
        `/api/databases/${dbName}/tables/${selectedTable}/count`,
        {
          params: {
            filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
          },
        }
      );
      setTotalRecords(countResponse.data.count);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar todas las tablas accesibles
  const fetchAccessibleTables = async () => {
    if (!isAuthenticated) return;

    try {
      // Obtener solo las bases de datos a las que el usuario tiene acceso
      const res = await api.get("/api/databases");
      const dbList = res.data;

      const allTables: TableInfo[] = [];
      for (const db of dbList) {
        // Saltar la base de datos de la aplicación
        if (db === APP_DATABASE) {
          console.log(`Omitiendo base de datos de la aplicación: ${db}`);
          continue;
        }

        try {
          const tablesResponse = await api.get(`/api/databases/${db}/tables`);
          const dbTables = tablesResponse.data.map((table: any) => ({
            ...table,
            database: db,
          }));
          allTables.push(...dbTables);
        } catch (error: any) {
          // Solo loggear el error, no fallar completamente
          console.warn(
            `No se pudieron cargar las tablas de ${db}: ${
              error.response?.data?.error || error.message
            }`
          );
          // Continuar con las otras bases de datos
        }
      }
      setTables(allTables);
    } catch (error) {
      console.error("Error fetching accessible databases:", error);
      setTables([]);
    }
  };

  // Fetch accessible databases and their tables on mount
  useEffect(() => {
    fetchAccessibleTables();
  }, [isAuthenticated]);

  // Configurar la función de actualización en el contexto
  useEffect(() => {
    setRefreshTables(() => fetchAccessibleTables);
  }, [isAuthenticated, setRefreshTables]);

  // Eliminar el useEffect que dependía de selectedDb ya que ahora cargamos todas las tablas al inicio

  // Función para cargar datos de la tabla
  const loadTableData = async () => {
    if (selectedTable && selectedTable.trim() !== "" && isAuthenticated) {
      setLoading(true);
      setError(null);
      setCurrentPage(1); // Reset a la primera página cuando cambia la tabla
      setActiveFilters([]); // Reset filtros cuando cambia la tabla
      setActiveSort(null); // Reset ordenamiento cuando cambia la tabla

      try {
        // Obtener información de la tabla (regular o activada)
        const selectedTableInfo = await getTableInfo(selectedTable);
        const dbName = selectedTableInfo.database || selectedTableInfo.schema;

        // Obtener datos de la tabla, estructura y total de registros en paralelo
        const [tableResponse, , totalCount] = await Promise.all([
          api.get(`/api/databases/${dbName}/tables/${selectedTable}/records`, {
            params: {
              limit: recordsPerPage,
              offset: 0,
            },
          }),
          fetchTableStructure(dbName, selectedTable),
          fetchTotalRecords(dbName, selectedTable),
        ]);

        setTableData(tableResponse.data);
        setTotalRecords(totalCount);
      } catch (error: any) {
        setError(error.message || "Error obteniendo información de la tabla");
      } finally {
        setLoading(false);
      }
    } else {
      setTableData(null);
      setTableStructure(null);
      setError(null);
      setTotalRecords(0);
    }
  };

  // Fetch table data when table changes
  useEffect(() => {
    loadTableData();
  }, [selectedTable, isAuthenticated, recordsPerPage, tables]);

  // Función para descargar template de Excel
  const handleDownloadTemplate = async () => {
    if (!tableData?.database || !tableData?.table) {
      setError("No se ha seleccionado una tabla");
      return;
    }

    setDownloadingTemplate(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/databases/${tableData.database}/tables/${tableData.table}/download-template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al descargar el template");
      }

      // Crear un enlace temporal para descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `template_${tableData.table}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.message || "Error al descargar el template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Bienvenido,{" "}
                <span className="font-semibold break-all">
                  {currentUser?.username}
                </span>
                {currentUser?.isAdmin && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {currentUser?.isAdmin && (
                <>
                  <Button
                    onClick={() => setCurrentView("users")}
                    variant={currentView === "users" ? "default" : "outline"}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">
                      Gestión de Usuarios
                    </span>
                    <span className="sm:hidden">Usuarios</span>
                  </Button>
                  <Button
                    onClick={() => setCurrentView("logs")}
                    variant={currentView === "logs" ? "default" : "outline"}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Logs del Sistema</span>
                    <span className="sm:hidden">Logs</span>
                  </Button>
                  <Button
                    onClick={() => setCurrentView("activated-tables")}
                    variant={
                      currentView === "activated-tables" ? "default" : "outline"
                    }
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Tablas Activadas</span>
                    <span className="sm:hidden">Tablas</span>
                  </Button>
                </>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Mensaje de éxito de importación */}
        {importSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
                <span className="text-green-800 font-medium">
                  {importSuccessMessage}
                </span>
              </div>
              <button
                onClick={() => setImportSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
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
              </button>
            </div>
          </div>
        )}

        {currentView === "users" ? (
          <>
            <div className="mb-6">
              <Button
                onClick={() => setCurrentView("database")}
                variant="outline"
                className="mb-4"
              >
                ← Volver a las tablas
              </Button>
            </div>
            {(() => {
              console.log(
                "🔍 Debug: Token en App.tsx antes de pasar a UserManagement:",
                token
              );

              return (
                <UserManagement
                  token={token!}
                  isAdmin={currentUser?.isAdmin || false}
                  api={api}
                />
              );
            })()}
          </>
        ) : currentView === "logs" ? (
          <>
            <div className="mb-6">
              <Button
                onClick={() => setCurrentView("database")}
                variant="outline"
                className="mb-4"
              >
                ← Volver a las tablas
              </Button>
            </div>
            <LogsViewer />
          </>
        ) : currentView === "activated-tables" ? (
          <>
            <div className="mb-6">
              <Button
                onClick={() => setCurrentView("database")}
                variant="outline"
                className="mb-4"
              >
                ← Volver a las tablas
              </Button>
            </div>
            <ActivatedTablesManager />
          </>
        ) : (
          <>
            {/* Vista de tarjetas de tablas */}
            {tables.length > 0 && showTableCards && (
              <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    Selecciona una tabla para gestionar
                  </h2>
                </div>
                <TableCards
                  tables={tables}
                  onTableSelect={handleTableSelect}
                  selectedTable={selectedTable}
                />
              </div>
            )}

            {/* Botón para volver a las tarjetas */}
            {selectedTable && !showTableCards && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowTableCards(true)}
                  variant="outline"
                  className="mb-4"
                >
                  ← Volver a la selección de tablas
                </Button>
              </div>
            )}

            {/* Data Section */}
            {selectedTable && !showTableCards && (
              <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg backdrop-blur-sm">
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
                    <div className="max-w-md w-full">
                      <div className="bg-destructive/10 px-6 py-4 rounded-lg border border-destructive/20">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-destructive mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-destructive mb-1">
                              Error de Operación
                            </h3>
                            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                              {error}
                            </div>
                            <button
                              onClick={() => setError(null)}
                              className="mt-3 text-xs text-destructive hover:text-destructive/80 underline"
                            >
                              Cerrar mensaje
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tableData && (
                  <div>
                    <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                            Datos de {tableData.database}.{tableData.table}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {tableData.count > 0
                              ? `Mostrando ${tableData.count} registros`
                              : "No hay registros en esta tabla"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-[#eea92d] hover:bg-[#d99a28] text-black text-xs sm:text-sm"
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
                            <span className="hidden sm:inline">
                              Agregar Registro
                            </span>
                            <span className="sm:hidden">Agregar</span>
                          </Button>
                          <Button
                            onClick={() => setIsExcelImportModalOpen(true)}
                            className="bg-[#0d206c] hover:bg-[#0a1a5a] text-white text-xs sm:text-sm"
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
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                              />
                            </svg>
                            <span className="hidden sm:inline">
                              Importar Excel
                            </span>
                            <span className="sm:hidden">Importar</span>
                          </Button>
                          <Button
                            onClick={() => setIsExcelExportModalOpen(true)}
                            className="bg-[#0d206c] hover:bg-[#0a1a5a] text-white text-xs sm:text-sm"
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                              />
                            </svg>
                            <span className="hidden sm:inline">
                              Exportar Excel
                            </span>
                            <span className="sm:hidden">Exportar</span>
                          </Button>
                          <Button
                            onClick={handleDownloadTemplate}
                            className="bg-[#0d206c] hover:bg-[#0a1a5a] text-white text-xs sm:text-sm"
                            disabled={downloadingTemplate}
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
                            <span className="hidden sm:inline">
                              {downloadingTemplate
                                ? "Descargando..."
                                : "Descargar Template"}
                            </span>
                            <span className="sm:hidden">
                              {downloadingTemplate
                                ? "Descargando..."
                                : "Template"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Componente de filtros avanzados - Siempre visible cuando hay tabla seleccionada */}
                    {tableStructure && (
                      <AdvancedFilters
                        columns={tableStructure.columns}
                        onFiltersChange={handleFiltersChange}
                        onSortChange={handleSortChange}
                        onClearFilters={handleClearFilters}
                        activeFilters={activeFilters}
                        activeSort={activeSort}
                      />
                    )}

                    {tableData.data.length > 0 ? (
                      <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
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

                        <div className="min-w-full">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-semibold text-foreground w-12 whitespace-nowrap">
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
                                    className="font-semibold text-foreground text-left whitespace-nowrap"
                                  >
                                    {col}
                                  </TableHead>
                                ))}
                                <TableHead className="font-semibold text-foreground w-32 whitespace-nowrap">
                                  Acciones
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.data.map((row, i) => {
                                const isSelected = selectedRecords.some(
                                  (record) =>
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
                                        className="text-sm text-left"
                                      >
                                        {row[col] === null ? (
                                          <span className="text-muted-foreground italic">
                                            null
                                          </span>
                                        ) : (
                                          formatCellValue(
                                            row[col],
                                            col,
                                            tableStructure
                                          )
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
                                          onClick={() =>
                                            handleDeleteRecord(row)
                                          }
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

                        {/* Componente de paginación */}
                        {totalRecords > 0 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(
                              totalRecords / recordsPerPage
                            )}
                            totalRecords={totalRecords}
                            recordsPerPage={recordsPerPage}
                            onPageChange={handlePageChange}
                            onRecordsPerPageChange={handleRecordsPerPageChange}
                          />
                        )}
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
                            {activeFilters.length > 0
                              ? "No se encontraron registros con los filtros aplicados"
                              : "No hay registros en esta tabla"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeFilters.length > 0
                              ? "Intenta ajustar los filtros o usar 'Limpiar Todo' para ver todos los registros"
                              : "La tabla está vacía o no contiene datos"}
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
            )}
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

        {/* Modal de importación de Excel */}
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          databaseName={
            selectedTable
              ? tables.find((t) => t.name === selectedTable)?.database || ""
              : ""
          }
          tableName={selectedTable || ""}
          token={token || ""}
          onImportComplete={handleExcelImportComplete}
        />

        {/* Modal de exportación de Excel */}
        <ExcelExportModal
          isOpen={isExcelExportModalOpen}
          onClose={() => setIsExcelExportModalOpen(false)}
          databaseName={
            selectedTable
              ? tables.find((t) => t.name === selectedTable)?.database || ""
              : ""
          }
          tableName={selectedTable || ""}
          currentPage={currentPage}
          recordsPerPage={recordsPerPage}
          totalRecords={totalRecords}
          token={token || ""}
        />

        {/* Modal de errores de validación */}
        <ValidationErrorModal
          isOpen={isValidationErrorModalOpen}
          onClose={() => {
            setIsValidationErrorModalOpen(false);
            setValidationErrors([]);
          }}
          errors={validationErrors}
          title="Errores de Validación de Condiciones"
        />
      </div>
    </div>
  );
}

export default App;
