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

interface EvaluationLabProps {
  settings: SettingsState;
  promptToEvaluate?: LibraryPrompt | null;
}

type TabType = 'quality' | 'consistency' | 'robustness' | 'performance' | 'human' | 'overview';
type RobustnessTestType = 'format' | 'length' | 'adversarial';

const EVAL_CATEGORIES = [
  { id: 'quality' as TabType, label: 'Quality', desc: 'BLEU, ROUGE, G-Eval' },
  { id: 'consistency' as TabType, label: 'Consistency', desc: 'Self & Mutual' },
  { id: 'robustness' as TabType, label: 'Robustness', desc: 'Format, Length, Adversarial' },
  { id: 'performance' as TabType, label: 'Performance', desc: 'Latency, Cost, Reliability' },
  { id: 'human' as TabType, label: 'Human', desc: 'Rating, Ranking, A/B' },
  { id: 'overview' as TabType, label: 'Overview', desc: 'Aggregated Report' },
];

export function EvaluationLab({ settings, promptToEvaluate }: EvaluationLabProps) {
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
      const examplesData = await api.getExampleDatasets();
      setDatasets(examplesData.examples || []);
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

  return (
    <>
      <div className="h-full flex gap-6 p-6 overflow-hidden">
        {/* Left: Categories / Filters */}
        <div className="w-80 flex flex-col shrink-0 gap-4">
          <div>
            <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Evaluation Lab</h2>
            <p className="text-xs text-white/40 mb-4 mt-1">Choose evaluation type and run tests on your prompts.</p>
          </div>

          <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
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
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="text-sm font-semibold text-white/80 mb-1">{getActiveCategory()?.label}</div>
                <div className="text-[11px] text-white/40">{getActiveCategory()?.desc}</div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Progress</div>
                {EVAL_CATEGORIES.filter(c => c.id !== 'overview').map(cat => {
                  const hasResults = 
                    (cat.id === 'quality' && qualityResults) ||
                    (cat.id === 'consistency' && consistencyResults) ||
                    (cat.id === 'robustness' && robustnessResults);
                  return (
                    <div key={cat.id} className="flex items-center justify-between text-xs">
                      <span className={hasResults ? 'text-white/70' : 'text-white/30'}>{cat.label}</span>
                      {hasResults ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">Done</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/10">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Model Info */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Model</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Provider</span>
                  <span className="text-white/70">{settings.provider || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Model</span>
                  <span className="text-white/70 truncate max-w-[120px]">{settings.model || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Datasets</span>
                  <span className="text-white/70">{datasets.length}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
              <span>5 evaluation types</span>
              <span className="text-white/50">
                {[qualityResults, consistencyResults, robustnessResults].filter(Boolean).length} completed
              </span>
            </div>
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
              <Button
                onClick={() => setGuideOpen(true)}
                variant="secondary"
                size="xs"
                className="inline-flex items-center gap-1 text-[11px]"
              >
                <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
                Guide
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'quality' && (
              <QualityTab
                settings={settings}
                datasets={datasets}
                onModeChange={setQualityMode}
                onDatasetCreated={loadDatasets}
              />
            )}
            {activeTab === 'consistency' && (
              <ConsistencyTab
                settings={settings}
                onModeChange={setConsistencyMode}
              />
            )}
            {activeTab === 'robustness' && (
              <RobustnessLab
                settings={settings}
                datasets={datasets}
                onTestTypeChange={setRobustnessTestType}
                onDatasetCreated={loadDatasets}
              />
            )}
            {activeTab === 'performance' && (
              <PerformanceTab
                settings={settings}
                onModeChange={setPerformanceMode}
              />
            )}
            {activeTab === 'human' && (
              <HumanEvalTab
                settings={settings}
                onModeChange={setHumanEvalMode}
              />
            )}
            {activeTab === 'overview' && (
              <OverviewTab
                settings={settings}
                qualityResults={qualityResults}
                consistencyResults={consistencyResults}
                robustnessResults={robustnessResults}
              />
            )}
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
                  <span className="text-2xl font-bold text-white/30">—</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/50 mb-1">Run evaluations to see grade</div>
                  <div className="text-[10px] text-white/30">Quality + Consistency + Robustness</div>
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
                <span className="text-xs text-white/30">{qualityResults ? `${qualityResults.score}%` : '—'}</span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400/50"></div>
                  <span className="text-xs text-white/70">Consistency</span>
                </div>
                <span className="text-xs text-white/30">{consistencyResults ? `${consistencyResults.score}%` : '—'}</span>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400/50"></div>
                  <span className="text-xs text-white/70">Robustness</span>
                </div>
                <span className="text-xs text-white/30">{robustnessResults ? `${robustnessResults.score}%` : '—'}</span>
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

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Actions</div>
              <Button
                onClick={() => setActiveTab('overview')}
                variant="outline"
                size="xs"
                fullWidth
                className="justify-start text-xs"
              >
                <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Full Report
              </Button>
              <Button
                onClick={() => setGuideOpen(true)}
                variant="outline"
                size="xs"
                fullWidth
                className="justify-start text-xs"
              >
                <MethodologyIcon className="w-3.5 h-3.5 mr-2" />
                Methodology Guide
              </Button>
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
              {activeTab === 'quality' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">What It Does</div>
                    {qualityMode === 'reference' ? (
                      <p className="text-[11px] text-white/60">
                        Compares model outputs against <span className="text-white/80 font-medium">ground truth</span> using BLEU, ROUGE, and Exact Match metrics.
                      </p>
                    ) : (
                      <p className="text-[11px] text-white/60">
                        Uses <span className="text-white/80 font-medium">LLM-as-Judge</span> (G-Eval) to score outputs on relevance, coherence, and accuracy.
                      </p>
                    )}
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Metrics</div>
                    <ul className="text-[11px] text-white/60 space-y-1.5">
                      <li>• <span className="text-white/80">BLEU:</span> N-gram precision</li>
                      <li>• <span className="text-white/80">ROUGE:</span> Recall-based overlap</li>
                      <li>• <span className="text-white/80">Exact Match:</span> Binary correctness</li>
                      <li>• <span className="text-white/80">G-Eval:</span> LLM-scored quality</li>
                    </ul>
                  </div>
                </>
              )}

              {/* Consistency Guide */}
              {activeTab === 'consistency' && (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">What It Does</div>
                    {consistencyMode === 'self' ? (
                      <p className="text-[11px] text-white/60">
                        Runs the same prompt <span className="text-white/80 font-medium">N times</span> and measures output consistency.
                      </p>
                    ) : (
                      <p className="text-[11px] text-white/60">
                        Compares <span className="text-white/80 font-medium">multiple prompt variants</span> on the same inputs (GLaPE).
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Robustness Guide */}
              {activeTab === 'robustness' && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Test Types</div>
                  <ul className="text-[11px] text-white/60 space-y-1.5">
                    <li>• <span className="text-white/80">Format:</span> JSON vs plain text</li>
                    <li>• <span className="text-white/80">Length:</span> Context window limits</li>
                    <li>• <span className="text-white/80">Adversarial:</span> Injection attacks</li>
                  </ul>
                </div>
              )}

              {/* Performance Guide */}
              {activeTab === 'performance' && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Metrics</div>
                  <ul className="text-[11px] text-white/60 space-y-1.5">
                    <li>• <span className="text-white/80">Latency:</span> Avg, P50, P95, P99</li>
                    <li>• <span className="text-white/80">Cost:</span> Token usage, $ per request</li>
                    <li>• <span className="text-white/80">Reliability:</span> Success/failure rate</li>
                  </ul>
                </div>
              )}

              {/* Human Eval Guide */}
              {activeTab === 'human' && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Methods</div>
                  <ul className="text-[11px] text-white/60 space-y-1.5">
                    <li>• <span className="text-white/80">Rating:</span> Likert scale (1-5)</li>
                    <li>• <span className="text-white/80">Ranking:</span> Order by preference</li>
                    <li>• <span className="text-white/80">A/B:</span> Side-by-side comparison</li>
                  </ul>
                </div>
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
