import React from "react";
import { Button } from "./ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border">
      <div className="text-sm text-gray-600">
        Mostrando {startItem} a {endItem} de {totalCount} registros
      </div>

      {/* Solo mostrar controles de navegación si hay más de una página */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-brand-blue-light text-white hover:bg-brand-blue-light disabled:bg-gray-300 disabled:text-gray-400"
          >
            «
          </Button>

          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-brand-blue-light text-white hover:bg-brand-blue-light disabled:bg-gray-300 disabled:text-gray-400"
          >
            ‹
          </Button>

          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2 py-1 text-gray-500">...</span>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`px-2 py-1 min-w-[32px] ${
                    currentPage === page
                      ? "bg-brand-blue-dark text-white hover:bg-brand-blue-dark"
                      : "bg-brand-blue-light text-white hover:bg-brand-blue-light"
                  }`}
                  style={{
                    color: "white",
                  }}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}

          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-brand-blue-light text-white hover:bg-brand-blue-light disabled:bg-gray-300 disabled:text-gray-400"
          >
            ›
          </Button>

          <Button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-brand-blue-light text-white hover:bg-brand-blue-light disabled:bg-gray-300 disabled:text-gray-400"
          >
            »
          </Button>
        </div>
      )}
    </div>
  );
}
 