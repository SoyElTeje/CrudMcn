import React from "react";
import { Button } from "./ui/button";

interface TableCondition {
  id?: number;
  columnName: string;
  dataType?: string;
  conditionType: string;
  conditionValue: string;
  isRequired?: boolean;
}

interface ActiveConditionsListProps {
  conditions: TableCondition[];
  onDeleteCondition: (conditionId: number) => void;
}

const ActiveConditionsList: React.FC<ActiveConditionsListProps> = ({
  conditions,
  onDeleteCondition,
}) => {
  // Función para obtener el texto descriptivo de la condición
  const getConditionDescription = (condition: TableCondition) => {
    try {
      const value = JSON.parse(condition.conditionValue);

      switch (condition.conditionType) {
        case "min":
          return `Valor mínimo: ${value.value}`;
        case "max":
          return `Valor máximo: ${value.value}`;
        case "range":
          if (
            condition.dataType &&
            condition.dataType.toLowerCase().includes("date")
          ) {
            const minText = value.min ? `desde ${value.min}` : "";
            const maxText = value.max ? `hasta ${value.max}` : "";
            return `Rango de fechas: ${minText} ${maxText}`.trim();
          } else {
            const minText =
              value.min !== undefined ? `mínimo ${value.min}` : "";
            const maxText =
              value.max !== undefined ? `máximo ${value.max}` : "";
            return `Rango de valores: ${minText} ${maxText}`.trim();
          }
        case "length":
          const minText = value.min !== undefined ? `mínima ${value.min}` : "";
          const maxText = value.max !== undefined ? `máxima ${value.max}` : "";
          return `Longitud: ${minText} ${maxText}`.trim();
        case "contains":
          return `Debe contener: "${value.text}"`;
        case "starts_with":
          return `Debe comenzar con: "${value.text}"`;
        case "ends_with":
          return `Debe terminar con: "${value.text}"`;
        case "regex":
          return `Patrón regex: ${value.pattern}`;
        case "required":
          return "Campo obligatorio";
        case "value":
          return `Valor esperado: ${value.expected ? "Verdadero" : "Falso"}`;
        default:
          return `Tipo: ${condition.conditionType}`;
      }
    } catch (error) {
      return `Valor: ${condition.conditionValue}`;
    }
  };

  // Función para obtener el color del badge según el tipo de dato
  const getDataTypeColor = (dataType: string | undefined) => {
    if (!dataType) return "bg-gray-100 text-gray-800";

    const dataTypeLower = dataType.toLowerCase();

    if (
      dataTypeLower.includes("int") ||
      dataTypeLower.includes("numeric") ||
      dataTypeLower.includes("decimal") ||
      dataTypeLower.includes("float")
    ) {
      return "bg-blue-100 text-blue-800";
    } else if (
      dataTypeLower.includes("varchar") ||
      dataTypeLower.includes("nvarchar") ||
      dataTypeLower.includes("char") ||
      dataTypeLower.includes("text")
    ) {
      return "bg-green-100 text-green-800";
    } else if (
      dataTypeLower.includes("date") ||
      dataTypeLower.includes("datetime")
    ) {
      return "bg-purple-100 text-purple-800";
    } else if (
      dataTypeLower.includes("bit") ||
      dataTypeLower.includes("boolean")
    ) {
      return "bg-orange-100 text-orange-800";
    }

    return "bg-gray-100 text-gray-800";
  };

  // Agrupar condiciones por campo
  const groupConditionsByField = () => {
    const grouped: { [key: string]: TableCondition[] } = {};

    conditions.forEach((condition) => {
      if (!grouped[condition.columnName]) {
        grouped[condition.columnName] = [];
      }
      grouped[condition.columnName].push(condition);
    });

    return grouped;
  };

  const groupedConditions = groupConditionsByField();

  if (conditions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg font-medium">No hay condiciones configuradas</p>
        <p className="text-sm">
          Agrega condiciones para validar los datos de esta tabla
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Condiciones Activas ({conditions.length})
      </h3>

      <div className="space-y-6">
        {Object.entries(groupedConditions).map(
          ([columnName, columnConditions]) => (
            <div
              key={columnName}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Encabezado del campo */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {columnName}
                </h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getDataTypeColor(
                    columnConditions[0].dataType
                  )}`}
                >
                  {columnConditions[0].dataType || "Sin tipo"}
                </span>

                <span className="ml-auto text-sm text-gray-500">
                  {columnConditions.length} condición
                  {columnConditions.length !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Lista de condiciones para este campo */}
              <div className="space-y-3">
                {columnConditions.map((condition, index) => (
                  <div
                    key={
                      condition.id ||
                      `${condition.columnName}-${condition.conditionType}-${index}`
                    }
                    className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {condition.conditionType}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700">
                          {getConditionDescription(condition)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() =>
                            condition.id && onDeleteCondition(condition.id)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white p-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ActiveConditionsList;
