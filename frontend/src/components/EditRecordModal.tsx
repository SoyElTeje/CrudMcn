import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSave: (updatedRecord: any) => void;
  loading?: boolean;
}

export function EditRecordModal({
  isOpen,
  onClose,
  record,
  onSave,
  loading = false,
}: EditRecordModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Editar Registro</h2>
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
          {record &&
            Object.keys(record).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {key}
                </label>
                <input
                  type="text"
                  value={formData[key] || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-border/50 rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  disabled={loading}
                />
              </div>
            ))}

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
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
