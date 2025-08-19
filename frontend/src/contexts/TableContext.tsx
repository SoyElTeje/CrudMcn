import React, { createContext, useContext, useState, ReactNode } from "react";

interface TableContextType {
  refreshTables: () => void;
  setRefreshTables: (callback: () => void) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error("useTableContext must be used within a TableProvider");
  }
  return context;
};

interface TableProviderProps {
  children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [refreshTables, setRefreshTables] = useState<() => void>(() => () => {
    console.log("refreshTables not initialized yet");
  });

  return (
    <TableContext.Provider value={{ refreshTables, setRefreshTables }}>
      {children}
    </TableContext.Provider>
  );
};
