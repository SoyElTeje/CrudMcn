import React, { useState, useCallback } from "react";
import axios from "axios";
import { Button } from "./ui/button";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: string;
  table: string;
  onImportSuccess: () => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  database,
  table,
  onImportSuccess,
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream", // Some systems send this for Excel files
    ];

    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isValidType) {
      setError("Solo se permiten archivos Excel (.xlsx, .xls)");
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 5MB permitido.");
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `http://localhost:3001/api/databases/${database}/tables/${table}/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);

        // Handle validation errors
        if (error.response.data.errors) {
          setValidationErrors(error.response.data.errors);
        }

        // Handle missing columns
        if (error.response.data.missingColumns) {
          setValidationErrors([
            `Columnas faltantes: ${error.response.data.missingColumns.join(
              ", "
            )}`,
          ]);
        }

        // Handle extra columns
        if (error.response.data.extraColumns) {
          setValidationErrors([
            `Columnas extra: ${error.response.data.extraColumns.join(", ")}`,
          ]);
        }
      } else {
        setError("Error al subir el archivo");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    setIsDragOver(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Importar Excel - {table}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <strong>Errores de validación:</strong>
            <ul className="mt-2 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>
              <strong>Requisitos del archivo Excel:</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Primera fila debe contener los nombres de las columnas</li>
              <li>
                Los nombres de las columnas deben coincidir exactamente con la
                tabla
              </li>
              <li>No incluir columnas de ID (se generan automáticamente)</li>
              <li>Máximo 5MB de tamaño</li>
              <li>Formatos soportados: .xlsx, .xls</li>
            </ul>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : file
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div>
                <div className="text-green-600 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <div>
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arrastra tu archivo Excel aquí
                </p>
                <p className="text-gray-500 mb-4">o</p>
                <label className="cursor-pointer bg-brand-blue text-white px-4 py-2 rounded hover:bg-brand-blue-dark transition-colors">
                  Seleccionar archivo
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              disabled={uploading}
              className="border-brand-blue text-gray-900 bg-white hover:bg-gray-50 hover:text-gray-900"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-brand-blue-dark hover:bg-brand-blue text-white"
            >
              {uploading ? "Subiendo..." : "Importar Excel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
