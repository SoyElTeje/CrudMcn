import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableStructure: any;
  onSave: (newRecord: any) => void;
  loading?: boolean;
}

export function AddRecordModal({
  isOpen,
  onClose,
  tableStructure,
  onSave,
  loading = false,
}: AddRecordModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (tableStructure && tableStructure.columns) {
      // Inicializar el formulario con campos vacíos basados en la estructura de la tabla
      const initialData: any = {};
      tableStructure.columns.forEach((column: any) => {
        // Solo excluir campos que son identity (auto-increment)
        // Permitir campos nullable y con valores por defecto
        if (!column.IS_IDENTITY) {
          initialData[column.COLUMN_NAME] = "";
        }
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [tableStructure]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    // Validar campo en tiempo real
    const column = editableColumns.find((col: any) => col.COLUMN_NAME === key);
    if (column) {
      let fieldError = null;

      // Validar campo requerido
      const requiredError = validateRequired(column, value);
      if (requiredError) {
        fieldError = requiredError;
      } else if (value && value.trim() !== "") {
        // Solo validar otros tipos si el campo no está vacío
        const dataTypeError = validateDataType(column, value);
        if (dataTypeError) {
          fieldError = dataTypeError;
        } else {
          const maxLengthError = validateMaxLength(column, value);
          if (maxLengthError) {
            fieldError = maxLengthError;
          } else {
            const checkError = validateCheckConstraints(column, value);
            if (checkError) {
              fieldError = checkError;
            }
          }
        }
      }

      setErrors((prev: any) => ({
        ...prev,
        [key]: fieldError,
      }));
    }
  };

  // Función para validar restricciones CHECK
  const validateCheckConstraints = (
    column: any,
    value: string
  ): string | null => {
    if (!column.checkConstraints || column.checkConstraints.length === 0) {
      return null;
    }

    for (const constraint of column.checkConstraints) {
      const checkClause = constraint.CHECK_CLAUSE;

      // Validar restricciones de valores específicos (ej: 'grande', 'mediana', 'pequena')
      const valueMatches = checkClause.match(/'([^']+)'/g);
      if (valueMatches) {
        const allowedValues = valueMatches.map((match: string) =>
          match.replace(/'/g, "")
        );
        if (!allowedValues.includes(value)) {
          return `El valor debe ser uno de: ${allowedValues.join(", ")}`;
        }
      }

      // Validar restricciones numéricas (ej: > 0)
      if (checkClause.includes(">")) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue <= 0) {
          return "El valor debe ser mayor a 0";
        }
      }

      if (checkClause.includes("<")) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue >= 0) {
          return "El valor debe ser menor a 0";
        }
      }

      if (checkClause.includes(">=")) {
        const match = checkClause.match(/>=\s*(\d+)/);
        if (match) {
          const minValue = parseFloat(match[1]);
          const numericValue = parseFloat(value);
          if (isNaN(numericValue) || numericValue < minValue) {
            return `El valor debe ser mayor o igual a ${minValue}`;
          }
        }
      }

      if (checkClause.includes("<=")) {
        const match = checkClause.match(/<=\s*(\d+)/);
        if (match) {
          const maxValue = parseFloat(match[1]);
          const numericValue = parseFloat(value);
          if (isNaN(numericValue) || numericValue > maxValue) {
            return `El valor debe ser menor o igual a ${maxValue}`;
          }
        }
      }
    }

    return null;
  };

  // Función para validar longitud máxima
  const validateMaxLength = (column: any, value: string): string | null => {
    if (
      column.CHARACTER_MAXIMUM_LENGTH &&
      value.length > column.CHARACTER_MAXIMUM_LENGTH
    ) {
      return `El valor no puede tener más de ${column.CHARACTER_MAXIMUM_LENGTH} caracteres`;
    }
    return null;
  };

  // Función para validar campos requeridos
  const validateRequired = (column: any, value: string): string | null => {
    const isRequired = column.IS_NULLABLE === "NO" && !column.COLUMN_DEFAULT;
    if (isRequired && (!value || value.trim() === "")) {
      return "Este campo es requerido";
    }
    return null;
  };

  // Función para validar tipo de dato
  const validateDataType = (column: any, value: string): string | null => {
    if (!value || value.trim() === "") return null;

    const dataType = column.DATA_TYPE.toLowerCase();

    if (
      dataType.includes("int") ||
      dataType.includes("decimal") ||
      dataType.includes("numeric")
    ) {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        return `El valor debe ser un número válido`;
      }
    }

    if (dataType.includes("date") || dataType.includes("datetime")) {
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return `El valor debe ser una fecha válida`;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    let isValid = true;

    editableColumns.forEach((column: any) => {
      const value = formData[column.COLUMN_NAME] || "";

      // Validar campo requerido
      const requiredError = validateRequired(column, value);
      if (requiredError) {
        newErrors[column.COLUMN_NAME] = requiredError;
        isValid = false;
        return;
      }

      // Si el campo está vacío y no es requerido, no validar más
      if (!value || value.trim() === "") {
        return;
      }

      // Validar tipo de dato
      const dataTypeError = validateDataType(column, value);
      if (dataTypeError) {
        newErrors[column.COLUMN_NAME] = dataTypeError;
        isValid = false;
        return;
      }

      // Validar longitud máxima
      const maxLengthError = validateMaxLength(column, value);
      if (maxLengthError) {
        newErrors[column.COLUMN_NAME] = maxLengthError;
        isValid = false;
        return;
      }

      // Validar restricciones CHECK
      const checkError = validateCheckConstraints(column, value);
      if (checkError) {
        newErrors[column.COLUMN_NAME] = checkError;
        isValid = false;
        return;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario antes de enviar
    if (!validateForm()) {
      return;
    }

    // Filtrar solo los campos que tienen valores (no vacíos)
    const filteredData: any = {};
    Object.keys(formData).forEach((key) => {
      if (
        formData[key] !== "" &&
        formData[key] !== null &&
        formData[key] !== undefined
      ) {
        filteredData[key] = formData[key];
      }
    });

    onSave(filteredData);
  };

  if (!isOpen || !tableStructure) return null;

  // Obtener columnas editables (excluir solo identity columns)
  const editableColumns = tableStructure.columns.filter(
    (column: any) => !column.IS_IDENTITY
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Agregar Nuevo Registro
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 p-0"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {editableColumns.map((column: any) => {
            const isRequired =
              column.IS_NULLABLE === "NO" && !column.COLUMN_DEFAULT;
            const hasDefault = column.COLUMN_DEFAULT;
            const isNullable = column.IS_NULLABLE === "YES";
            const hasCheckConstraints =
              column.checkConstraints && column.checkConstraints.length > 0;
            const maxLength = column.CHARACTER_MAXIMUM_LENGTH;

            // Extraer valores permitidos de las restricciones CHECK
            let allowedValues: string[] = [];
            if (hasCheckConstraints) {
              column.checkConstraints.forEach((constraint: any) => {
                const checkClause = constraint.CHECK_CLAUSE;
                // Extraer valores de cláusulas como: [TipoMaquina]='grande' OR [TipoMaquina]='mediana' OR [TipoMaquina]='pequena'
                const matches = checkClause.match(/'([^']+)'/g);
                if (matches) {
                  allowedValues = matches.map((match: string) =>
                    match.replace(/'/g, "")
                  );
                }
              });
            }

            return (
              <div key={column.COLUMN_NAME}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {column.COLUMN_NAME}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({column.DATA_TYPE}
                    {maxLength ? `(${maxLength})` : ""})
                  </span>
                  {hasDefault && (
                    <span className="text-xs text-green-600 ml-2">
                      (Valor por defecto: {column.COLUMN_DEFAULT})
                    </span>
                  )}
                  {isNullable && (
                    <span className="text-xs text-blue-600 ml-2">
                      (Opcional)
                    </span>
                  )}
                  {hasCheckConstraints && (
                    <span className="text-xs text-orange-600 ml-2">
                      (Valores permitidos: {allowedValues.join(", ")})
                    </span>
                  )}
                </label>

                {hasCheckConstraints && allowedValues.length > 0 ? (
                  <select
                    value={formData[column.COLUMN_NAME] || ""}
                    onChange={(e) =>
                      handleInputChange(column.COLUMN_NAME, e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:border-primary ${
                      errors[column.COLUMN_NAME]
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-border/50 focus:ring-primary/50"
                    }`}
                    disabled={loading}
                    required={isRequired}
                  >
                    <option value="">Seleccione un valor</option>
                    {allowedValues.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData[column.COLUMN_NAME] || ""}
                    onChange={(e) =>
                      handleInputChange(column.COLUMN_NAME, e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:border-primary ${
                      errors[column.COLUMN_NAME]
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-border/50 focus:ring-primary/50"
                    }`}
                    disabled={loading}
                    required={isRequired}
                    maxLength={maxLength}
                    placeholder={
                      hasDefault
                        ? `Dejar vacío para usar valor por defecto (${column.COLUMN_DEFAULT})`
                        : `Ingrese ${column.COLUMN_NAME.toLowerCase()}`
                    }
                  />
                )}

                {/* Mostrar error si existe */}
                {errors[column.COLUMN_NAME] && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors[column.COLUMN_NAME]}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading || Object.keys(errors).some((key) => errors[key])
              }
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                "Agregar Registro"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
