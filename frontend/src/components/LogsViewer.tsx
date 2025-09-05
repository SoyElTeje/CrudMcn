import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pagination } from "./Pagination";
import DateInput from "./ui/DateInput";
// API configuration
const API_BASE_URL = import.meta.env.VITE_CURRENT_IP || "http://localhost:3001";

interface LogEntry {
  Id: number;
  UserId: number;
  Username: string;
  Action: "INSERT" | "UPDATE" | "DELETE" | "EXPORT";
  DatabaseName: string;
  TableName: string;
  RecordId: string | null;
  OldData: any;
  NewData: any;
  AffectedRows: number;
  Timestamp: string;
  IPAddress: string | null;
  UserAgent: string | null;
}

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: "",
    databaseName: "",
    tableName: "",
    username: "",
    startDate: "",
    endDate: "",
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  const api = {
    get: async (url: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL.replace("/api", "")}${url}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      // Agregar parámetros de paginación
      queryParams.append("limit", recordsPerPage.toString());
      queryParams.append(
        "offset",
        ((currentPage - 1) * recordsPerPage).toString()
      );

      const url = `/api/logs/all?${queryParams.toString()}`;
      const data = await api.get(url);

      // El backend ahora devuelve un objeto con data y metadatos de paginación
      if (data.data) {
        setLogs(data.data);
        setTotalRecords(data.totalRecords);
      } else {
        // Fallback para compatibilidad con respuesta anterior
        setLogs(data);
        setTotalRecords(data.length);
      }
      setError(null);
    } catch (err) {
      setError("Error al cargar los logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters, currentPage, recordsPerPage]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "text-green-600 bg-green-100";
      case "UPDATE":
        return "text-blue-600 bg-blue-100";
      case "DELETE":
        return "text-red-600 bg-red-100";
      case "EXPORT":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es });
    } catch {
      return timestamp;
    }
  };

  const truncateData = (data: any) => {
    if (!data) return "N/A";
    const str = JSON.stringify(data);
    return str.length > 100 ? str.substring(0, 100) + "..." : str;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      databaseName: "",
      tableName: "",
      username: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1); // Reset a la primera página al limpiar filtros
  };

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Función para cambiar registros por página
  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1); // Volver a la primera página
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Sistema de Logs</h2>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Todas</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="EXPORT">EXPORT</option>
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
              placeholder="Filtrar por base de datos"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tabla
            </label>
            <input
              type="text"
              value={filters.tableName}
              onChange={(e) => handleFilterChange("tableName", e.target.value)}
              placeholder="Filtrar por tabla"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={filters.username}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              placeholder="Filtrar por usuario"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <DateInput
              label="Fecha Inicio"
              value={filters.startDate}
              onChange={(value) => handleFilterChange("startDate", value)}
              placeholder="DD/MM/AAAA"
            />
          </div>

          <div>
            <DateInput
              label="Fecha Fin"
              value={filters.endDate}
              onChange={(value) => handleFilterChange("endDate", value)}
              placeholder="DD/MM/AAAA"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Logs del Sistema ({totalRecords} registros totales)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base de Datos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                        log.Action
                      )}`}
                    >
                      {log.Action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.Username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.DatabaseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.TableName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.AffectedRows}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(log.Timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <details className="cursor-pointer">
                      <summary className="hover:text-blue-600">
                        Ver detalles
                      </summary>
                      <div className="mt-2 space-y-2 text-xs">
                        {log.RecordId && (
                          <div>
                            <strong>ID:</strong> {log.RecordId}
                          </div>
                        )}
                        {log.OldData && (
                          <div>
                            <strong>Datos Anteriores:</strong>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {truncateData(log.OldData)}
                            </pre>
                          </div>
                        )}
                        {log.NewData && (
                          <div>
                            <strong>Datos Nuevos:</strong>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {truncateData(log.NewData)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No se encontraron logs con los filtros aplicados
            </p>
          </div>
        )}

        {/* Componente de paginación */}
        {totalRecords > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalRecords / recordsPerPage)}
            totalRecords={totalRecords}
            recordsPerPage={recordsPerPage}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default LogsViewer;
