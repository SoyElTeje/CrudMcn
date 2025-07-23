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
import { Pagination } from "./Pagination";

interface Log {
  Id: number;
  UserId: number | null;
  Username: string;
  Action: string;
  DatabaseName: string | null;
  TableName: string | null;
  RecordId: string | null;
  OldValues: string | null;
  NewValues: string | null;
  Query: string | null;
  IPAddress: string | null;
  UserAgent: string | null;
  Timestamp: string;
  Status: string;
  ErrorMessage: string | null;
}

interface LogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export function LogsViewer({
  isOpen,
  onClose,
  getAuthHeaders,
}: LogsViewerProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    username: "",
    action: "",
    databaseName: "",
    tableName: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      const response = await axios.get(
        `http://localhost:3001/api/logs?${params}`,
        { headers: getAuthHeaders() }
      );

      setLogs(response.data.logs);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      setError(error.response?.data?.error || "Error al cargar los logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, currentPage, pageSize, filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      username: "",
      action: "",
      databaseName: "",
      tableName: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "IMPORT":
        return "bg-purple-100 text-purple-800";
      case "LOGIN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "SUCCESS"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Logs de Auditoría
          </h2>
          <Button
            onClick={onClose}
            variant="outline"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-5 h-5"
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

        {/* Filtros */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={filters.username}
                onChange={(e) => handleFilterChange("username", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filtrar por usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las acciones</option>
                <option value="CREATE">Crear</option>
                <option value="UPDATE">Actualizar</option>
                <option value="DELETE">Eliminar</option>
                <option value="IMPORT">Importar</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base de Datos
              </label>
              <input
                type="text"
                value={filters.databaseName}
                onChange={(e) =>
                  handleFilterChange("databaseName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filtrar por base de datos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tabla
              </label>
              <input
                type="text"
                value={filters.tableName}
                onChange={(e) =>
                  handleFilterChange("tableName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filtrar por tabla"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicial
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Final
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Tabla de logs */}
        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando logs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Base de Datos</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>ID Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.Id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.Timestamp)}
                    </TableCell>
                    <TableCell>{log.Username}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                          log.Action
                        )}`}
                      >
                        {log.Action}
                      </span>
                    </TableCell>
                    <TableCell>{log.DatabaseName || "-"}</TableCell>
                    <TableCell>{log.TableName || "-"}</TableCell>
                    <TableCell>{log.RecordId || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          log.Status
                        )}`}
                      >
                        {log.Status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {log.OldValues && (
                          <div className="text-xs">
                            <strong>Antes:</strong> {log.OldValues}
                          </div>
                        )}
                        {log.NewValues && (
                          <div className="text-xs">
                            <strong>Después:</strong> {log.NewValues}
                          </div>
                        )}
                        {log.ErrorMessage && (
                          <div className="text-xs text-red-600">
                            <strong>Error:</strong> {log.ErrorMessage}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginación */}
        {!loading && !error && logs.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No se encontraron logs</p>
          </div>
        )}
      </div>
    </div>
  );
}
