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
  ignoreHeaders?: boolean;
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
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [ignoreHeaders, setIgnoreHeaders] = useState(false);
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
      formData.append("ignoreHeaders", ignoreHeaders.toString());

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

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/databases/${databaseName}/tables/${tableName}/download-template`,
        {
          responseType: "blob",
        }
      );

      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `template_${tableName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.error || "Error al descargar el template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("excelFile", selectedFile);
      formData.append("ignoreHeaders", ignoreHeaders.toString());

      const response = await api.post(
        `/api/databases/${databaseName}/tables/${tableName}/import-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Si hay errores, descargar automáticamente el reporte de errores
      if (response.data.data.errorCount > 0 && response.data.data.errorReport) {
        try {
          const errorReportResponse = await api.get(
            `/api/download-error-report/${response.data.data.errorReport.fileName}`,
            {
              responseType: "blob",
            }
          );

          // Crear un enlace temporal para descargar el archivo
          const url = window.URL.createObjectURL(
            new Blob([errorReportResponse.data])
          );
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            response.data.data.errorReport.fileName
          );
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } catch (downloadError) {
          console.error("Error downloading error report:", downloadError);
        }
      }

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
    setIgnoreHeaders(false);
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

        {/* Botón para descargar template */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-black">
              Template de Excel
            </h4>
            <Button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {downloadingTemplate ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Descargando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Descargar Template
                </div>
              )}
            </Button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-400 mr-2 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-left">
                <p className="text-blue-800 text-sm font-medium mb-1">
                  Template de Excel
                </p>
                <p className="text-blue-700 text-sm">
                  Descarga un archivo Excel con los headers de la tabla para que
                  puedas llenarlo manualmente y luego importarlo.
                </p>
              </div>
            </div>
          </div>
        </div>

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

        {/* Opción para ignorar headers */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ignoreHeaders"
              checked={ignoreHeaders}
              onChange={(e) => setIgnoreHeaders(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="ignoreHeaders"
              className="ml-2 text-sm font-medium text-black"
            >
              Ignorar primera fila (headers)
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-1 ml-6">
            Marca esta opción si el excel que deseas importar tiene el título de
            las columnas.
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
                  {!previewData.ignoreHeaders && (
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
                  )}
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
