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
      <div className="bg-background border border-border/50 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Exportar a Excel
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de Exportación
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="all"
                  checked={exportType === "all"}
                  onChange={(e) =>
                    setExportType(e.target.value as "all" | "current_page")
                  }
                  className="w-4 h-4 text-primary bg-background border-border/50 focus:ring-primary/50"
                />
                <div>
                  <div className="font-medium text-foreground">
                    Toda la tabla
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Exportar todos los registros
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="current_page"
                  checked={exportType === "current_page"}
                  onChange={(e) =>
                    setExportType(e.target.value as "all" | "current_page")
                  }
                  className="w-4 h-4 text-primary bg-background border-border/50 focus:ring-primary/50"
                />
                <div>
                  <div className="font-medium text-foreground">
                    Página actual
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Exportar solo los registros visibles
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-muted/20 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">
              Descripción:
            </div>
            <div className="text-sm text-foreground font-medium">
              {getExportDescription()}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0"
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
                <div className="text-sm text-destructive">{error}</div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1 bg-green-600 hover:bg-green-700"
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
