import React from "react";
import { Button } from "./ui/button";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedRecords: any[];
  database: string;
  table: string;
  loading: boolean;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  selectedRecords,
  database,
  table,
  loading,
}: BulkDeleteModalProps) {
  if (!isOpen) return null;

  const recordCount = selectedRecords.length;

  // Find the primary key field from the first record
  const primaryKeyField =
    selectedRecords.length > 0
      ? Object.keys(selectedRecords[0]).find(
          (key) =>
            key.toLowerCase().includes("id") ||
            key.toLowerCase().includes("key")
        ) || Object.keys(selectedRecords[0])[0]
      : "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Eliminación Múltiple
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <p className="text-gray-700 text-center mb-4">
            ¿Estás seguro de que quieres eliminar{" "}
            <strong>{recordCount} registro(s)</strong> seleccionado(s)?
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Base de datos:</strong> {database}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Tabla:</strong> {table}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Registros a eliminar:</strong> {recordCount}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer.
              Los {recordCount} registro(s) serán eliminado(s) permanentemente
              de la base de datos.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
            className="px-4 py-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Eliminando...
              </div>
            ) : (
              <div className="flex items-center">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Eliminar {recordCount} Registro(s)
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
 