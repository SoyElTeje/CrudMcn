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

function App() {
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | undefined>(undefined);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | undefined>(
    undefined
  );
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para limpiar el estado cuando cambia la base de datos
  const handleDatabaseChange = (newDb: string) => {
    setSelectedDb(newDb);
    setSelectedTable(undefined);
    setTableData(null);
    setError(null);
    setLoading(false);
  };

  // Fetch databases on mount
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/databases")
      .then((res) => setDatabases(res.data))
      .catch(() => setDatabases([]));
  }, []);

  // Fetch tables when database changes
  useEffect(() => {
    if (selectedDb) {
      axios
        .get(`http://localhost:3001/api/databases/${selectedDb}/tables`)
        .then((res) => setTables(res.data))
        .catch(() => setTables([]));
    } else {
      setTables([]);
    }
  }, [selectedDb]);

  // Fetch table data when table changes
  useEffect(() => {
    // Solo hacer la consulta si tenemos tanto base de datos como tabla seleccionada
    if (selectedDb && selectedTable && selectedTable.trim() !== "") {
      setLoading(true);
      setError(null);
      axios
        .get(`http://localhost:3001/api/trial/table`, {
          params: { db: selectedDb, table: selectedTable },
        })
        .then((res) => setTableData(res.data))
        .catch((err) => setError(err.response?.data?.error || err.message))
        .finally(() => setLoading(false));
    } else {
      setTableData(null);
      setError(null);
    }
  }, [selectedDb, selectedTable]);

  // Render
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Visualizador de Base de Datos
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Selecciona una base de datos y tabla para explorar los datos
          </p>
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
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Datos de {tableData.database}.{tableData.table}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tableData.count > 0
                    ? `Mostrando ${tableData.count} registros`
                    : "No hay registros en esta tabla"}
                </p>
              </div>

              {tableData.data.length > 0 ? (
                <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        {Object.keys(tableData.data[0]).map((col) => (
                          <TableHead
                            key={col}
                            className="font-semibold text-foreground"
                          >
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.data.map((row, i) => (
                        <TableRow
                          key={i}
                          className="hover:bg-accent/5 transition-colors"
                        >
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
    </div>
  );
}

export default App;
