import React, { useState } from "react";
import { Button } from "./ui/button";

interface TableInfo {
  schema: string;
  name: string;
}

interface TableCardsProps {
  tables: TableInfo[];
  onTableSelect: (table: TableInfo) => void;
  selectedTable?: string;
}

export function TableCards({
  tables,
  onTableSelect,
  selectedTable,
}: TableCardsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar tablas basado en el término de búsqueda
  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Buscar tablas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        />
        <span className="text-sm text-gray-500">
          {filteredTables.length} de {tables.length} tablas
        </span>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <div
            key={`${table.schema}.${table.name}`}
            className={`p-6 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTable === table.name
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
            onClick={() => onTableSelect(table)}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {table.name}
              </h3>
              <p className="text-sm text-gray-500">Esquema: {table.schema}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredTables.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No se encontraron tablas que coincidan con "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
