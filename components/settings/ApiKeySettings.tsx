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
        className="px-2.5 py-1.5 text-sm rounded hover:bg-[var(--notion-gray-hover)] transition-colors flex items-center gap-1.5"
        style={{ color: hasKeys ? 'var(--notion-blue)' : 'var(--notion-text-secondary)' }}
        title={hasKeys ? 'API keys configured' : 'Configure API keys'}
      >
        <Settings className="w-4 h-4" />
        {hasKeys && <CheckCircle2 className="w-3 h-3" />}
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded shadow-2xl max-w-md w-full"
            style={{ border: '1px solid var(--notion-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--notion-border)' }}>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'var(--notion-blue)' }} />
                <h2 className="text-base font-medium" style={{ color: 'var(--notion-text)' }}>
                  Dify API Settings
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
                style={{ color: 'var(--notion-text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Planner API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
                    Planner API Key
                  </label>
                  <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                    For outline generation
                  </span>
                </div>
                <input
                  type="password"
                  value={inputPlannerKey}
                  onChange={(e) => {
                    setInputPlannerKey(e.target.value);
                    setPlannerStatus('idle');
                  }}
                  placeholder="app-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border rounded-sm focus:outline-none transition-all"
                  style={{
                    color: 'var(--notion-text)',
                    borderColor: 'var(--notion-border)',
                    caretColor: 'var(--notion-blue)'
                  }}
                />
              </div>

              {/* Worker API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
                    Worker API Key
                  </label>
                  <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                    For content generation
                  </span>
                </div>
                <input
                  type="password"
                  value={inputWorkerKey}
                  onChange={(e) => {
                    setInputWorkerKey(e.target.value);
                    setWorkerStatus('idle');
                  }}
                  placeholder="app-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border rounded-sm focus:outline-none transition-all"
                  style={{
                    color: 'var(--notion-text)',
                    borderColor: 'var(--notion-border)',
                    caretColor: 'var(--notion-blue)'
                  }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                  Get your API keys from{' '}
                  <a
                    href="https://cloud.dify.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70"
                    style={{ color: 'var(--notion-blue)', textDecoration: 'underline' }}
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
                      className="p-2 rounded-sm flex items-center gap-2 text-sm"
                      style={{
                        backgroundColor: plannerStatus === 'valid' ? '#E7F3EC' : '#FDE8E8'
                      }}
                    >
                      {plannerStatus === 'valid' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#0E5F35' }} />
                          <span style={{ color: '#0E5F35' }}>Planner API key is valid!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" style={{ color: '#C74122' }} />
                          <span style={{ color: '#C74122' }}>Invalid Planner API key.</span>
                        </>
                      )}
                    </div>
                  )}
                  {workerStatus !== 'idle' && (
                    <div
                      className="p-2 rounded-sm flex items-center gap-2 text-sm"
                      style={{
                        backgroundColor: workerStatus === 'valid' ? '#E7F3EC' : '#FDE8E8'
                      }}
                    >
                      {workerStatus === 'valid' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#0E5F35' }} />
                          <span style={{ color: '#0E5F35' }}>Worker API key is valid!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" style={{ color: '#C74122' }} />
                          <span style={{ color: '#C74122' }}>Invalid Worker API key.</span>
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
                  className="flex-1 px-4 py-2 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ backgroundColor: 'var(--notion-blue)', color: 'white' }}
                >
                  {isValidating ? 'Validating...' : 'Validate & Save'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded font-medium hover:bg-[var(--notion-gray-hover)] transition-colors text-sm"
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
