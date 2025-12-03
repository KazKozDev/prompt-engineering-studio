import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { QualityTab, type QualityMode } from './evaluation/QualityTab';
import { ConsistencyTab, type ConsistencyMode } from './evaluation/ConsistencyTab';
import { RobustnessLab } from './evaluation/RobustnessLab';
import { PerformanceTab, type PerformanceMode } from './evaluation/PerformanceTab';
import { HumanEvalTab, type HumanEvalMode } from './evaluation/HumanEvalTab';
import { OverviewTab } from './evaluation/OverviewTab';
import { type LibraryPrompt } from './PromptLibrary';
import { MethodologyIcon } from './icons/MethodologyIcon';
import { Button } from './ui/Button';

interface SettingsState {
  provider: string;
  model: string;
  apiKey: string;
  theme: string;
  autoSave: boolean;
}

interface EvaluationResults {
  qualityScore: number;
  robustnessScore: number;
  consistencyScore: number;
  overallScore: number;
  lastTested: string;
  datasetId?: string;
  datasetName?: string;
}

interface EvaluationLabProps {
  settings: SettingsState;
  promptToEvaluate?: LibraryPrompt | null;
  onSaveEvaluation?: (promptId: string, evaluation: EvaluationResults) => void;
}

type TabType = 'quality' | 'consistency' | 'robustness' | 'performance' | 'human' | 'overview';
type RobustnessTestType = 'format' | 'length' | 'adversarial';

const EVAL_CATEGORIES = [
  {
    id: 'quality' as TabType,
    label: 'Quality',
    desc: 'BLEU, ROUGE, G-Eval',
    infoLines: [
      'Does the model produce correct and useful answers?',
      'Best for:',
      '→ Translation',
      '→ Q&A',
      '→ Summarization',
      '→ Template-based content',
    ],
  },
  {
    id: 'consistency' as TabType,
    label: 'Consistency',
    desc: 'Self & Mutual',
    infoLines: [
      'Does the model give the same answer for the same request?',
      'Recommended for finance, healthcare, and compliance workflows where stability matters.',
    ],
  },
  {
    id: 'robustness' as TabType,
    label: 'Robustness',
    desc: 'Format, Length, Adversarial',
    infoLines: [
      'Does the prompt break on noisy, unusual, or hostile inputs?',
      'Recommended for public chatbots, moderation, and security‑sensitive applications.',
    ],
  },
  {
    id: 'performance' as TabType,
    label: 'Performance',
    desc: 'Latency, Cost, Reliability',
    infoLines: [
      'How fast is the system and сколько стоит один вызов?',
      'Recommended for production deployment, SLAs, and budget/capacity planning.',
    ],
  },
  {
    id: 'human' as TabType,
    label: 'Human',
    desc: 'Rating, Ranking, A/B',
    infoLines: [
      'Что думают люди о качестве ответов?',
      'Recommended for creative copy, UI text, and high‑stakes decisions needing human review.',
    ],
  },
  {
    id: 'overview' as TabType,
    label: 'Overview',
    desc: 'Aggregated Report',
    infoLines: [
      'Review combined scores across Quality, Consistency, and Robustness in one place.',
      'Recommended before production launch and when presenting results to stakeholders.',
    ],
  },
];

