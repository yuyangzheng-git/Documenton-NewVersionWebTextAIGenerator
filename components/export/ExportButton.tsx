'use client';

import { useState } from 'react';
import { Download, FileText, FileDown, ChevronDown } from 'lucide-react';

interface ExportButtonProps {
  onExportDocx: () => void;
  onExportPdf: () => void;
}

export function ExportButton({ onExportDocx, onExportPdf }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <button
              onClick={() => {
                onExportDocx();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left text-sm"
            >
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Export as DOCX</div>
                <div className="text-xs text-slate-500">Microsoft Word format</div>
              </div>
            </button>
            <button
              onClick={() => {
                onExportPdf();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left text-sm"
            >
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <FileDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Export as PDF</div>
                <div className="text-xs text-slate-500">Printable document</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
