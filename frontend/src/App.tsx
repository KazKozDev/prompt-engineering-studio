import { useState, useEffect } from 'react';
import { api } from './services/api';

// Components
import { Studio } from './components/Studio';
import { History } from './components/History';
import { PromptLibrary, type LibraryPrompt } from './components/PromptLibrary';
import { Datasets } from './components/Datasets';
import { Settings } from './components/Settings';
import { EvaluationLab } from './components/EvaluationLab';
// import { ProductionMetrics } from './components/ProductionMetrics'; // Hidden for now
import { DSPyOrchestrator } from './components/DSPyOrchestrator';
import { Help } from './components/Help';
import { Button } from './components/ui/Button';

// Navigation structure with groups - logical pipeline
const NAV_GROUPS = [
  {
    label: 'Create',
    items: [
      { id: 'Prompt Generator', label: 'Generator' },
      { id: 'DSPy Orchestrator', label: 'DSPy' },
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
      { id: 'History', label: 'History' },
    ]
  },
] as const;

type SectionId =
  | 'Prompt Generator' | 'DSPy Orchestrator'
  | 'Prompt Library' | 'Datasets'
  | 'Evaluation Lab' | 'History'
  | 'Settings'
  | 'Help';

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
  const [isLoading, setIsLoading] = useState(true);

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

  // Load models on mount + splash screen
  useEffect(() => {
    const initApp = async () => {
      await loadModels(settings.provider);
      // Show splash screen for 2 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };
    initApp();
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

  const handleSaveEvaluation = (promptId: string, evaluation: {
    qualityScore: number;
    robustnessScore: number;
    consistencyScore: number;
    overallScore: number;
    lastTested: string;
  }) => {
    // Update prompt in localStorage
    const stored = localStorage.getItem('prompt-library');
    if (stored) {
      const prompts = JSON.parse(stored);
      const updatedPrompts = prompts.map((p: LibraryPrompt) => {
        if (p.id === promptId) {
          return { ...p, evaluation };
        }
        return p;
      });
      localStorage.setItem('prompt-library', JSON.stringify(updatedPrompts));
      alert('Evaluation scores saved to prompt!');
    }
  };

  // Splash Screen
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            {/* Logo with pulse animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/50 opacity-20 blur-[100px] rounded-full animate-pulse"></div>
              <img
                src="/logo.png"
                alt="Prompt Engineering Studio"
                className="h-32 w-auto object-contain relative z-10 animate-fade-in"
              />
            </div>

            {/* Spinner */}
            <div className="relative w-12 h-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-white/60 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>

        {/* Add keyframe animations to global styles */}
        <style>{`
          @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }
          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-studio-bg text-slate-100">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-[#0a0a0a] border-b border-white/10 flex items-center px-5 shrink-0">
        <img src="/logo.png" alt="Prompt Engineering Studio" className="h-8 w-auto object-contain mr-6" />

        <nav className="flex items-center gap-6 flex-1">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.label} className="flex items-center gap-1">
              {groupIdx > 0 && <div className="w-px h-4 bg-white/10 mr-4" />}
              <span className="text-[9px] uppercase tracking-widest text-white/20 font-semibold mr-2">{group.label}</span>
              {group.items.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SectionId)}
                  variant="ghost"
                  size="sm"
                  className={
                    'px-2 py-1 text-[13px] whitespace-nowrap hover:bg-transparent ' +
                    (item.id === activeSection
                      ? 'text-white font-bold'
                      : 'text-white/50 hover:text-white hover:font-bold font-medium')
                  }
                >
                  {item.label}
                </Button>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveSection('Help')}
            variant="ghost"
            size="sm"
            className={
              'px-2 py-1 text-[13px] hover:bg-transparent ' +
              (activeSection === 'Help'
                ? 'text-white font-bold'
                : 'text-white/50 font-medium hover:text-white hover:font-bold')
            }
            title="Help"
          >
            Help
          </Button>
          <div className="w-px h-4 bg-white/10" />
          <Button
            onClick={() => setActiveSection('Settings')}
            variant="ghost"
            size="icon"
            className={
              'transition-all ' +
              (activeSection === 'Settings'
                ? 'text-white'
                : 'text-white/40 hover:text-white/80')
            }
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 font-medium pl-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            <span>v2.0 • Beta</span>
          </div>
        </div>
      </header>

      {/* Main content area - full width */}
      <main className="flex-1 overflow-hidden">
        <div style={{ display: activeSection === 'Prompt Generator' ? 'block' : 'none', height: '100%' }}>
          <Studio settings={settings} />
        </div>
        <div style={{ display: activeSection === 'Evaluation Lab' ? 'block' : 'none', height: '100%' }}>
          <EvaluationLab settings={settings} promptToEvaluate={promptToEvaluate} onSaveEvaluation={handleSaveEvaluation} />
        </div>
{/* Production Metrics hidden for now
        <div style={{ display: activeSection === 'Production Metrics' ? 'block' : 'none', height: '100%' }}>
          <ProductionMetrics />
        </div>
*/}
        <div style={{ display: activeSection === 'DSPy Orchestrator' ? 'block' : 'none', height: '100%' }}>
          <DSPyOrchestrator settings={settings} />
        </div>
        <div style={{ display: activeSection === 'History' ? 'block' : 'none', height: '100%' }}>
          <History />
        </div>
        <div style={{ display: activeSection === 'Prompt Library' ? 'block' : 'none', height: '100%' }}>
          <PromptLibrary onEvaluatePrompt={handleEvaluatePrompt} />
        </div>
        <div style={{ display: activeSection === 'Datasets' ? 'block' : 'none', height: '100%' }}>
          <Datasets settings={settings} />
        </div>
        <div style={{ display: activeSection === 'Settings' ? 'block' : 'none', height: '100%' }}>
          <Settings settings={settings} onSettingsChange={setSettings} />
        </div>
        <div style={{ display: activeSection === 'Help' ? 'block' : 'none', height: '100%' }}>
          <Help />
        </div>
      </main>
    </div>
  );
}

export default App;
