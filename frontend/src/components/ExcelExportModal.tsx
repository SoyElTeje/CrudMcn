import React, { useState } from "react";
import { Button } from "./ui/button";

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  databaseName: string;
  tableName: string;
  currentPage: number;
  recordsPerPage: number;
  totalRecords: number;
  token: string;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  databaseName,
  tableName,
  currentPage,
  recordsPerPage,
  totalRecords,
  token,
}) => {
  const [exportType, setExportType] = useState<"all" | "current_page">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!databaseName || !tableName) {
      setError("No se ha seleccionado una base de datos o tabla");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Construir la URL con los parámetros necesarios
      const params = new URLSearchParams({
        exportType,
      });

      // Si es exportación de página actual, agregar limit y offset
      if (exportType === "current_page") {
        params.append("limit", recordsPerPage.toString());
        params.append(
          "offset",
          ((currentPage - 1) * recordsPerPage).toString()
        );
      }

      const url = `/api/databases/${databaseName}/tables/${tableName}/export-excel?${params.toString()}`;

      // Crear un elemento <a> temporal para descargar el archivo
      const link = document.createElement("a");
      link.href = url;
      link.download = ""; // El nombre del archivo vendrá del servidor

      // Agregar el token de autorización
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al exportar datos");
      }

      // Obtener el blob del archivo
      const blob = await response.blob();

      // Crear URL del blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Configurar el enlace para descarga
      link.href = blobUrl;

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = `${tableName}_${exportType}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      link.download = fileName;

      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar el blob URL
      window.URL.revokeObjectURL(blobUrl);

      // Cerrar el modal
      onClose();
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      setError(error.message || "Error al exportar datos a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const getExportDescription = () => {
    if (exportType === "all") {
      return `Exportar todos los ${totalRecords} registros de la tabla`;
    } else {
      const startRecord = (currentPage - 1) * recordsPerPage + 1;
      const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
      return `Exportar registros ${startRecord} a ${endRecord} de ${totalRecords} (página actual)`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-300 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Exportar a Excel
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {databaseName}.{tableName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg
              className="w-5 h-5"
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

        {/* Content */}
        <div className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Tipo de Exportación
            </h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  value="all"
                  checked={exportType === "all"}
                  onChange={(e) =>
                    setExportType(e.target.value as "all" | "current_page")
                  }
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Toda la tabla</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Exportar todos los registros disponibles
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  value="current_page"
                  checked={exportType === "current_page"}
                  onChange={(e) =>
                    setExportType(e.target.value as "all" | "current_page")
                  }
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Página actual</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Exportar solo los registros visibles
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Descripción:</div>
            <div className="text-sm text-gray-900 font-medium">
              {getExportDescription()}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
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
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-400 hover:bg-blue-500 text-white border-0"
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1 bg-blue-800 hover:bg-blue-900 text-white"
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exportando...
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
                  Exportar
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
