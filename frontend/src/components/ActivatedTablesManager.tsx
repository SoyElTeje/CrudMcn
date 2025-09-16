import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { formatDate } from "../lib/dateUtils";
// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { useTableContext } from "../contexts/TableContext";
import AddConditionModal from "./AddConditionModal";
import ActiveConditionsList from "./ActiveConditionsList";

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
  dataType?: string;
  conditionType: string;
  conditionValue: string;
  isRequired?: boolean;
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
  const [success, setSuccess] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [currentView, setCurrentView] = useState<
    "list" | "activate" | "manage"
  >("list");

  // Estado para el modal de agregar condición
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);

  // Contexto para comunicación con App.tsx
  const { refreshTables } = useTableContext();

  const api = {
    get: async (url: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}${url}`, {
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
      const response = await fetch(`${API_BASE_URL}${url}`, {
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
      const response = await fetch(`${API_BASE_URL}${url}`, {
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
      const data = await api.get(
        `/api/activated-tables/structure/${databaseName}/${tableName}`
      );
      setTableStructure(data);
    } catch (err) {
      console.error("Error fetching table structure:", err);
    }
  };

  const fetchTableConditions = async (
    databaseName: string,
    tableName: string
  ) => {
    try {
      console.log(`🔍 Fetching conditions for ${databaseName}.${tableName}...`);

      const data = await api.get(
        `/api/activated-tables/conditions/${databaseName}/${tableName}`
      );

      console.log(
        "📥 Conditions received from backend:",
        JSON.stringify(data, null, 2)
      );
      console.log("📊 Data type:", typeof data);
      console.log("📊 Is array:", Array.isArray(data));
      console.log("📊 Length:", data?.length);

      if (data && Array.isArray(data) && data.length > 0) {
        console.log("🔍 First condition details:");
        console.log("  - columnName:", data[0].columnName);
        console.log("  - dataType:", data[0].dataType);
        console.log("  - conditionType:", data[0].conditionType);
        console.log("  - conditionValue:", data[0].conditionValue);
        console.log("  - isRequired:", data[0].isRequired);
      }

      setConditions(data);
      console.log("✅ Conditions set in state");
    } catch (err) {
      console.error("❌ Error fetching table conditions:", err);
    }
  };

  const activateTable = async (databaseName: string, tableName: string) => {
    try {
      await api.post("/api/activated-tables/activate", {
        databaseName,
        tableName,
        description,
      });

      await fetchActivatedTables();
      setCurrentView("list");
      setDescription("");
      refreshTables();
    } catch (err) {
      console.error("Error activating table:", err);
      setError("Error al activar la tabla");
    }
  };

  const deactivateTable = async (databaseName: string, tableName: string) => {
    try {
      await api.put("/api/activated-tables/deactivate", {
        databaseName,
        tableName,
      });

      await fetchActivatedTables();
      refreshTables();
    } catch (err) {
      console.error("Error deactivating table:", err);
      setError("Error al desactivar la tabla");
    }
  };

  const updateTableConditions = async (
    databaseName: string,
    tableName: string
  ) => {
    try {
      console.log("🔍 Debug: Datos antes de enviar al backend:");
      console.log("  - databaseName:", databaseName);
      console.log("  - tableName:", tableName);
      console.log("  - conditions:", JSON.stringify(conditions, null, 2));
      console.log("  - conditions.length:", conditions.length);
      console.log("  - description:", description);

      // Verificar que conditions no esté vacío
      if (!conditions || conditions.length === 0) {
        console.error("❌ No hay condiciones para enviar");
        setError("No hay condiciones para actualizar");
        return;
      }

      // Verificar que cada condición tenga todos los campos requeridos
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        console.log(
          `🔍 Validando condición ${i + 1}:`,
          JSON.stringify(condition, null, 2)
        );

        if (!condition.columnName) {
          console.error(`❌ Condición ${i + 1} no tiene columnName`);
          setError(`Condición ${i + 1} no tiene nombre de columna`);
          return;
        }

        if (!condition.dataType) {
          console.error(`❌ Condición ${i + 1} no tiene dataType`);
          setError(`Condición ${i + 1} no tiene tipo de dato`);
          return;
        }

        if (!condition.conditionType) {
          console.error(`❌ Condición ${i + 1} no tiene conditionType`);
          setError(`Condición ${i + 1} no tiene tipo de condición`);
          return;
        }
      }

      console.log("📤 Enviando request al backend...");
      const response = await api.put(
        `/api/activated-tables/conditions/${databaseName}/${tableName}`,
        {
          conditions,
          description,
        }
      );

      console.log("✅ Respuesta del backend:", response);

      setError(null);
      setSuccess("Condiciones y descripción actualizadas exitosamente");

      // Recargar las condiciones desde el backend para asegurar sincronización
      await fetchTableConditions(databaseName, tableName);

      // Recargar la lista de tablas activadas para mostrar la descripción actualizada
      await fetchActivatedTables();

      // Actualizar el contexto para que otras partes de la app sepan que hubo cambios
      refreshTables();

      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error updating table conditions:", err);
      setError("Error al actualizar las condiciones");
    }
  };

  const handleDatabaseChange = (databaseName: string) => {
    setSelectedDatabase(databaseName);
    setSelectedTable("");
    setTableStructure([]);
    setConditions([]);
    if (databaseName) {
      fetchTablesByDatabase(databaseName);
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    if (tableName) {
      fetchTableStructure(selectedDatabase, tableName);
      fetchTableConditions(selectedDatabase, tableName);
    }
  };

  const handleAddCondition = (newCondition: TableCondition) => {
    console.log("🔍 Debug: Agregando nueva condición:");
    console.log("  - newCondition:", JSON.stringify(newCondition, null, 2));
    console.log(
      "  - conditions actuales:",
      JSON.stringify(conditions, null, 2)
    );

    const updatedConditions = [...conditions, newCondition];
    console.log(
      "  - conditions actualizadas:",
      JSON.stringify(updatedConditions, null, 2)
    );

    setConditions(updatedConditions);

    console.log("✅ Condición agregada al estado local");
  };

  const handleDeleteCondition = (conditionId: number) => {
    setConditions(conditions.filter((c) => c.id !== conditionId));
  };

  const handleManageTable = (table: ActivatedTable) => {
    setSelectedDatabase(table.DatabaseName);
    setSelectedTable(table.TableName);
    setDescription(table.Description);
    setError(null);
    setSuccess(null);
    fetchTableStructure(table.DatabaseName, table.TableName);
    fetchTableConditions(table.DatabaseName, table.TableName);
    setCurrentView("manage");
  };

  useEffect(() => {
    fetchDatabases();
    fetchActivatedTables();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (currentView === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Gestión de Tablas Activadas
          </h2>
          <Button
            onClick={() => {
              setError(null);
              setSuccess(null);
              setCurrentView("activate");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Activar Nueva Tabla
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Tablas Activadas ({activatedTables.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activatedTables.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No hay tablas activadas</p>
                <p className="text-sm mt-1">
                  Activa una tabla para comenzar a configurar condiciones
                </p>
              </div>
            ) : (
              activatedTables.map((table) => (
                <div
                  key={`${table.DatabaseName}.${table.TableName}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {table.DatabaseName}.{table.TableName}
                      </h4>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Activa
                      </span>
                    </div>
                    {table.Description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {table.Description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>Creada: {formatDate(table.CreatedAt)}</span>
                      <span>Actualizada: {formatDate(table.UpdatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleManageTable(table)}
                      className="text-white border-white hover:bg-white hover:text-gray-900"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        deactivateTable(table.DatabaseName, table.TableName)
                      }
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                    >
                      Desactivar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "activate") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setCurrentView("list");
            }}
            className="text-white"
          >
            ← Volver
          </Button>
          <h2 className="text-2xl font-bold text-white">Activar Nueva Tabla</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base de Datos
              </label>
              <Select
                value={selectedDatabase}
                onValueChange={handleDatabaseChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar base de datos" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.DatabaseName} value={db.DatabaseName}>
                      {db.DatabaseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tabla
              </label>
              <Select
                value={selectedTable}
                onValueChange={handleTableChange}
                disabled={!selectedDatabase}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tabla" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.TableName} value={table.TableName}>
                      {table.TableName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              rows={3}
              placeholder="Describe el propósito de esta tabla... (opcional)"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentView("list")}>
              Cancelar
            </Button>
            <Button
              onClick={() => activateTable(selectedDatabase, selectedTable)}
              disabled={!selectedDatabase || !selectedTable}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Activar Tabla
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "manage") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setCurrentView("list");
            }}
            className="text-white border-white hover:bg-white hover:text-gray-900"
          >
            ← Volver
          </Button>
          <h2 className="text-2xl font-bold text-white">
            Gestionar Condiciones - {selectedDatabase}.{selectedTable}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {/* Descripción de la tabla */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la Tabla
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              rows={3}
              placeholder="Describe el propósito de esta tabla... (opcional)"
            />
          </div>

          {/* Botón para agregar condición */}
          <div className="mb-6">
            <Button
              onClick={() => setShowAddConditionModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Agregar Condición
            </Button>
          </div>

          {/* Lista de condiciones activas */}
          <ActiveConditionsList
            conditions={conditions}
            onDeleteCondition={handleDeleteCondition}
          />

          {/* Botones de acción */}
          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setSuccess(null);
                setCurrentView("list");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() =>
                updateTableConditions(selectedDatabase, selectedTable)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Guardar
            </Button>
          </div>
        </div>

        {/* Modal para agregar condición */}
        <AddConditionModal
          isOpen={showAddConditionModal}
          onClose={() => setShowAddConditionModal(false)}
          onSave={handleAddCondition}
          tableStructure={tableStructure}
          existingConditions={conditions}
        />
      </div>
    );
  }

  return null;
};

export default ActivatedTablesManager;
