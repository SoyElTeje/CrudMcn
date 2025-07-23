import React from "react";

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
}: PageSizeSelectorProps) {
  const pageSizeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  return (
    <div className="PageSizeSelector flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
      <span className="text-sm font-medium text-gray-900">
        Registros por página:
      </span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-gray-900 font-medium"
        style={{ color: "#111827" }}
        title="Máximo 50 registros por página"
      >
        {pageSizeOptions.map((size) => (
          <option
            key={size}
            value={size}
            style={{ color: "#111827", backgroundColor: "white" }}
          >
            {size} registros
          </option>
        ))}
      </select>
      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium">
        máx. 50
      </span>
    </div>
  );
}
 