export function EvaluationLab({ settings, promptToEvaluate, onSaveEvaluation }: EvaluationLabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('quality');
  const [datasets, setDatasets] = useState<any[]>([]);
  const [qualityMode, setQualityMode] = useState<QualityMode>('reference');
  const [consistencyMode, setConsistencyMode] = useState<ConsistencyMode>('self');
  const [robustnessTestType, setRobustnessTestType] = useState<RobustnessTestType>('format');
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('latency');
  const [humanEvalMode, setHumanEvalMode] = useState<HumanEvalMode>('rating');
  const [guideOpen, setGuideOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [qualityResults, _setQualityResults] = useState<any>(null);
  const [consistencyResults, _setConsistencyResults] = useState<any>(null);
  const [robustnessResults, _setRobustnessResults] = useState<any>(null);

  useEffect(() => {
    if (promptToEvaluate) {
      console.log('Prompt to evaluate:', promptToEvaluate);
    }
  }, [promptToEvaluate]);

  useEffect(() => {
    loadDatasets();
    setIsClient(true);
  }, []);

  const loadDatasets = async () => {
    try {
      const datasetsRes = await api.listDatasets();
      const metaList = datasetsRes.datasets || [];

      // Load full dataset objects so evaluation tabs have access to .data
      const withData = await Promise.all(
        metaList.map(async (d: any) => {
          try {
            const full = await api.getDataset(d.id);
            return full || d;
          } catch {
            return d;
          }
        })
      );

      setDatasets(withData);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const getGuideTitle = () => {
    switch (activeTab) {
      case 'quality':
        return qualityMode === 'reference' ? 'Reference-Based Evaluation' : 'LLM-as-Judge (G-Eval)';
      case 'consistency':
        return consistencyMode === 'self' ? 'Self-Consistency' : 'Mutual-Consistency (GLaPE)';
      case 'robustness':
        return robustnessTestType === 'format' ? 'Format Sensitivity' :
               robustnessTestType === 'length' ? 'Context Length' : 'Adversarial Tests';
      case 'performance':
        return performanceMode === 'latency' ? 'Latency Testing' :
               performanceMode === 'cost' ? 'Cost Analysis' : 'Reliability Testing';
      case 'human':
        return humanEvalMode === 'rating' ? 'Rating Scale' :
               humanEvalMode === 'ranking' ? 'Ranking' : 'A/B Testing';
      case 'overview':
        return 'Evaluation Overview';
      default:
        return 'Guide';
    }
  };

  const getActiveCategory = () => EVAL_CATEGORIES.find(c => c.id === activeTab);

  const getCategoryBorderAccent = (tab: TabType) => {
    switch (tab) {
      case 'quality':
        return 'border-l-sky-300/50';
      case 'consistency':
        return 'border-l-cyan-300/50';
      case 'robustness':
        return 'border-l-orange-300/60';
      case 'performance':
        return 'border-l-emerald-300/60';
      case 'human':
        return 'border-l-pink-300/60';
      case 'overview':
      default:
        return 'border-l-white/15';
    }
  };

  // Derived scores for summary panel (mirror OverviewTab logic)
  const getQualityScore = (): number | null => {
    if (!qualityResults) return null;
    if (qualityResults.mode === 'judge') {
      return qualityResults.score ?? null;
    }
    const bleu = qualityResults.metrics?.bleu ?? qualityResults.summary?.bleu ?? 0;
    const rouge = qualityResults.metrics?.rouge_l ?? qualityResults.summary?.rouge_l ?? 0;
    const em = qualityResults.metrics?.exact_match ?? qualityResults.summary?.exact_match ?? 0;
    return (bleu + rouge + em) / 3;
  };

  const getConsistencyScore = (): number | null => {
    if (!consistencyResults) return null;
    if (consistencyResults.mode === 'self') {
      return consistencyResults.consistency_score ?? consistencyResults.score ?? null;
    }
    return consistencyResults.glape_score ?? consistencyResults.agreement_score ?? null;
  };

  const getRobustnessScore = (): number | null => {
    if (!robustnessResults) return null;
    return robustnessResults.robustness_score ?? null;
  };

  const qualityScore = getQualityScore();
  const consistencyScore = getConsistencyScore();
  const robustnessScore = getRobustnessScore();

  const calculateOverallScore = (): number | null => {
    const scores: number[] = [];
    if (qualityScore !== null) scores.push(qualityScore);
    if (consistencyScore !== null) scores.push(consistencyScore);
    if (robustnessScore !== null) scores.push(robustnessScore);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const overallScore = calculateOverallScore();

  const hasAnyResults = qualityResults || consistencyResults || robustnessResults;

  return (
    <>
      <div className="h-full flex gap-6 p-6 overflow-hidden">
        {/* Left: Categories / Filters */}
        <div className="w-80 flex flex-col shrink-0">
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Evaluation Lab</h2>
              <p className="text-xs text-white/40 mb-4 mt-1">Choose evaluation type and run tests on your prompts.</p>
            </div>

            <div className="flex-1 flex flex-col">
              {/* Category Buttons */}
              <div className="p-3 border-b border-white/5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {EVAL_CATEGORIES.map(cat => (
                    <Button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      variant={activeTab === cat.id ? 'secondary' : 'outline'}
                      size="xs"
                      fullWidth
                      className="px-3 py-2 text-xs font-medium"
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

            {/* Selected Category Info */}
            <div className="flex-1 p-4 space-y-4">
              {getActiveCategory() && (
                <div
                  className={
                    'bg-white/[0.02] border border-white/10 rounded-lg px-3 py-3 border-l-2 ' +
                    getCategoryBorderAccent(activeTab)
                  }
                >
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
                    {getActiveCategory()!.label} checks
                  </div>
                  <ul className="space-y-1 text-[11px] text-white/60">
                    {getActiveCategory()!.infoLines?.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
            <span>5 evaluation types</span>
            <span className="text-white/50">
              {[qualityResults, consistencyResults, robustnessResults].filter(Boolean).length} completed
            </span>
          </div>
        </div>

        {/* Middle: Evaluation Content */}
        <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white/90 mb-1">{getActiveCategory()?.label} Evaluation</h2>
              <p className="text-xs text-white/45 mt-1">{getActiveCategory()?.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[11px] px-2 py-1 rounded-md border border-white/10 text-white/50 bg-black/30">
                {settings.provider} · {settings.model}
              </div>
              <button
                onClick={() => setGuideOpen(true)}
                className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-900/20 text-amber-300 hover:bg-amber-900/30 transition-all"
                title="Guide"
              >
                <MethodologyIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className={activeTab === 'quality' ? 'block' : 'hidden'}>
              <QualityTab
                settings={settings}
                datasets={datasets}
                onModeChange={setQualityMode}
                onDatasetCreated={loadDatasets}
                onResultsChange={_setQualityResults}
              />
            </div>
            <div className={activeTab === 'consistency' ? 'block' : 'hidden'}>
              <ConsistencyTab
                settings={settings}
                onModeChange={setConsistencyMode}
                onResultsChange={_setConsistencyResults}
              />
            </div>
            <div className={activeTab === 'robustness' ? 'block' : 'hidden'}>
              <RobustnessLab
                settings={settings}
                datasets={datasets}
                onTestTypeChange={setRobustnessTestType}
                onDatasetCreated={loadDatasets}
                onResultsChange={_setRobustnessResults}
              />
            </div>
            <div className={activeTab === 'performance' ? 'block' : 'hidden'}>
              <PerformanceTab
                settings={settings}
                onModeChange={setPerformanceMode}
              />
            </div>
            <div className={activeTab === 'human' ? 'block' : 'hidden'}>
              <HumanEvalTab
                settings={settings}
                onModeChange={setHumanEvalMode}
              />
            </div>
            <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
              <OverviewTab
                settings={settings}
                qualityResults={qualityResults}
                consistencyResults={consistencyResults}
                robustnessResults={robustnessResults}
                promptId={promptToEvaluate?.id}
                onSaveToPrompt={(promptId, scores) => {
                  if (onSaveEvaluation) {
                    onSaveEvaluation(promptId, scores);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Results / Summary */}
        <div className="w-[380px] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col shrink-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Evaluation Summary</h2>
              <p className="text-[10px] text-white/40">Overall scores and recommendations</p>
            </div>
          </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Overall Score Card */}
            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-xl p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Overall Grade</div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/70">
                    {overallScore !== null ? `${(overallScore * 100).toFixed(0)}` : '—'}
                  </span>
                </div>
                <div className="flex-1">
                  {overallScore === null ? (
                    <>
                      <div className="text-sm text-white/50 mb-1">Run evaluations to see grade</div>
                      <div className="text-[10px] text-white/30">Quality + Consistency + Robustness</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-white/60 mb-1">
                        Average score across Quality, Consistency, and Robustness.
                      </div>
                      <div className="text-[10px] text-white/40">
                        Higher than {(overallScore * 100).toFixed(0)}% of your current test runs.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dimension Scores */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dimensions</div>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400/50"></div>
                  <span className="text-xs text-white/70">Quality</span>
                </div>
                <span className="text-xs text-white/30">
                  {qualityScore !== null ? `${(qualityScore * 100).toFixed(0)}%` : '—'}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400/50"></div>
                  <span className="text-xs text-white/70">Consistency</span>
                </div>
                <span className="text-xs text-white/30">
                  {consistencyScore !== null ? `${(consistencyScore * 100).toFixed(0)}%` : '—'}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400/50"></div>
                  <span className="text-xs text-white/70">Robustness</span>
                </div>
                <span className="text-xs text-white/30">
                  {robustnessScore !== null ? `${(robustnessScore * 100).toFixed(0)}%` : '—'}
                </span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400/50"></div>
                  <span className="text-xs text-white/70">Performance</span>
                </div>
                <span className="text-xs text-white/30">—</span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400/50"></div>
                  <span className="text-xs text-white/70">Human Eval</span>
                </div>
                <span className="text-xs text-white/30">—</span>
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Configuration</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Provider</span>
                  <span className="text-white/70">{settings.provider || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Model</span>
                  <span className="text-white/70 truncate max-w-[180px]">{settings.model || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Datasets</span>
                  <span className="text-white/70">{datasets.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Actions</div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab('overview')}
                  variant="outline"
                  size="xs"
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs"
                  disabled={!hasAnyResults}
                >
                  View Full Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Panel */}
      {isClient && typeof document !== 'undefined' && guideOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setGuideOpen(false)}>
          <div
            className="w-[400px] max-w-full h-full bg-[#0f1115] border-l border-white/10 shadow-2xl shadow-black/60 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Methodology</p>
                <h3 className="text-lg font-semibold text-white/90">{getGuideTitle()}</h3>
              </div>
              <Button
                onClick={() => setGuideOpen(false)}
                variant="ghost"
                size="icon"
                className="p-2 text-white/70 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-white/80 leading-relaxed custom-scrollbar">
              {/* Quality Guide */}
              {activeTab === 'quality' && qualityMode === 'reference' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Reference-based evaluation compares model outputs against <span className="text-white/80 font-medium">ground truth labels</span> using automated metrics like BLEU, ROUGE, and Exact Match.
                    </p>
                    <a href="https://arxiv.org/abs/2002.05202" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      BLEU: A Method for Automatic Evaluation (Papineni et al.)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Translation, summarization, Q&A tasks</li>
                      <li>• When you have labeled test datasets</li>
                      <li>• Comparing prompt variants objectively</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">ML engineers, QA teams, researchers needing reproducible metrics.</p>
                  </div>
                </>
              )}

              {activeTab === 'quality' && qualityMode === 'judge' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      G-Eval uses an <span className="text-white/80 font-medium">LLM as a judge</span> to evaluate outputs on criteria like relevance, coherence, fluency, and accuracy without reference labels.
                    </p>
                    <a href="https://arxiv.org/abs/2303.16634" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      G-Eval: NLG Evaluation using GPT-4 (Liu et al., 2023)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Creative writing, open-ended generation</li>
                      <li>• No ground truth available</li>
                      <li>• Evaluating subjective quality</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Content teams, product managers, anyone evaluating generative outputs.</p>
                  </div>
                </>
              )}

              {/* Consistency Guide */}
              {activeTab === 'consistency' && consistencyMode === 'self' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Self-Consistency runs the <span className="text-white/80 font-medium">same prompt multiple times</span> and measures how often the model produces consistent answers. High variance indicates unreliable prompts.
                    </p>
                    <a href="https://arxiv.org/abs/2203.11171" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Self-Consistency Improves CoT Reasoning (Wang et al., 2022)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Testing prompt reliability</li>
                      <li>• Before deploying to production</li>
                      <li>• Debugging inconsistent outputs</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">DevOps, SRE teams, anyone deploying LLMs in production.</p>
                  </div>
                </>
              )}

              {activeTab === 'consistency' && consistencyMode === 'mutual' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      GLaPE (Generative Language Prompt Evaluation) compares <span className="text-white/80 font-medium">multiple prompt variants</span> on the same inputs to find which produces more consistent results.
                    </p>
                    <a href="https://arxiv.org/abs/2402.07927" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      GLaPE: Gold Label-agnostic Prompt Evaluation (2024)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• A/B testing prompt variants</li>
                      <li>• Prompt optimization without labels</li>
                      <li>• Finding the most stable prompt</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Prompt engineers, researchers comparing prompt strategies.</p>
                  </div>
                </>
              )}

              {/* Robustness Guide */}
              {activeTab === 'robustness' && robustnessTestType === 'format' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Tests how prompt performance changes with different <span className="text-white/80 font-medium">output formats</span> (JSON, markdown, plain text). Reveals format-dependent failures.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Building APIs with structured output</li>
                      <li>• Testing JSON parsing reliability</li>
                      <li>• Multi-format output requirements</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Backend developers, API designers, integration engineers.</p>
                  </div>
                </>
              )}

              {activeTab === 'robustness' && robustnessTestType === 'length' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Tests how prompt quality degrades as <span className="text-white/80 font-medium">context length increases</span>. Identifies the point where performance drops.
                    </p>
                    <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Lost in the Middle (Liu et al., 2023)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• RAG systems with long contexts</li>
                      <li>• Document processing pipelines</li>
                      <li>• Finding optimal chunk sizes</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">RAG developers, document AI teams, search engineers.</p>
                  </div>
                </>
              )}

              {activeTab === 'robustness' && robustnessTestType === 'adversarial' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Tests prompt resistance to <span className="text-white/80 font-medium">injection attacks</span>, jailbreaks, and malicious inputs. Essential for security-critical applications.
                    </p>
                    <a href="https://arxiv.org/abs/2302.12173" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Ignore This Title and HackAPrompt (Perez & Ribeiro, 2023)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• User-facing chatbots</li>
                      <li>• Security audits</li>
                      <li>• Before production deployment</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Security teams, red teamers, compliance officers.</p>
                  </div>
                </>
              )}

              {/* Performance Guide */}
              {activeTab === 'performance' && performanceMode === 'latency' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Measures <span className="text-white/80 font-medium">response time</span> across multiple requests. Reports avg, P50, P95, P99 latencies for SLA planning.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Real-time applications</li>
                      <li>• SLA definition and monitoring</li>
                      <li>• Comparing model providers</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Platform engineers, SREs, product managers defining UX requirements.</p>
                  </div>
                </>
              )}

              {activeTab === 'performance' && performanceMode === 'cost' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Tracks <span className="text-white/80 font-medium">token usage and costs</span> per request. Helps optimize prompts for budget efficiency.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Budget planning and forecasting</li>
                      <li>• Optimizing prompt length</li>
                      <li>• Comparing model cost-efficiency</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Finance teams, engineering managers, cost-conscious startups.</p>
                  </div>
                </>
              )}

              {activeTab === 'performance' && performanceMode === 'reliability' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      Measures <span className="text-white/80 font-medium">success/failure rates</span> across requests. Identifies timeout, rate limit, and error patterns.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Production monitoring setup</li>
                      <li>• Choosing reliable providers</li>
                      <li>• Designing retry strategies</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">SREs, DevOps, platform reliability engineers.</p>
                  </div>
                </>
              )}

              {/* Human Eval Guide */}
              {activeTab === 'human' && humanEvalMode === 'rating' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      <span className="text-white/80 font-medium">Likert scale (1-5)</span> rating on multiple criteria. Gold standard for subjective quality assessment.
                    </p>
                    <a href="https://arxiv.org/abs/2301.13298" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Human Evaluation of Text Generation (van der Lee et al.)
                    </a>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Final quality validation</li>
                      <li>• Calibrating automated metrics</li>
                      <li>• User research studies</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">UX researchers, content strategists, quality assurance teams.</p>
                  </div>
                </>
              )}

              {activeTab === 'human' && humanEvalMode === 'ranking' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      <span className="text-white/80 font-medium">Order responses by preference</span>. More reliable than absolute ratings for comparing multiple outputs.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Comparing 3+ prompt variants</li>
                      <li>• RLHF data collection</li>
                      <li>• Preference learning</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">ML researchers, RLHF teams, preference optimization engineers.</p>
                  </div>
                </>
              )}

              {activeTab === 'human' && humanEvalMode === 'ab' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Description</div>
                    <p className="text-[11px] text-white/60 mb-3">
                      <span className="text-white/80 font-medium">Side-by-side comparison</span> of two outputs. Simple binary choice with optional reasoning.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">When to Use</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• Quick prompt comparisons</li>
                      <li>• Model selection decisions</li>
                      <li>• Iterative prompt improvement</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Who Benefits</div>
                    <p className="text-[11px] text-white/60">Product teams, prompt engineers, anyone iterating on prompts.</p>
                  </div>
                </>
              )}

              {/* Overview Guide */}
              {activeTab === 'overview' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Grading Scale</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-bold">A+/A</span>
                        <span className="text-[11px] text-white/50">≥80% — Production ready</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold">B/C</span>
                        <span className="text-[11px] text-white/50">50-79% — Needs work</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-bold">D/F</span>
                        <span className="text-[11px] text-white/50">&lt;50% — Issues</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Model Info - always visible */}
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 mt-4">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Configuration</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Provider</span>
                    <span className="text-white/70">{settings.provider || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Model</span>
                    <span className="text-white/70 truncate max-w-[180px]">{settings.model || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Datasets</span>
                    <span className="text-white/70">{datasets.length}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-white/10 flex justify-end">
              <Button onClick={() => setGuideOpen(false)} variant="secondary" size="sm" className="px-4">
                Close
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
