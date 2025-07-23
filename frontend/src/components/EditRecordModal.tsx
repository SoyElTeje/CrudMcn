import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button";

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  precision: number | null;
  scale: number | null;
  isPrimaryKey: boolean;
}

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  database: string;
  table: string;
  onRecordUpdated: () => void;
}

export function EditRecordModal({
  isOpen,
  onClose,
  record,
  database,
  table,
  onRecordUpdated,
}: EditRecordModalProps) {
  const [schema, setSchema] = useState<ColumnSchema[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch table schema when modal opens
  useEffect(() => {
    if (isOpen && database && table) {
      fetchSchema();
    }
  }, [isOpen, database, table]);

  // Initialize form data when record changes
  useEffect(() => {
    if (record && schema.length > 0) {
      const initialData = { ...record };
      // Remove the primary key field from editable data
      const primaryKeyField = schema.find((col) => col.isPrimaryKey);
      if (primaryKeyField) {
        delete initialData[primaryKeyField.name];
      }
      setFormData(initialData);
    }
  }, [record, schema, table]);

  const fetchSchema = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/databases/${database}/tables/${table}/schema`
      );
      setSchema(response.data);
    } catch (error) {
      console.error("Error fetching schema:", error);
      setError("Error loading table schema");
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Find the primary key field
      const primaryKeyField = schema.find((col) => col.isPrimaryKey);

      if (!primaryKeyField) {
        setError("No se pudo identificar el campo ID del registro");
        return;
      }

      const recordId = record[primaryKeyField.name];

      const response = await axios.put(
        `http://localhost:3001/api/databases/${database}/tables/${table}/records/${recordId}`,
        formData
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onRecordUpdated();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Error updating record");
    } finally {
      setLoading(false);
    }
  };

  const getInputType = (column: ColumnSchema) => {
    const type = column.type.toLowerCase();
    if (
      type.includes("int") ||
      type.includes("decimal") ||
      type.includes("numeric")
    ) {
      return "number";
    }
    if (type.includes("date") || type.includes("time")) {
      return "datetime-local";
    }
    if (type.includes("bit")) {
      return "checkbox";
    }
    return "text";
  };

  const renderField = (column: ColumnSchema) => {
    const value = formData[column.name] || "";
    const inputType = getInputType(column);

    if (inputType === "checkbox") {
      return (
        <div key={column.name} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={column.name}
            checked={Boolean(value)}
            onChange={(e) => handleInputChange(column.name, e.target.checked)}
            className="rounded border-gray-300"
          />
          <label
            htmlFor={column.name}
            className="text-sm font-medium text-gray-900"
          >
            {column.name}
          </label>
        </div>
      );
    }

    return (
      <div key={column.name} className="space-y-2">
        <label
          htmlFor={column.name}
          className="block text-sm font-medium text-gray-900"
        >
          {column.name}
          {!column.nullable && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={inputType}
          id={column.name}
          value={value}
          onChange={(e) => handleInputChange(column.name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          maxLength={column.maxLength || undefined}
          step={column.type.includes("decimal") ? "0.01" : undefined}
        />
        {column.defaultValue && (
          <p className="text-xs text-gray-500">
            Default: {column.defaultValue}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Editar Registro - {table}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            ¡Registro actualizado exitosamente!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schema
              .filter((col) => !col.isPrimaryKey) // Exclude primary key fields
              .map(renderField)}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
