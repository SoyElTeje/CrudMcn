// Removed unused React import
import { Button } from "./ui/button";

interface ValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
  title?: string;
}

export function ValidationErrorModal({
  isOpen,
  onClose,
  errors,
  title = "Errores de Validación",
}: ValidationErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border/50 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
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

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Los datos no cumplen con las condiciones configuradas
                </h3>
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm text-red-700"
                    >
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Por favor, revise los datos ingresados y asegúrese de que cumplan
              con todas las condiciones configuradas para esta tabla.
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
