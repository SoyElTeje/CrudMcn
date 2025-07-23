import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import axios from "axios";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  databaseName: string;
  tableName: string;
  token: string;
  onImportComplete: (result: any) => void;
}

interface PreviewData {
  headers: string[];
  totalRows: number;
  previewRows: any[][];
  validation: {
    tableColumns: string[];
    insertableColumns: string[];
    identityColumns: string[];
  };
}

export function ExcelImportModal({
  isOpen,
  onClose,
  databaseName,
  tableName,
  token,
  onImportComplete,
}: ExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const api = axios.create({
    baseURL: "http://localhost:3001",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedFile);

      const response = await api.post(
        `/api/databases/${databaseName}/tables/${tableName}/preview-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPreviewData(response.data.data);
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Error al previsualizar el archivo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedFile);

      const response = await api.post(
        `/api/databases/${databaseName}/tables/${tableName}/import-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Cerrar modal y pasar el resultado al componente padre
      handleClose();
      onImportComplete(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "Error al importar el archivo");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-black">
          Importar datos desde Excel - {databaseName}.{tableName}
        </h3>

        {/* Selección de archivo */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-black">
            Seleccionar archivo Excel
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-black"
          />
          <p className="text-sm text-gray-600 mt-1">
            Formatos soportados: .xlsx, .xls, .csv (máximo 10MB)
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={handlePreview}
            disabled={!selectedFile || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Previsualizando..." : "Previsualizar"}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
          <Button
            onClick={handleClose}
            className="bg-[#447cd7] hover:bg-[#3a6bc4] text-white"
          >
            Cerrar
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Error de Importación
                </h3>
                <p className="text-sm text-red-700 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vista previa */}
        {previewData && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-black">
              Vista Previa del Archivo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del archivo */}
              <div>
                <h5 className="text-sm font-medium mb-2 text-black">
                  Información del Archivo
                </h5>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-black">
                    <strong>Total de filas:</strong> {previewData.totalRows}
                  </p>
                  <p className="text-sm text-black">
                    <strong>Columnas encontradas:</strong>{" "}
                    {previewData.headers.length}
                  </p>
                  <p className="text-sm text-black">
                    <strong>Columnas insertables:</strong>{" "}
                    {previewData.validation.insertableColumns.length}
                  </p>
                </div>
              </div>

              {/* Validación */}
              <div>
                <h5 className="text-sm font-medium mb-2 text-black">
                  Validación de Columnas
                </h5>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-black">
                    <strong>Columnas de la tabla:</strong>{" "}
                    {previewData.validation.tableColumns.join(", ")}
                  </p>
                  <p className="text-sm text-black">
                    <strong>Columnas de identidad (omitidas):</strong>{" "}
                    {previewData.validation.identityColumns.join(", ") ||
                      "Ninguna"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de vista previa */}
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2 text-black">
                Vista Previa de Datos (primeras 5 filas)
              </h5>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr>
                      {previewData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="border border-gray-300 px-3 py-2 text-sm font-medium text-black bg-gray-100"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {previewData.headers.map((header, colIndex) => (
                          <td
                            key={colIndex}
                            className="border border-gray-300 px-3 py-2 text-sm text-black"
                          >
                            {row[colIndex] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
