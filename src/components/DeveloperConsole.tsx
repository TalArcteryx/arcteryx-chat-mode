"use client";

import { useEffect, useRef } from "react";
import { useDeveloperConsole } from "@/contexts/DeveloperConsoleContext";
import { ChevronUp, ChevronDown, X, Trash2 } from "lucide-react";

export default function DeveloperConsole() {
  const { logs, clearLogs, isOpen, setIsOpen } = useDeveloperConsole();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const getLogColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const getLogBgColor = (level: string) => {
    switch (level) {
      case "success":
        return "bg-green-500/20 border-green-500/40 bg-black/30";
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/40 bg-black/30";
      case "error":
        return "bg-red-500/20 border-red-500/40 bg-black/30";
      default:
        return "bg-blue-500/20 border-blue-500/40 bg-black/30";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  return (
    <>
      {/* Toggle Button - Fixed at bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-0 right-0 z-[100] bg-gray-900 text-gray-100 p-3 rounded-tl-lg shadow-lg hover:bg-gray-800 border-t border-l border-gray-700 transition-all ${
          isOpen ? "rounded-tl-none" : ""
        }`}
        aria-label="Toggle Developer Console"
        title="Developer Console"
      >
        <div className="relative">
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          {logs.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold text-[10px]">
              {logs.length}
            </span>
          )}
        </div>
      </button>

      {/* Console Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[99] bg-gray-950 border-t-2 border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "40vh", maxHeight: "500px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-base text-gray-100">Developer Console</h3>
            <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700">
              {logs.length} {logs.length === 1 ? 'log' : 'logs'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-200"
              aria-label="Clear logs"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-200"
              aria-label="Close console"
              title="Close console"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Container */}
        <div className="h-[calc(100%-60px)] overflow-y-auto p-4 font-mono text-xs bg-gray-950">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No logs yet. Background processes will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded border ${getLogBgColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-semibold ${getLogColor(log.level)}`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-500 flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className="text-gray-200 flex-1">{log.message}</span>
                  </div>
                  {log.details && (
                    <div className="mt-2 ml-4 text-gray-400 text-xs">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

