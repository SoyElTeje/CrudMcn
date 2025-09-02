// Removed unused React import
import { Button } from "./ui/button";

interface BulkDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedRecords: any[];
  loading?: boolean;
}

export function BulkDeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  selectedRecords,
  loading = false,
}: BulkDeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border/50 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Confirmar Eliminación Múltiple
          </h2>
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

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-destructive"
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
            <div>
              <h3 className="font-semibold text-foreground">
                Eliminación Masiva
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará {selectedRecords.length} registros
              </p>
            </div>
          </div>

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="font-semibold text-destructive">
                ¡Advertencia!
              </span>
            </div>
            <p className="text-sm text-foreground">
              Estás a punto de eliminar{" "}
              <strong>{selectedRecords.length} registros</strong> de forma
              permanente. Esta acción no se puede deshacer y todos los datos
              seleccionados se perderán definitivamente.
            </p>
          </div>

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
            <p className="text-xs text-muted-foreground mb-2">
              Registros seleccionados ({selectedRecords.length}):
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedRecords.slice(0, 5).map((record, index) => (
                <div
                  key={index}
                  className="text-xs font-mono bg-background/50 rounded px-2 py-1"
                >
                  {Object.entries(record)
                    .slice(0, 2)
                    .map(([key, value]) => (
                      <span key={key} className="mr-2">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="text-foreground">{String(value)}</span>
                      </span>
                    ))}
                  {Object.keys(record).length > 2 && (
                    <span className="text-muted-foreground">...</span>
                  )}
                </div>
              ))}
              {selectedRecords.length > 5 && (
                <div className="text-xs text-muted-foreground italic">
                  ... y {selectedRecords.length - 5} registros más
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Eliminando {selectedRecords.length} registros...
              </div>
            ) : (
              `Eliminar ${selectedRecords.length} Registros`
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
