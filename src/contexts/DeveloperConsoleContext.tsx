"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type LogLevel = "info" | "success" | "warning" | "error";

export interface ConsoleLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

interface DeveloperConsoleContextType {
  logs: ConsoleLog[];
  addLog: (message: string, level?: LogLevel, details?: string) => void;
  clearLogs: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DeveloperConsoleContext = createContext<DeveloperConsoleContextType | undefined>(undefined);

export function DeveloperConsoleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isOpen, setIsOpen] = useState(false); // Start collapsed by default

  const addLog = useCallback((message: string, level: LogLevel = "info", details?: string) => {
    const newLog: ConsoleLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <DeveloperConsoleContext.Provider
      value={{
        logs,
        addLog,
        clearLogs,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </DeveloperConsoleContext.Provider>
  );
}

export function useDeveloperConsole() {
  const context = useContext(DeveloperConsoleContext);
  if (context === undefined) {
    throw new Error("useDeveloperConsole must be used within a DeveloperConsoleProvider");
  }
  return context;
}
