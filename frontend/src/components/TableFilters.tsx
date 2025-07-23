import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

export interface FilterCondition {
  column: string;
  operator: string;
  value: string | number;
  type: "number" | "text" | "date";
}

interface TableFiltersProps {
  columns: Array<{
    name: string;
    type: string;
  }>;
  onFiltersChange: (filters: FilterCondition[]) => void;
  activeFilters: FilterCondition[];
}

export function TableFilters({
  columns,
  onFiltersChange,
  activeFilters,
}: TableFiltersProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(activeFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Operadores para números
  const numberOperators = [
    { value: "=", label: "Igual a" },
    { value: ">", label: "Mayor que" },
    { value: "<", label: "Menor que" },
    { value: ">=", label: "Mayor o igual" },
    { value: "<=", label: "Menor o igual" },
    { value: "!=", label: "Diferente de" },
  ];

  // Operadores para texto
  const textOperators = [
    { value: "contains", label: "Contiene" },
    { value: "=", label: "Igual a" },
    { value: "!=", label: "Diferente de" },
    { value: "starts_with", label: "Empieza con" },
    { value: "ends_with", label: "Termina con" },
  ];

  // Operadores para fechas
  const dateOperators = [
    { value: "=", label: "Igual a" },
    { value: ">", label: "Posterior a" },
    { value: "<", label: "Anterior a" },
    { value: ">=", label: "Posterior o igual a" },
    { value: "<=", label: "Anterior o igual a" },
    { value: "!=", label: "Diferente de" },
    { value: "between", label: "Entre" },
  ];

  const getColumnType = (columnName: string): "number" | "text" | "date" => {
    const column = columns.find((col) => col.name === columnName);
    if (!column) return "text";

    const type = column.type.toLowerCase();

    // Detectar tipos de fecha
    if (
      type.includes("date") ||
      type.includes("time") ||
      type.includes("datetime") ||
      type.includes("timestamp")
    ) {
      return "date";
    }

    // Detectar tipos numéricos
    if (
      type.includes("int") ||
      type.includes("bigint") ||
      type.includes("decimal") ||
      type.includes("numeric") ||
      type.includes("float") ||
      type.includes("money") ||
      type.includes("real")
    ) {
      return "number";
    }

    return "text";
  };

  const addFilter = () => {
    if (columns.length === 0) return;

    const newFilter: FilterCondition = {
      column: columns[0]?.name || "",
      operator:
        getColumnType(columns[0]?.name || "") === "number"
          ? "="
          : getColumnType(columns[0]?.name || "") === "date"
          ? "="
          : "contains",
      value: "",
      type: getColumnType(columns[0]?.name || ""),
    };
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const updateFilter = (
    index: number,
    field: keyof FilterCondition,
    value: string | number
  ) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };

    // Si cambió la columna, actualizar el tipo y operador por defecto
    if (field === "column") {
      const newType = getColumnType(value as string);
      updatedFilters[index].type = newType;
      updatedFilters[index].operator =
        newType === "number" ? "=" : newType === "date" ? "=" : "contains";
      updatedFilters[index].value = "";
    }

    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    setFilters([]);
    onFiltersChange([]);
  };

  const getOperators = (type: "number" | "text" | "date") => {
    if (type === "number") return numberOperators;
    if (type === "date") return dateOperators;
    return textOperators;
  };

  const getActiveFiltersCount = () => {
    return filters.filter((f) => f.value !== "" && f.value !== null).length;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="flex items-center gap-2"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Filtros
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </Button>

        {getActiveFiltersCount() > 0 && (
          <Button
            onClick={clearAllFilters}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          {columns.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No hay columnas disponibles para filtrar</p>
              <p className="text-sm">Carga los datos de la tabla primero</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <select
                    value={filter.column}
                    onChange={(e) =>
                      updateFilter(index, "column", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    {columns.map((col) => (
                      <option
                        key={col.name}
                        value={col.name}
                        className="text-gray-900"
                      >
                        {col.name} ({col.type})
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.operator}
                    onChange={(e) =>
                      updateFilter(index, "operator", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    {getOperators(filter.type).map((op) => (
                      <option
                        key={op.value}
                        value={op.value}
                        className="text-gray-900"
                      >
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type={filter.type === "number" ? "number" : filter.type === "date" ? "datetime-local" : "text"}
                    value={filter.type === "date" && filter.operator === "between" 
                      ? filter.value.toString().split('|')[0] || '' 
                      : filter.value}
                    onChange={(e) => {
                      if (filter.type === "date" && filter.operator === "between") {
                        const secondValue = filter.value.toString().split('|')[1] || '';
                        const newValue = `${e.target.value}|${secondValue}`;
                        updateFilter(index, "value", newValue);
                      } else {
                        updateFilter(
                          index,
                          "value",
                          filter.type === "number"
                            ? Number(e.target.value)
                            : e.target.value
                        );
                      }
                    }}
                    placeholder={
                      filter.type === "number"
                        ? "Ingresa un número"
                        : filter.type === "date"
                        ? filter.operator === "between" ? "Fecha inicial" : "Selecciona fecha y hora"
                        : "Ingresa texto"
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 flex-1"
                  />

                  {/* Input adicional para el operador "between" */}
                  {filter.type === "date" && filter.operator === "between" && (
                    <input
                      type="datetime-local"
                      value={filter.value.toString().split('|')[1] || ''}
                      onChange={(e) => {
                        const currentValue = filter.value.toString().split('|')[0] || '';
                        const newValue = `${currentValue}|${e.target.value}`;
                        updateFilter(index, "value", newValue);
                      }}
                      placeholder="Fecha final"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 flex-1"
                    />
                  )}

                  <Button
                    onClick={() => removeFilter(index)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white px-2"
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
              ))}

              <Button
                onClick={addFilter}
                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white border-dashed border-brand-blue disabled:bg-gray-400 disabled:border-gray-400"
                disabled={columns.length === 0}
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
                Agregar filtro
              </Button>
            </div>
          )}

          {getActiveFiltersCount() > 0 && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Filtros activos:</strong> {getActiveFiltersCount()}{" "}
              filtro(s) aplicado(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
