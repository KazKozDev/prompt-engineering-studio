import { useState, useEffect } from 'react';
import { api } from './services/api';
import logo from './assets/logo.png';

// Components
import { Studio } from './components/Studio';
import { History } from './components/History';
import { PromptLibrary, type LibraryPrompt } from './components/PromptLibrary';
import { Datasets } from './components/Datasets';
import { Settings } from './components/Settings';
import { EvaluationLab } from './components/EvaluationLab';
import { ProductionMetrics } from './components/ProductionMetrics';
import { PromptOptimizer } from './components/PromptOptimizer';

// Navigation structure with groups - logical pipeline
const NAV_GROUPS = [
  {
    label: 'Create',
    items: [
      { id: 'Prompt Generator', label: 'Generator' },
      { id: 'Prompt Optimizer', label: 'Optimizer' },
    ]
  },
  {
    label: 'Test',
    items: [
      { id: 'Datasets', label: 'Datasets' },
      { id: 'Evaluation Lab', label: 'Evaluation' },
    ]
  },
  {
    label: 'Deploy',
    items: [
      { id: 'Prompt Library', label: 'Library' },
      { id: 'Production Metrics', label: 'Metrics' },
      { id: 'History', label: 'History' },
    ]
  },
] as const;

type SectionId = 
  | 'Prompt Generator' | 'Prompt Optimizer' 
  | 'Prompt Library' | 'Datasets' 
  | 'Evaluation Lab' | 'Production Metrics' | 'History' 
  | 'Settings';

interface SettingsState {
  provider: string;
  model: string;
  apiKey: string;
  theme: string;
  autoSave: boolean;
  apiKeys: {
    openai?: string;
    gemini?: string;
    anthropic?: string;
  };
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('Prompt Generator');

  // Prompt to evaluate (passed from Library to Evaluation Lab)
  const [promptToEvaluate, setPromptToEvaluate] = useState<LibraryPrompt | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    provider: 'ollama',
    model: 'llama2',
    apiKey: '',
    theme: 'dark',
    autoSave: true,
    apiKeys: {},
  });

  // Load models on mount
  useEffect(() => {
    loadModels(settings.provider);
  }, []);

  const loadModels = async (provider: string) => {
    try {
      const data = await api.getModels(provider);
      if (data.models.length > 0) {
        setSettings(prev => ({ ...prev, model: data.models[0] }));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleEvaluatePrompt = (prompt: LibraryPrompt) => {
    setPromptToEvaluate(prompt);
    setActiveSection('Evaluation Lab');
  };

  return (
    <div className="h-screen flex flex-col bg-studio-bg text-slate-100">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-[#0a0a0a] border-b border-white/10 flex items-center px-5 shrink-0">
        <img src={logo} alt="Prompt Engineering Studio" className="h-6 w-auto object-contain mr-6" />
        
        <nav className="flex items-center gap-6 flex-1">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.label} className="flex items-center gap-1">
              {groupIdx > 0 && <div className="w-px h-4 bg-white/10 mr-4" />}
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-semibold mr-2">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SectionId)}
                  className={
                    'px-3 py-1 rounded-md text-[13px] font-medium transition-all duration-200 whitespace-nowrap ' +
                    (item.id === activeSection
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80')
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveSection('Settings')}
            className={
              'p-1.5 rounded-md transition-all ' +
              (activeSection === 'Settings'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:bg-white/5 hover:text-white/70')
            }
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span>v4.1</span>
          </div>
        </div>
      </header>

      {/* Main content area - full width */}
      <main className="flex-1 overflow-hidden">
        <div style={{ display: activeSection === 'Prompt Generator' ? 'block' : 'none', height: '100%' }}>
          <Studio settings={settings} />
        </div>
        <div style={{ display: activeSection === 'Evaluation Lab' ? 'block' : 'none', height: '100%' }}>
          <EvaluationLab settings={settings} promptToEvaluate={promptToEvaluate} />
        </div>
        <div style={{ display: activeSection === 'Production Metrics' ? 'block' : 'none', height: '100%' }}>
          <ProductionMetrics />
        </div>
        <div style={{ display: activeSection === 'Prompt Optimizer' ? 'block' : 'none', height: '100%' }}>
          <PromptOptimizer settings={settings} />
        </div>
        <div style={{ display: activeSection === 'History' ? 'block' : 'none', height: '100%' }}>
          <History />
        </div>
        <div style={{ display: activeSection === 'Prompt Library' ? 'block' : 'none', height: '100%' }}>
          <PromptLibrary onEvaluatePrompt={handleEvaluatePrompt} />
        </div>
        <div style={{ display: activeSection === 'Datasets' ? 'block' : 'none', height: '100%' }}>
          <Datasets />
        </div>
        <div style={{ display: activeSection === 'Settings' ? 'block' : 'none', height: '100%' }}>
          <Settings settings={settings} onSettingsChange={setSettings} />
        </div>
      </main>
    </div>
  );
}

export default App;
