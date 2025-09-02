import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// Removed unused Checkbox import

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

interface AddConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condition: TableCondition) => void;
  tableStructure: ColumnStructure[];
  existingConditions: TableCondition[];
}

const AddConditionModal: React.FC<AddConditionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tableStructure,
  // existingConditions, // Removed unused parameter
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [conditionType, setConditionType] = useState<string>("");
  const [conditionValue, setConditionValue] = useState<any>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Obtener columnas disponibles (excluyendo las que ya tienen condiciones)
  const availableColumns = tableStructure.filter(
    (_col) => true // Permitir múltiples condiciones por campo
  );

  // Obtener el tipo de dato de la columna seleccionada
  const selectedColumnData = tableStructure.find(
    (col) => col.ColumnName === selectedColumn
  );

  // Obtener tipos de condición disponibles según el tipo de dato
  const getAvailableConditionTypes = (dataType: string) => {
    const dataTypeLower = dataType.toLowerCase();
    const commonConditions = [{ value: "required", label: "Campo requerido" }];

    if (
      dataTypeLower.includes("int") ||
      dataTypeLower.includes("numeric") ||
      dataTypeLower.includes("decimal") ||
      dataTypeLower.includes("float")
    ) {
      return [
        ...commonConditions,
        { value: "min", label: "Valor mínimo" },
        { value: "max", label: "Valor máximo" },
        { value: "range", label: "Rango de valores" },
      ];
    } else if (
      dataTypeLower.includes("varchar") ||
      dataTypeLower.includes("nvarchar") ||
      dataTypeLower.includes("char") ||
      dataTypeLower.includes("text")
    ) {
      return [
        ...commonConditions,
        { value: "length", label: "Longitud" },
        { value: "contains", label: "Debe contener" },
        { value: "starts_with", label: "Debe comenzar con" },
        { value: "ends_with", label: "Debe terminar con" },
        { value: "regex", label: "Patrón regex" },
      ];
    } else if (
      dataTypeLower.includes("date") ||
      dataTypeLower.includes("datetime")
    ) {
      return [
        ...commonConditions,
        { value: "range", label: "Rango de fechas" },
        { value: "before", label: "Debe ser anterior a" },
        { value: "after", label: "Debe ser posterior a" },
      ];
    } else if (
      dataTypeLower.includes("bit") ||
      dataTypeLower.includes("boolean")
    ) {
      return [
        ...commonConditions,
        { value: "value", label: "Valor específico" },
      ];
    }

    return commonConditions;
  };

  // Renderizar campos de valor según el tipo de condición
  const renderConditionValueFields = () => {
    if (!conditionType) return null;

    switch (conditionType) {
      case "min":
      case "max":
        return (
          <div className="space-y-2">
            <Label htmlFor="conditionValue">Valor</Label>
            <Input
              id="conditionValue"
              type="number"
              value={conditionValue.value || ""}
              onChange={(e) => setConditionValue({ value: e.target.value })}
              placeholder="Ingrese el valor"
            />
          </div>
        );

      case "range":
        if (selectedColumnData?.DataType.toLowerCase().includes("date")) {
          return (
            <div className="space-y-2">
              <Label htmlFor="minDate">Fecha mínima</Label>
              <Input
                id="minDate"
                type="date"
                value={conditionValue.min || ""}
                onChange={(e) =>
                  setConditionValue({ ...conditionValue, min: e.target.value })
                }
              />
              <Label htmlFor="maxDate">Fecha máxima</Label>
              <Input
                id="maxDate"
                type="date"
                value={conditionValue.max || ""}
                onChange={(e) =>
                  setConditionValue({ ...conditionValue, max: e.target.value })
                }
              />
            </div>
          );
        } else {
          return (
            <div className="space-y-2">
              <Label htmlFor="minValue">Valor mínimo</Label>
              <Input
                id="minValue"
                type="number"
                value={conditionValue.min || ""}
                onChange={(e) =>
                  setConditionValue({ ...conditionValue, min: e.target.value })
                }
                placeholder="Valor mínimo"
              />
              <Label htmlFor="maxValue">Valor máximo</Label>
              <Input
                id="maxValue"
                type="number"
                value={conditionValue.max || ""}
                onChange={(e) =>
                  setConditionValue({ ...conditionValue, max: e.target.value })
                }
                placeholder="Valor máximo"
              />
            </div>
          );
        }

      case "length":
        return (
          <div className="space-y-2">
            <Label htmlFor="minLength">Longitud mínima</Label>
            <Input
              id="minLength"
              type="number"
              value={conditionValue.min || ""}
              onChange={(e) =>
                setConditionValue({ ...conditionValue, min: e.target.value })
              }
              placeholder="Longitud mínima"
            />
            <Label htmlFor="maxLength">Longitud máxima</Label>
            <Input
              id="maxLength"
              type="number"
              value={conditionValue.max || ""}
              onChange={(e) =>
                setConditionValue({ ...conditionValue, max: e.target.value })
              }
              placeholder="Longitud máxima"
            />
          </div>
        );

      case "contains":
      case "starts_with":
      case "ends_with":
        return (
          <div className="space-y-2">
            <Label htmlFor="textValue">Texto</Label>
            <Input
              id="textValue"
              type="text"
              value={conditionValue.text || ""}
              onChange={(e) => setConditionValue({ text: e.target.value })}
              placeholder="Ingrese el texto"
            />
          </div>
        );

      case "regex":
        return (
          <div className="space-y-2">
            <Label htmlFor="regexPattern">Patrón regex</Label>
            <Input
              id="regexPattern"
              type="text"
              value={conditionValue.pattern || ""}
              onChange={(e) => setConditionValue({ pattern: e.target.value })}
              placeholder="Ej: ^[A-Za-z]+$"
            />
          </div>
        );

      case "required":
        return (
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Campo requerido:</strong> Este campo será obligatorio
                para todos los registros.
              </p>
            </div>
          </div>
        );

      case "value":
        return (
          <div className="space-y-2">
            <Label htmlFor="boolValue">Valor esperado</Label>
            <Select
              value={conditionValue.expected?.toString() || ""}
              onValueChange={(value) =>
                setConditionValue({ expected: value === "true" })
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder="Seleccione el valor"
                  className="text-white"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Verdadero</SelectItem>
                <SelectItem value="false">Falso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  // Validar si se puede avanzar al siguiente paso
  const canProceedToNextStep = () => {
    if (step === 1) return selectedColumn !== "";
    if (step === 2) return conditionType !== "";
    if (step === 3) {
      // Validar que los campos de valor estén completos según el tipo
      if (conditionType === "range") {
        if (selectedColumnData?.DataType.toLowerCase().includes("date")) {
          return conditionValue.min || conditionValue.max;
        } else {
          return (
            conditionValue.min !== undefined || conditionValue.max !== undefined
          );
        }
      } else if (conditionType === "length") {
        return (
          conditionValue.min !== undefined || conditionValue.max !== undefined
        );
      } else if (conditionType === "min" || conditionType === "max") {
        return (
          conditionValue.value !== undefined && conditionValue.value !== ""
        );
      } else if (
        conditionType === "contains" ||
        conditionType === "starts_with" ||
        conditionType === "ends_with"
      ) {
        return conditionValue.text && conditionValue.text.trim() !== "";
      } else if (conditionType === "regex") {
        return conditionValue.pattern && conditionValue.pattern.trim() !== "";
      } else if (conditionType === "required") {
        return true; // Siempre válido para required
      } else if (conditionType === "value") {
        return conditionValue.expected !== undefined;
      }
      return false;
    }
    return false;
  };

  // Avanzar al siguiente paso
  const handleNext = () => {
    if (step < 3 && canProceedToNextStep()) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  // Retroceder al paso anterior
  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  // Guardar la condición
  const handleSave = () => {
    if (!selectedColumn || !conditionType || !canProceedToNextStep()) return;

    // Asegurar que tenemos los datos de la columna
    if (!selectedColumnData) {
      console.error(
        "No se pudo obtener información de la columna seleccionada"
      );
      return;
    }

    const newCondition: TableCondition = {
      columnName: selectedColumn,
      dataType: selectedColumnData.DataType, // Siempre debe tener un valor
      conditionType,
      conditionValue:
        conditionType === "required"
          ? '{"value":true}'
          : JSON.stringify(conditionValue),
      isRequired: conditionType === "required",
    };

    console.log("Guardando nueva condición:", newCondition);
    onSave(newCondition);
    handleClose();
  };

  // Cerrar modal y resetear estado
  const handleClose = () => {
    setStep(1);
    setSelectedColumn("");
    setConditionType("");
    setConditionValue({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Agregar Nueva Condición</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Indicador de progreso */}
        <div className="flex items-center justify-between mb-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${
              step >= 2 ? "bg-blue-500" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <div
            className={`flex-1 h-1 mx-2 ${
              step >= 3 ? "bg-blue-500" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            3
          </div>
        </div>

        {/* Paso 1: Seleccionar columna */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="columnSelect">Seleccionar Columna</Label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una columna" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col.ColumnName} value={col.ColumnName}>
                      {col.ColumnName} ({col.DataType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedColumn && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Columna:</strong> {selectedColumn}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Tipo:</strong> {selectedColumnData?.DataType}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Nullable:</strong>{" "}
                  {selectedColumnData?.IsNullable === "YES" ? "Sí" : "No"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Seleccionar tipo de condición */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="conditionTypeSelect">Tipo de Condición</Label>
              <Select value={conditionType} onValueChange={setConditionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo de condición" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableConditionTypes(
                    selectedColumnData?.DataType || ""
                  ).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {conditionType && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Tipo seleccionado:</strong> {conditionType}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Configurar valor de la condición */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="Label">Configurar Condición</div>
            {renderConditionValueFields()}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={handlePrevious}>
              Anterior
            </Button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canProceedToNextStep()}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!canProceedToNextStep()}>
              Agregar Condición
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddConditionModal;
