import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { formatDate } from "../lib/dateUtils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { useTableContext } from "../contexts/TableContext";

interface DatabaseInfo {
  DatabaseName: string;
}

interface TableInfo {
  TableName: string;
  SchemaName: string;
}

interface ActivatedTable {
  Id: number;
  DatabaseName: string;
  TableName: string;
  IsActive: boolean;
  Description: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedByUsername: string;
  UpdatedByUsername: string;
}

interface ColumnStructure {
  ColumnName: string;
  DataType: string;
  IsNullable: string;
  MaxLength: number | null;
  DefaultValue: string | null;
  Position: number;
}

interface TableCondition {
  id?: number;
  columnName: string;
  dataType: string;
  conditionType: string;
  conditionValue: string;
  isRequired: boolean;
}

const ActivatedTablesManager: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activatedTables, setActivatedTables] = useState<ActivatedTable[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableStructure, setTableStructure] = useState<ColumnStructure[]>([]);
  const [conditions, setConditions] = useState<TableCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [currentView, setCurrentView] = useState<
    "list" | "activate" | "manage" | "edit"
  >("list");
  const [editingTable, setEditingTable] = useState<ActivatedTable | null>(null);

  // Contexto para comunicación con App.tsx
  const { refreshTables } = useTableContext();

  const api = {
    get: async (url: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    post: async (url: string, data: any) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001${url}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    put: async (url: string, data: any) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001${url}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  };

  const fetchDatabases = async () => {
    try {
      const data = await api.get("/api/activated-tables/databases");
      setDatabases(data);
    } catch (err) {
      console.error("Error fetching databases:", err);
    }
  };

  const fetchTablesByDatabase = async (databaseName: string) => {
    try {
      const data = await api.get(
        `/api/activated-tables/tables/${databaseName}`
      );
      setTables(data);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  const fetchActivatedTables = async () => {
    try {
      const data = await api.get("/api/activated-tables/activated");
      setActivatedTables(data);
    } catch (err) {
      console.error("Error fetching activated tables:", err);
    }
  };

  const fetchTableStructure = async (
    databaseName: string,
    tableName: string
  ) => {
    try {
      console.log(
        `🔍 Fetching table structure for ${databaseName}.${tableName}`
      );
      const data = await api.get(
        `/api/activated-tables/structure/${databaseName}/${tableName}`
      );
      console.log(`✅ Table structure received:`, data);
      setTableStructure(data);

      // Inicializar condiciones vacías para cada columna
      const initialConditions: TableCondition[] = data.map(
        (column: ColumnStructure) => ({
          columnName: column.ColumnName,
          dataType: getDataType(column.DataType),
          conditionType: "",
          conditionValue: "",
          isRequired: false,
        })
      );
      console.log(`✅ Initial conditions created:`, initialConditions);
      setConditions(initialConditions);
    } catch (err) {
      console.error("Error fetching table structure:", err);
    }
  };

  const fetchTableConditions = async (
    databaseName: string,
    tableName: string
  ) => {
    try {
      const data = await api.get(
        `/api/activated-tables/conditions/${databaseName}/${tableName}`
      );

      console.log(`🔍 Raw conditions from database:`, data);

      // Convertir las condiciones del backend al formato del frontend
      const convertedConditions: TableCondition[] = data.map(
        (condition: any) => ({
          id: condition.Id,
          columnName: condition.ColumnName,
          dataType: condition.DataType,
          conditionType: condition.ConditionType || "",
          conditionValue: condition.ConditionValue || "",
          isRequired: condition.IsRequired || false,
        })
      );

      // Solo actualizar las condiciones si hay datos, sino mantener las iniciales
      if (convertedConditions.length > 0) {
        console.log(`✅ Conditions loaded from database:`, convertedConditions);
        setConditions(convertedConditions);
      } else {
        console.log(
          `ℹ️ No conditions found in database, keeping initial conditions`
        );
      }
    } catch (err) {
      console.error("Error fetching table conditions:", err);
      console.log(`ℹ️ Error loading conditions, keeping initial conditions`);
    }
  };

  const handleEditTable = async (table: ActivatedTable) => {
    setEditingTable(table);
    setSelectedDatabase(table.DatabaseName);
    setSelectedTable(table.TableName);
    setDescription(table.Description);

    // Cargar estructura y condiciones
    await fetchTableStructure(table.DatabaseName, table.TableName);
    await fetchTableConditions(table.DatabaseName, table.TableName);

    setCurrentView("edit");
  };

  const handleUpdateConditions = async () => {
    if (!editingTable) return;

    try {
      setLoading(true);

      // Filtrar condiciones que tienen configuración (excluir "none")
      const activeConditions = conditions.filter(
        (condition) =>
          condition.conditionType &&
          condition.conditionType !== "none" &&
          condition.conditionValue
      );

      await api.put(
        `/api/activated-tables/conditions/${editingTable.DatabaseName}/${editingTable.TableName}`,
        {
          conditions: activeConditions,
        }
      );

      setError(null);
      setCurrentView("list");
      setEditingTable(null);
      fetchActivatedTables();
    } catch (err: any) {
      setError(err.message || "Error actualizando condiciones");
    } finally {
      setLoading(false);
    }
  };

  const getDataType = (sqlDataType: string): string => {
    const type = sqlDataType.toLowerCase();
    if (
      type.includes("char") ||
      type.includes("text") ||
      type.includes("varchar")
    ) {
      return "string";
    } else if (
      type.includes("int") ||
      type.includes("decimal") ||
      type.includes("float") ||
      type.includes("numeric")
    ) {
      return "numeric";
    } else if (type.includes("date") || type.includes("time")) {
      return "date";
    } else if (type.includes("bit") || type.includes("bool")) {
      return "boolean";
    }
    return "string"; // default
  };

  const getConditionTypes = (dataType: string) => {
    switch (dataType) {
      case "string":
        return [
          { value: "length", label: "Longitud (min/max)" },
          { value: "contains", label: "Contiene texto" },
          { value: "regex", label: "Expresión regular" },
          { value: "starts_with", label: "Comienza con" },
          { value: "ends_with", label: "Termina con" },
        ];
      case "numeric":
        return [
          { value: "range", label: "Rango (min/max)" },
          { value: "min", label: "Valor mínimo" },
          { value: "max", label: "Valor máximo" },
        ];
      case "date":
        return [
          { value: "range", label: "Rango de fechas" },
          { value: "before", label: "Antes de" },
          { value: "after", label: "Después de" },
        ];
      case "boolean":
        return [{ value: "value", label: "Valor específico" }];
      default:
        return [];
    }
  };

  const handleActivateTable = async () => {
    if (!selectedDatabase || !selectedTable || !description.trim()) {
      setError(
        "Debe seleccionar una base de datos, una tabla y proporcionar una descripción"
      );
      return;
    }

    try {
      setLoading(true);

      // Filtrar condiciones que tienen configuración (excluir "none")
      const activeConditions = conditions.filter(
        (condition) =>
          condition.conditionType &&
          condition.conditionType !== "none" &&
          condition.conditionValue
      );

      await api.post("/api/activated-tables/activate", {
        databaseName: selectedDatabase,
        tableName: selectedTable,
        description: description.trim(),
        conditions: activeConditions,
      });

      setError(null);
      setCurrentView("list");
      fetchActivatedTables();

      // Actualizar la lista de tablas en App.tsx
      if (typeof refreshTables === "function") {
        refreshTables();
      }
    } catch (err: any) {
      setError(err.message || "Error activando tabla");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateTable = async (table: ActivatedTable) => {
    try {
      await api.post("/api/activated-tables/deactivate", {
        databaseName: table.DatabaseName,
        tableName: table.TableName,
      });

      fetchActivatedTables();

      // Actualizar la lista de tablas en App.tsx
      if (typeof refreshTables === "function") {
        refreshTables();
      }
    } catch (err: any) {
      setError(err.message || "Error desactivando tabla");
    }
  };

  const handleConditionChange = (
    index: number,
    field: keyof TableCondition,
    value: any
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const addConditionForColumn = (columnName: string, dataType: string) => {
    const newCondition: TableCondition = {
      columnName,
      dataType,
      conditionType: "",
      conditionValue: "",
      isRequired: false,
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const getConditionsForColumn = (columnName: string) => {
    return conditions.filter(
      (condition) => condition.columnName === columnName
    );
  };

  const renderConditionInput = (condition: TableCondition, index: number) => {
    const { dataType, conditionType } = condition;

    switch (conditionType) {
      case "length":
        const currentValue = condition.conditionValue
          ? JSON.parse(condition.conditionValue)
          : {};
        return (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={currentValue.min || ""}
              className="flex-1 px-2 py-1 border rounded text-gray-900 bg-white"
              onChange={(e) => {
                const value = JSON.stringify({
                  ...currentValue,
                  min: parseInt(e.target.value) || undefined,
                });
                handleConditionChange(index, "conditionValue", value);
              }}
            />
            <input
              type="number"
              placeholder="Max"
              value={currentValue.max || ""}
              className="flex-1 px-2 py-1 border rounded text-gray-900 bg-white"
              onChange={(e) => {
                const value = JSON.stringify({
                  ...currentValue,
                  max: parseInt(e.target.value) || undefined,
                });
                handleConditionChange(index, "conditionValue", value);
              }}
            />
          </div>
        );

      case "contains":
      case "starts_with":
      case "ends_with":
        return (
          <input
            type="text"
            placeholder="Texto"
            value={
              condition.conditionValue
                ? JSON.parse(condition.conditionValue).text || ""
                : ""
            }
            className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
            onChange={(e) => {
              const value = JSON.stringify({ text: e.target.value });
              handleConditionChange(index, "conditionValue", value);
            }}
          />
        );

      case "regex":
        return (
          <input
            type="text"
            placeholder="Patrón regex"
            value={
              condition.conditionValue
                ? JSON.parse(condition.conditionValue).pattern || ""
                : ""
            }
            className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
            onChange={(e) => {
              const value = JSON.stringify({ pattern: e.target.value });
              handleConditionChange(index, "conditionValue", value);
            }}
          />
        );

      case "range":
        if (dataType === "numeric") {
          const currentValue = condition.conditionValue
            ? JSON.parse(condition.conditionValue)
            : {};
          return (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={currentValue.min || ""}
                className="flex-1 px-2 py-1 border rounded text-gray-900 bg-white"
                onChange={(e) => {
                  const value = JSON.stringify({
                    ...currentValue,
                    min: parseFloat(e.target.value) || undefined,
                  });
                  handleConditionChange(index, "conditionValue", value);
                }}
              />
              <input
                type="number"
                placeholder="Max"
                value={currentValue.max || ""}
                className="flex-1 px-2 py-1 border rounded text-gray-900 bg-white"
                onChange={(e) => {
                  const value = JSON.stringify({
                    ...currentValue,
                    max: parseFloat(e.target.value) || undefined,
                  });
                  handleConditionChange(index, "conditionValue", value);
                }}
              />
            </div>
          );
        } else if (dataType === "date") {
          const currentValue = condition.conditionValue
            ? JSON.parse(condition.conditionValue)
            : {};
          return (
            <div className="flex gap-2">
              <input
                type="date"
                value={currentValue.min || ""}
                className="flex-1 px-2 py-1 border rounded text-gray-900 bg-white"
                onChange={(e) => {
                  const value = JSON.stringify({
                    ...currentValue,
                    min: e.target.value,
                  });
                  handleConditionChange(index, "conditionValue", value);
                }}
              />
              <input
                type="date"
                value={currentValue.max || ""}
                className="flex-1 px-2 py-1 border rounded text-gray-900 bg-white"
                onChange={(e) => {
                  const value = JSON.stringify({
                    ...currentValue,
                    max: e.target.value,
                  });
                  handleConditionChange(index, "conditionValue", value);
                }}
              />
            </div>
          );
        }
        break;

      case "min":
      case "max":
        return (
          <input
            type="number"
            placeholder="Valor"
            value={
              condition.conditionValue
                ? JSON.parse(condition.conditionValue).value || ""
                : ""
            }
            className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
            onChange={(e) => {
              const value = JSON.stringify({
                value: parseFloat(e.target.value) || 0,
              });
              handleConditionChange(index, "conditionValue", value);
            }}
          />
        );

      case "before":
      case "after":
        return (
          <input
            type="date"
            value={
              condition.conditionValue
                ? JSON.parse(condition.conditionValue).date || ""
                : ""
            }
            className="w-full px-2 py-1 border rounded text-gray-900 bg-white"
            onChange={(e) => {
              const value = JSON.stringify({ date: e.target.value });
              handleConditionChange(index, "conditionValue", value);
            }}
          />
        );

      case "value":
        return (
          <Select
            value={
              condition.conditionValue
                ? JSON.parse(condition.conditionValue).expected?.toString()
                : ""
            }
            onValueChange={(value) => {
              const boolValue = value === "true";
              const jsonValue = JSON.stringify({ expected: boolValue });
              handleConditionChange(index, "conditionValue", jsonValue);
            }}
          >
            <SelectTrigger className="w-full bg-primary text-white border-primary">
              <SelectValue placeholder="Seleccionar valor" />
            </SelectTrigger>
            <SelectContent className="bg-primary text-white">
              <SelectItem value="true" className="text-white hover:bg-accent">
                Verdadero
              </SelectItem>
              <SelectItem value="false" className="text-white hover:bg-accent">
                Falso
              </SelectItem>
            </SelectContent>
          </Select>
        );
    }

    return null;
  };

  useEffect(() => {
    fetchDatabases();
    fetchActivatedTables();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedDatabase && selectedTable) {
      fetchTableStructure(selectedDatabase, selectedTable);
    }
  }, [selectedDatabase, selectedTable]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Gestión de Tablas Activadas
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentView("list")}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentView === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setCurrentView("activate")}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentView === "activate"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Activar Tabla
          </button>
        </div>
      </div>

      {error && (
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
      )}

      {currentView === "list" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tablas Activadas ({activatedTables.length})
          </h3>

          {activatedTables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay tablas activadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base de Datos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tabla
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Actualización
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activatedTables.map((table) => (
                    <tr key={table.Id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {table.DatabaseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {table.TableName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {table.Description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            table.IsActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {table.IsActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(table.CreatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(table.UpdatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTable(table)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeactivateTable(table)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {currentView === "activate" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Activar Nueva Tabla
          </h3>

          <div className="space-y-4">
            {/* Selección de base de datos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Base de Datos
              </label>
              <Select
                value={selectedDatabase}
                onValueChange={(value) => {
                  setSelectedDatabase(value);
                  setSelectedTable(""); // Reset tabla cuando cambia la BD
                  fetchTablesByDatabase(value);
                }}
              >
                <SelectTrigger className="w-full bg-primary text-white border-primary">
                  <SelectValue placeholder="Seleccionar base de datos" />
                </SelectTrigger>
                <SelectContent className="bg-primary text-white">
                  {databases.map((db) => (
                    <SelectItem
                      key={db.DatabaseName}
                      value={db.DatabaseName}
                      className="text-white hover:bg-accent"
                    >
                      {db.DatabaseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selección de tabla */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Tabla
              </label>
              <Select
                value={selectedTable}
                onValueChange={(value) => {
                  setSelectedTable(value);
                }}
                disabled={!selectedDatabase}
              >
                <SelectTrigger className="w-full bg-primary text-white border-primary">
                  <SelectValue placeholder="Seleccionar tabla para activar" />
                </SelectTrigger>
                <SelectContent className="bg-primary text-white">
                  {tables.map((table) => (
                    <SelectItem
                      key={table.TableName}
                      value={table.TableName}
                      className="text-white hover:bg-accent"
                    >
                      {table.TableName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la tabla..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows={3}
              />
            </div>

            {/* Estructura y condiciones */}
            {(() => {
              console.log(`🔍 Render debug:`, {
                selectedDatabase,
                selectedTable,
                tableStructureLength: tableStructure.length,
                conditionsLength: conditions.length,
              });
              return (
                selectedDatabase && selectedTable && tableStructure.length > 0
              );
            })() && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Configurar Condiciones por Columna
                </h4>
                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {condition.columnName}
                          </h5>
                          <p className="text-sm text-gray-500">
                            Tipo: {condition.dataType}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={condition.isRequired}
                              onChange={(e) =>
                                handleConditionChange(
                                  index,
                                  "isRequired",
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-900">
                              Requerido
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Condición
                          </label>
                          <Select
                            value={condition.conditionType}
                            onValueChange={(value) =>
                              handleConditionChange(
                                index,
                                "conditionType",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="bg-primary text-white border-primary">
                              <SelectValue placeholder="Seleccionar condición" />
                            </SelectTrigger>
                            <SelectContent className="bg-primary text-white">
                              <SelectItem
                                value="none"
                                className="text-white hover:bg-accent"
                              >
                                Sin condición
                              </SelectItem>
                              {getConditionTypes(condition.dataType).map(
                                (type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                    className="text-white hover:bg-accent"
                                  >
                                    {type.label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor de Condición
                          </label>
                          {renderConditionInput(condition, index)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleActivateTable}
                disabled={
                  !selectedDatabase ||
                  !selectedTable ||
                  !description.trim() ||
                  loading
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Activando..." : "Activar Tabla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista de edición de condiciones */}
      {currentView === "edit" && editingTable && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Editar Condiciones - {editingTable.DatabaseName}.
            {editingTable.TableName}
          </h3>

          <div className="space-y-4">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la tabla..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows={3}
              />
            </div>

            {/* Estructura y condiciones */}
            {(() => {
              console.log(`🔍 Edit view debug:`, {
                tableStructureLength: tableStructure.length,
                conditionsLength: conditions.length,
                currentView,
              });
              return tableStructure.length > 0;
            })() && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Configurar Condiciones por Columna
                </h4>
                <div className="space-y-6">
                  {tableStructure.map((column) => {
                    const columnConditions = getConditionsForColumn(
                      column.ColumnName
                    );
                    const dataType = getDataType(column.DataType);

                    return (
                      <div
                        key={column.ColumnName}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {column.ColumnName}
                            </h5>
                            <p className="text-sm text-gray-500">
                              Tipo: {dataType} ({column.DataType})
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              addConditionForColumn(column.ColumnName, dataType)
                            }
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            + Agregar Condición
                          </button>
                        </div>

                        {columnConditions.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            No hay condiciones configuradas para esta columna
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {columnConditions.map((condition, index) => {
                              const globalIndex = conditions.findIndex(
                                (c) => c === condition
                              );
                              return (
                                <div
                                  key={globalIndex}
                                  className="border-l-4 border-blue-200 pl-4 py-2"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                      Condición {index + 1}
                                    </span>
                                    <button
                                      onClick={() =>
                                        removeCondition(globalIndex)
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Eliminar
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Condición
                                      </label>
                                      <Select
                                        value={condition.conditionType}
                                        onValueChange={(value) =>
                                          handleConditionChange(
                                            globalIndex,
                                            "conditionType",
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="bg-primary text-white border-primary">
                                          <SelectValue placeholder="Seleccionar condición" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-primary text-white">
                                          <SelectItem
                                            value="none"
                                            className="text-white hover:bg-accent"
                                          >
                                            Sin condición
                                          </SelectItem>
                                          {getConditionTypes(
                                            condition.dataType
                                          ).map((type) => (
                                            <SelectItem
                                              key={type.value}
                                              value={type.value}
                                              className="text-white hover:bg-accent"
                                            >
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valor de Condición
                                      </label>
                                      {renderConditionInput(
                                        condition,
                                        globalIndex
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2">
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={condition.isRequired}
                                        onChange={(e) =>
                                          handleConditionChange(
                                            globalIndex,
                                            "isRequired",
                                            e.target.checked
                                          )
                                        }
                                        className="mr-2"
                                      />
                                      <span className="text-sm text-gray-900">
                                        Requerido
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setCurrentView("list");
                  setEditingTable(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateConditions}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Actualizando..." : "Actualizar Condiciones"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivatedTablesManager;
