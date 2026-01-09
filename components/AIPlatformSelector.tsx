'use client';

import { useStore } from '@/store/useStore';
import { Cpu, Settings } from 'lucide-react';
import { AIPlatform } from '@/lib/ai/types';

interface AIPlatformOption {
  id: AIPlatform;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const PLATFORMS: AIPlatformOption[] = [
  {
    id: 'dify',
    name: 'Dify',
    description: 'Open-source AI application development platform',
    icon: <Cpu size={20} />,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Most capable AI models by OpenAI',
    icon: <Cpu size={20} />,
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'Framework for developing LLM applications',
    icon: <Cpu size={20} />,
  },
];

export function AIPlatformSelector() {
  const {
    aiPlatform,
    setAIPlatform,
    apiKey,
    setApiKey,
    apiUrl,
    setApiUrl,
    chapterApiKey,
    setChapterApiKey,
    chatApiKey,
    setChatApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    openaiModel,
    setOpenaiModel,
    openaiBaseUrl,
    setOpenaiBaseUrl,
    langchainApiKey,
    setLangchainApiKey,
    langchainModel,
    setLangchainModel,
  } = useStore();

  return (
    <div
      style={{
        position: 'fixed',
        top: 44,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(55, 53, 47, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={24} style={{ color: 'rgba(55, 53, 47, 0.65)' }} />
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'rgba(55, 53, 47, 1)',
                margin: 0,
              }}
            >
              AI Platform Settings
            </h2>
          </div>
          <button
            onClick={() => {
              const modal = document.querySelector('[data-platform-modal="true"]') as HTMLElement;
              if (modal) modal.remove();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'rgba(55, 53, 47, 0.5)',
              fontSize: '24px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Platform Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(55, 53, 47, 0.65)',
              marginBottom: '12px',
            }}
          >
            Select AI Platform
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                onClick={() => setAIPlatform(platform.id)}
                style={{
                  padding: '16px',
                  border: `2px solid ${
                    aiPlatform === platform.id ? '#2383E2' : 'rgba(55, 53, 47, 0.15)'
                  }`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor:
                    aiPlatform === platform.id ? 'rgba(35, 131, 226, 0.05)' : 'transparent',
                  transition: 'all 150ms ease-in-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ color: aiPlatform === platform.id ? '#2383E2' : 'rgba(55, 53, 47, 0.65)' }}>
                    {platform.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  >
                    {platform.name}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(55, 53, 47, 0.65)',
                    margin: 0,
                  }}
                >
                  {platform.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dify Configuration */}
        {aiPlatform === 'dify' && (
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(55, 53, 47, 1)',
                margin: '0 0 16px 0',
              }}
            >
              Dify Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  Planner API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="app-xxxxxxxxxxxxxx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  Chapter Writer API Key
                </label>
                <input
                  type="password"
                  value={chapterApiKey}
                  onChange={(e) => setChapterApiKey(e.target.value)}
                  placeholder="app-xxxxxxxxxxxxxx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  API URL
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://your-dify-instance/v1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* OpenAI Configuration */}
        {aiPlatform === 'openai' && (
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(55, 53, 47, 1)',
                margin: '0 0 16px 0',
              }}
            >
              OpenAI Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  API Key
                </label>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  Model
                </label>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="gpt-4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  Base URL
                </label>
                <input
                  type="text"
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* LangChain Configuration */}
        {aiPlatform === 'langchain' && (
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(55, 53, 47, 1)',
                margin: '0 0 16px 0',
              }}
            >
              LangChain Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  API Key
                </label>
                <input
                  type="password"
                  value={langchainApiKey}
                  onChange={(e) => setLangchainApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(55, 53, 47, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  Model
                </label>
                <input
                  type="text"
                  value={langchainModel}
                  onChange={(e) => setLangchainModel(e.target.value)}
                  placeholder="gpt-4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(55, 53, 47, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
