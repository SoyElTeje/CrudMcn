import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface FilterCondition {
  column: string;
  operator: string;
  value: string;
  dataType: string;
}

interface SortCondition {
  column: string;
  direction: "ASC" | "DESC";
}

interface AdvancedFiltersProps {
  columns: Array<{
    COLUMN_NAME: string;
    DATA_TYPE: string;
  }>;
  onFiltersChange: (filters: FilterCondition[]) => void;
  onSortChange: (sort: SortCondition | null) => void;
  onClearFilters: () => void;
  activeFilters?: FilterCondition[];
  activeSort?: SortCondition | null;
}

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  // String types
  varchar: [
    { value: "equals", label: "Igual a" },
    { value: "contains", label: "Contiene" },
    { value: "not_equals", label: "Diferente de" },
    { value: "starts_with", label: "Comienza con" },
    { value: "ends_with", label: "Termina con" },
  ],
  nvarchar: [
    { value: "equals", label: "Igual a" },
    { value: "contains", label: "Contiene" },
    { value: "not_equals", label: "Diferente de" },
    { value: "starts_with", label: "Comienza con" },
    { value: "ends_with", label: "Termina con" },
  ],
  char: [
    { value: "equals", label: "Igual a" },
    { value: "contains", label: "Contiene" },
    { value: "not_equals", label: "Diferente de" },
    { value: "starts_with", label: "Comienza con" },
    { value: "ends_with", label: "Termina con" },
  ],
  text: [
    { value: "equals", label: "Igual a" },
    { value: "contains", label: "Contiene" },
    { value: "not_equals", label: "Diferente de" },
    { value: "starts_with", label: "Comienza con" },
    { value: "ends_with", label: "Termina con" },
  ],
  // Numeric types
  int: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  bigint: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  smallint: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  tinyint: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  decimal: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  float: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  real: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  money: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Mayor que" },
    { value: "greater_equals", label: "Mayor o igual que" },
    { value: "less_than", label: "Menor que" },
    { value: "less_equals", label: "Menor o igual que" },
    { value: "not_equals", label: "Distinto de" },
  ],
  // Boolean types
  bit: [{ value: "equals", label: "Igual a" }],
  // Date/Time types
  datetime: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Posterior a" },
    { value: "less_than", label: "Anterior a" },
  ],
  datetime2: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Posterior a" },
    { value: "less_than", label: "Anterior a" },
  ],
  date: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Posterior a" },
    { value: "less_than", label: "Anterior a" },
  ],
  time: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Posterior a" },
    { value: "less_than", label: "Anterior a" },
  ],
  smalldatetime: [
    { value: "equals", label: "Igual a" },
    { value: "greater_than", label: "Posterior a" },
    { value: "less_than", label: "Anterior a" },
  ],
};

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  columns,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  activeFilters = [],
  activeSort = null,
}) => {
  const [filters, setFilters] = useState<FilterCondition[]>(activeFilters);
  const [sort, setSort] = useState<SortCondition | null>(activeSort);
  const [showFilters, setShowFilters] = useState(true);

  // Sincronizar con props cuando cambien
  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    setSort(activeSort);
  }, [activeSort]);

  const getOperatorsForType = (dataType: string) => {
    const normalizedType = dataType
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .trim();
    return OPERATORS_BY_TYPE[normalizedType] || OPERATORS_BY_TYPE.varchar;
  };

  const addFilter = () => {
    const newFilter: FilterCondition = {
      column: columns[0]?.COLUMN_NAME || "",
      operator: "equals",
      value: "",
      dataType: columns[0]?.DATA_TYPE || "varchar",
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateFilter = (
    index: number,
    field: keyof FilterCondition,
    value: string
  ) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };

    // Si cambió la columna, actualizar el tipo de dato
    if (field === "column") {
      const column = columns.find((col) => col.COLUMN_NAME === value);
      if (column) {
        newFilters[index].dataType = column.DATA_TYPE;
        newFilters[index].operator =
          getOperatorsForType(column.DATA_TYPE)[0]?.value || "equals";
      }
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateSort = (column: string, direction: "ASC" | "DESC") => {
    const newSort = { column, direction };
    setSort(newSort);
    onSortChange(newSort);
  };

  const clearAllFilters = () => {
    setFilters([]);
    setSort(null);
    onFiltersChange([]);
    onSortChange(null);
    onClearFilters();
  };

  const getInputType = (dataType: string) => {
    const normalizedType = dataType
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .trim();

    if (normalizedType === "bit") return "select";
    if (
      ["datetime", "datetime2", "date", "smalldatetime"].includes(
        normalizedType
      )
    )
      return "datetime-local";
    if (normalizedType === "time") return "time";
    if (
      [
        "int",
        "bigint",
        "smallint",
        "tinyint",
        "decimal",
        "float",
        "real",
        "money",
      ].includes(normalizedType)
    )
      return "number";
    return "text";
  };

  const renderFilterValue = (filter: FilterCondition, index: number) => {
    const inputType = getInputType(filter.dataType);

    if (
      inputType === "select" &&
      filter.dataType.toLowerCase().includes("bit")
    ) {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        >
          <option value="">Seleccionar...</option>
          <option value="1">Verdadero</option>
          <option value="0">Falso</option>
        </select>
      );
    }

    return (
      <input
        type={inputType}
        value={filter.value}
        onChange={(e) => updateFilter(index, "value", e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        placeholder="Valor..."
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Filtros y Ordenamiento
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="text-white hover:text-white bg-red-600 hover:bg-red-700"
          >
            Limpiar Todo
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-6">
          {/* Filtros */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-700">Filtros</h4>
              <Button
                onClick={addFilter}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                + Agregar Filtro
              </Button>
            </div>

            {filters.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No hay filtros aplicados
              </p>
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
                      className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      {columns.map((col) => (
                        <option key={col.COLUMN_NAME} value={col.COLUMN_NAME}>
                          {col.COLUMN_NAME} ({col.DATA_TYPE})
                        </option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) =>
                        updateFilter(index, "operator", e.target.value)
                      }
                      className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      {getOperatorsForType(filter.dataType).map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex-1">
                      {renderFilterValue(filter, index)}
                    </div>

                    <Button
                      onClick={() => removeFilter(index)}
                      variant="outline"
                      size="sm"
                      className="text-white hover:text-white bg-red-600 hover:bg-red-700"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ordenamiento */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Ordenamiento
            </h4>
            <div className="flex items-center gap-3">
              <select
                value={sort?.column || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    updateSort(e.target.value, sort?.direction || "ASC");
                  } else {
                    setSort(null);
                    onSortChange(null);
                  }
                }}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">Sin ordenamiento</option>
                {columns.map((col) => (
                  <option key={col.COLUMN_NAME} value={col.COLUMN_NAME}>
                    {col.COLUMN_NAME}
                  </option>
                ))}
              </select>

              {sort?.column && (
                <select
                  value={sort.direction}
                  onChange={(e) =>
                    updateSort(sort.column, e.target.value as "ASC" | "DESC")
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="ASC">Ascendente</option>
                  <option value="DESC">Descendente</option>
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
