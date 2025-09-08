/**
 * Componente de input de fecha personalizado que usa formato DD/MM/AAAA
 */

import React, { useState, useEffect } from "react";

interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Valida si una fecha en formato DD/MM/AAAA es válida
 */
function isValidDateDDMMYYYY(dateString: string): boolean {
  if (!dateString || typeof dateString !== "string") {
    return false;
  }

  const cleanDate = dateString.trim();
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDate.match(dateRegex);

  if (!match) {
    return false;
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Los meses en JavaScript van de 0 a 11
  const year = parseInt(match[3], 10);

  // Validar rangos
  if (
    day < 1 ||
    day > 31 ||
    month < 0 ||
    month > 11 ||
    year < 1900 ||
    year > 2100
  ) {
    return false;
  }

  // Crear la fecha y verificar que sea válida
  const date = new Date(year, month, day);
  return (
    date.getDate() === day &&
    date.getMonth() === month &&
    date.getFullYear() === year
  );
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a DD/MM/AAAA
 */
function formatISOToDDMMYYYY(isoDate: string): string {
  if (!isoDate) return "";

  try {
    const date = new Date(isoDate + "T00:00:00"); // Evitar problemas de zona horaria
    if (isNaN(date.getTime())) return "";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    return "";
  }
}

/**
 * Convierte una fecha DD/MM/AAAA a formato ISO (YYYY-MM-DD)
 */
function convertDDMMYYYYToISO(dateString: string): string {
  if (!isValidDateDDMMYYYY(dateString)) return "";

  try {
    const [day, month, year] = dateString.split("/");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const isoYear = date.getFullYear();
    const isoMonth = (date.getMonth() + 1).toString().padStart(2, "0");
    const isoDay = date.getDate().toString().padStart(2, "0");

    return `${isoYear}-${isoMonth}-${isoDay}`;
  } catch (error) {
    return "";
  }
}

/**
 * Formatea automáticamente el input mientras el usuario escribe
 */
function formatDateInput(value: string): string {
  // Remover caracteres no numéricos excepto /
  let cleanValue = value.replace(/[^\d/]/g, "");

  // Limitar longitud
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10);
  }

  // Agregar barras automáticamente
  if (cleanValue.length >= 2 && !cleanValue.includes("/")) {
    cleanValue = cleanValue.substring(0, 2) + "/" + cleanValue.substring(2);
  }
  if (cleanValue.length >= 5 && cleanValue.split("/").length === 2) {
    const parts = cleanValue.split("/");
    if (parts[1].length >= 2) {
      cleanValue =
        parts[0] + "/" + parts[1].substring(0, 2) + "/" + parts[1].substring(2);
    }
  }

  return cleanValue;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  required = false,
  disabled = false,
  error,
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isValid, setIsValid] = useState(true);

  // Inicializar el valor de display
  useEffect(() => {
    if (value) {
      // Si el valor viene en formato ISO, convertirlo a DD/MM/AAAA
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDisplayValue(formatISOToDDMMYYYY(value));
      } else {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatDateInput(inputValue);

    setDisplayValue(formattedValue);

    // Validar la fecha
    const valid = !formattedValue || isValidDateDDMMYYYY(formattedValue);
    setIsValid(valid);

    // Convertir a ISO para el onChange
    if (formattedValue && valid) {
      const isoValue = convertDDMMYYYYToISO(formattedValue);
      onChange(isoValue);
    } else if (!formattedValue) {
      onChange("");
    }
  };

  const handleBlur = () => {
    // Al perder el foco, validar y corregir si es necesario
    if (displayValue && !isValidDateDDMMYYYY(displayValue)) {
      setIsValid(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black ${
          error || !isValid
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        }`}
      />
      {(error || !isValid) && (
        <p className="text-sm text-red-500">
          {error || "Formato de fecha inválido. Use DD/MM/AAAA"}
        </p>
      )}
    </div>
  );
};

export default DateInput;
