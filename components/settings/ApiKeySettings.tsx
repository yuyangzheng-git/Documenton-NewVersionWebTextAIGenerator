'use client';

import { useState, useEffect } from 'react';
import { Settings, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateDifyWorkflowKey } from '@/lib/dify-api';

interface ApiKeySettingsProps {
  plannerKey: string;
  workerKey: string;
  onSave: (plannerKey: string, workerKey: string) => void;
}

export function ApiKeySettings({ plannerKey, workerKey, onSave }: ApiKeySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPlannerKey, setInputPlannerKey] = useState(plannerKey);
  const [inputWorkerKey, setInputWorkerKey] = useState(workerKey);
  const [isValidating, setIsValidating] = useState(false);
  const [plannerStatus, setPlannerStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    setInputPlannerKey(plannerKey);
    setInputWorkerKey(workerKey);
  }, [plannerKey, workerKey]);

  useEffect(() => {
    // Check if API keys exist in localStorage on mount
    const savedPlannerKey = localStorage.getItem('dify-planner-key');
    const savedWorkerKey = localStorage.getItem('dify-worker-key');
    if ((savedPlannerKey || savedWorkerKey) && (!plannerKey || !workerKey)) {
      onSave(savedPlannerKey || '', savedWorkerKey || '');
    }
  }, []);

  const handleValidate = async () => {
    if (!inputPlannerKey.trim() && !inputWorkerKey.trim()) return;

    setIsValidating(true);

    // Validate both keys in parallel
    const [plannerValid, workerValid] = await Promise.all([
      inputPlannerKey.trim() ? validateDifyWorkflowKey(inputPlannerKey) : Promise.resolve(false),
      inputWorkerKey.trim() ? validateDifyWorkflowKey(inputWorkerKey) : Promise.resolve(false)
    ]);

    setPlannerStatus(inputPlannerKey.trim() ? (plannerValid ? 'valid' : 'invalid') : 'idle');
    setWorkerStatus(inputWorkerKey.trim() ? (workerValid ? 'valid' : 'invalid') : 'idle');
    setIsValidating(false);

    if (plannerValid && workerValid) {
      localStorage.setItem('dify-planner-key', inputPlannerKey);
      localStorage.setItem('dify-worker-key', inputWorkerKey);
      onSave(inputPlannerKey, inputWorkerKey);
      setTimeout(() => setIsOpen(false), 1500);
    }
  };

  const hasKeys = !!plannerKey && !!workerKey;

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-sm rounded-md hover:bg-[var(--notion-hover)] transition-colors flex items-center gap-2"
        style={{ color: hasKeys ? 'var(--notion-blue)' : 'var(--notion-text-secondary)' }}
        title={hasKeys ? 'API keys configured' : 'Configure API keys'}
      >
        <Settings className="w-4 h-4" />
        {hasKeys && <CheckCircle2 className="w-3 h-3" />}
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl border max-w-md w-full p-6"
            style={{ borderColor: 'var(--notion-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" style={{ color: 'var(--notion-blue)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--notion-text)' }}>
                  Dify API Settings
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[var(--notion-hover)] transition-colors"
                style={{ color: 'var(--notion-text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Planner API Key */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--notion-text)' }}>
                  Planner API Key
                  <span className="ml-2 text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                    (For outline generation)
                  </span>
                </label>
                <input
                  type="password"
                  value={inputPlannerKey}
                  onChange={(e) => {
                    setInputPlannerKey(e.target.value);
                    setPlannerStatus('idle');
                  }}
                  placeholder="app-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{
                    color: 'var(--notion-text)',
                    borderColor: 'var(--notion-border)'
                  }}
                />
              </div>

              {/* Worker API Key */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--notion-text)' }}>
                  Worker API Key
                  <span className="ml-2 text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                    (For content generation)
                  </span>
                </label>
                <input
                  type="password"
                  value={inputWorkerKey}
                  onChange={(e) => {
                    setInputWorkerKey(e.target.value);
                    setWorkerStatus('idle');
                  }}
                  placeholder="app-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{
                    color: 'var(--notion-text)',
                    borderColor: 'var(--notion-border)'
                  }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                  Get your API keys from{' '}
                  <a
                    href="https://cloud.dify.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-70"
                    style={{ color: 'var(--notion-blue)' }}
                  >
                    Dify Cloud
                  </a>
                </p>
              </div>

              {/* Validation Status */}
              {(plannerStatus !== 'idle' || workerStatus !== 'idle') && (
                <div className="space-y-2">
                  {plannerStatus !== 'idle' && (
                    <div
                      className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                        plannerStatus === 'valid' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {plannerStatus === 'valid' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">Planner API key is valid!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700">Invalid Planner API key.</span>
                        </>
                      )}
                    </div>
                  )}
                  {workerStatus !== 'idle' && (
                    <div
                      className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                        workerStatus === 'valid' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {workerStatus === 'valid' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">Worker API key is valid!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700">Invalid Worker API key.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleValidate}
                  disabled={(!inputPlannerKey.trim() && !inputWorkerKey.trim()) || isValidating}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--notion-text)', color: 'white' }}
                >
                  {isValidating ? 'Validating...' : 'Validate & Save'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-lg font-medium hover:bg-[var(--notion-hover)] transition-colors"
                  style={{ color: 'var(--notion-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
