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

  useEffect(() => {
    if (tableStructure && tableStructure.columns) {
      // Inicializar el formulario con campos vacíos basados en la estructura de la tabla
      const initialData: any = {};
      tableStructure.columns.forEach((column: any) => {
        // Excluir campos que son auto-increment o tienen valores por defecto
        if (!column.COLUMN_DEFAULT && !column.IS_NULLABLE) {
          initialData[column.COLUMN_NAME] = "";
        }
      });
      setFormData(initialData);
    }
  }, [tableStructure]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen || !tableStructure) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Agregar Nuevo Registro</h2>
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
          {tableStructure.columns.map((column: any) => {
            // Excluir campos que son auto-increment o tienen valores por defecto
            if (column.COLUMN_DEFAULT || column.IS_NULLABLE === "YES") {
              return null;
            }

            return (
              <div key={column.COLUMN_NAME}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {column.COLUMN_NAME}
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({column.DATA_TYPE})
                  </span>
                </label>
                <input
                  type="text"
                  value={formData[column.COLUMN_NAME] || ""}
                  onChange={(e) => handleInputChange(column.COLUMN_NAME, e.target.value)}
                  className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  disabled={loading}
                  required
                  placeholder={`Ingrese ${column.COLUMN_NAME.toLowerCase()}`}
                />
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
            <Button type="submit" disabled={loading} className="flex-1">
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