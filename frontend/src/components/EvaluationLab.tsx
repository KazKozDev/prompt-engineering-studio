import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { OfflineBenchmarks } from './evaluation/OfflineBenchmarks';
import { LabelFreeEval } from './evaluation/LabelFreeEval';
import { RobustnessLab } from './evaluation/RobustnessLab';
import { ComparisonView } from './evaluation/ComparisonView';
import { type LibraryPrompt } from './PromptLibrary';

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

type TabType = 'offline' | 'labelfree' | 'robustness' | 'comparison';
type LabelFreeMode = 'consistency' | 'judge' | 'mutual';
type RobustnessTestType = 'format' | 'length' | 'adversarial';

export function EvaluationLab({ settings, promptToEvaluate }: EvaluationLabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('offline');
  const [datasets, setDatasets] = useState<any[]>([]);
  const [labelFreeMode, setLabelFreeMode] = useState<LabelFreeMode>('consistency');
  const [robustnessTestType, setRobustnessTestType] = useState<RobustnessTestType>('format');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPromptText, setSelectedPromptText] = useState('');

  // When a prompt is passed from Library, set it
  useEffect(() => {
    if (promptToEvaluate) {
      setSelectedPromptText(promptToEvaluate.text);
    }
  }, [promptToEvaluate]);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const examplesData = await api.getExampleDatasets();
      setDatasets(examplesData.examples || []);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const tabs = [
    {
      id: 'offline' as TabType,
      label: 'Offline Benchmarks',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      id: 'labelfree' as TabType,
      label: 'Label-Free Eval',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
    },
    {
      id: 'robustness' as TabType,
      label: 'Robustness Lab',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    },
    {
      id: 'comparison' as TabType,
      label: 'Comparison View',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
  ];

  return (
    <div className="h-full flex gap-6 p-6 overflow-hidden">
      {/* Left Sidebar: Navigation */}
      <div className="w-64 flex flex-col shrink-0 gap-4">
        <div>
          <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">EVALUATION LAB</h2>
          <p className="text-xs text-white/40 mb-6">Comprehensive prompt evaluation suite</p>
        </div>

        <div className="flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left border ${activeTab === tab.id
                ? 'bg-[#007AFF]/10 border-[#007AFF]/30 text-white'
                : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/[0.04] hover:border-white/10 hover:text-white/90'
                }`}
            >
              <span className={activeTab === tab.id ? 'text-[#007AFF]' : 'text-white/40'}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Middle Panel: Content */}
      <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'offline' && (
            <OfflineBenchmarks settings={settings} datasets={datasets} />
          )}
          {activeTab === 'labelfree' && (
            <LabelFreeEval settings={settings} onModeChange={setLabelFreeMode} />
          )}
          {activeTab === 'robustness' && (
            <RobustnessLab settings={settings} datasets={datasets} onTestTypeChange={setRobustnessTestType} />
          )}
          {activeTab === 'comparison' && (
            <ComparisonView settings={settings} />
          )}
        </div>
      </div>

      {/* Right Panel: Dynamic Workflow Guide */}
      <div className="w-80 shrink-0 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">
              {activeTab === 'offline' && 'Offline Benchmarks'}
              {activeTab === 'labelfree' && (
                labelFreeMode === 'consistency'
                  ? 'Self-Consistency'
                  : labelFreeMode === 'mutual'
                    ? 'Mutual-Consistency (GLaPE)'
                    : 'LLM-as-a-Judge'
              )}
              {activeTab === 'robustness' && 'Robustness Testing'}
              {activeTab === 'comparison' && 'Comparison Guide'}
            </h2>
            <p className="text-[10px] text-white/40">Methodology & Best Practices</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Offline Benchmarks Guide */}
          {activeTab === 'offline' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Measures</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Compares model outputs against <span className="text-white/80 font-medium">labeled ground truth</span> using standard NLP metrics.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Metrics</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">BLEU Score</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                      Measures n-gram overlap. Best for translation, summarization.
                    </p>
                    <a href="https://aclanthology.org/P02-1040.pdf" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1">
                      <span>Papineni et al. (2002)</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">ROUGE</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                      Recall-oriented metric. Ideal for summarization tasks.
                    </p>
                    <a href="https://aclanthology.org/W04-1013.pdf" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1">
                      <span>Lin (2004)</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">Exact Match</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Binary metric. Perfect for QA, classification tasks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">When to Use</span>
                </div>
                <ul className="text-[11px] text-white/60 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>You have <span className="text-white/80">labeled datasets</span> with ground truth.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Comparing <span className="text-white/80">multiple prompt variants</span>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Need <span className="text-white/80">quantitative benchmarks</span>.</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Label-Free Evaluation Guide (mode-aware) */}
          {activeTab === 'labelfree' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What This Mode Does</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  {labelFreeMode === 'consistency' && (
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Runs the <span className="text-white/80 font-medium">same prompt multiple times</span> and measures how stable the
                      outputs are. Lower variance typically means the instruction is clearer and more robust.
                    </p>
                  )}
                  {labelFreeMode === 'mutual' && (
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Compares outputs from <span className="text-white/80 font-medium">multiple prompt variants</span> and measures how
                      often they agree (GLaPE). High mutual agreement suggests all prompts capture the task well.
                    </p>
                  )}
                  {labelFreeMode === 'judge' && (
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Uses an <span className="text-white/80 font-medium">LLM as an automatic judge</span> to score a single response along
                      general quality dimensions (relevance, correctness, clarity).
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items:center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">How to Use</span>
                </div>
                <ul className="text-[11px] text-white/60 space-y-1.5">
                  {labelFreeMode === 'consistency' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Start with <span className="text-white/80">5–10 samples</span> to get a stable estimate.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Use for <span className="text-white/80">single prompt instructions</span> (no variants).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Look for <span className="text-white/80">high consistency score</span> and few outlier responses.</span>
                      </li>
                    </>
                  )}

                  {labelFreeMode === 'mutual' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Add at least <span className="text-white/80">2–5 prompt variants</span> to compare.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Use when you need to <span className="text-white/80">pick a winner</span> between candidate prompts.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Focus on <span className="text-white/80">average consistency</span> and the best-scoring prompts.</span>
                      </li>
                    </>
                  )}

                  {labelFreeMode === 'judge' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Paste a <span className="text-white/80">single model response</span> you want to evaluate.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Use when you lack labels but still need a <span className="text-white/80">numeric quality signal</span>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        <span>Pay attention to <span className="text-white/80">score</span>, <span className="text-white/80">confidence</span> and
                          the judge's reasoning.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Robustness Lab Guide */}
          {activeTab === 'robustness' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Measures</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Tests prompt <span className="text-white/80 font-medium">stability under perturbations</span> and edge cases.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Test Types</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">Format Sensitivity</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                      Tests if prompt works with different formatting (spacing, capitalization, etc.).
                    </p>
                    <a href="https://arxiv.org/abs/2104.08786" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1">
                      <span>Zhao et al. (2021)</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">Context Length ("Context Rot")</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                      Measures performance degradation as context grows. Critical for RAG systems.
                    </p>
                    <a href="https://arxiv.org/abs/2404.06654" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1">
                      <span>Liu et al. (2024)</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white/80">Adversarial Tests</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                      Tests resistance to prompt injection, jailbreaks, and malicious inputs.
                    </p>
                    <a href="https://arxiv.org/abs/2302.12173" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1">
                      <span>Perez et al. (2023)</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">When to Use</span>
                </div>
                <ul className="text-[11px] text-white/60 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Before <span className="text-white/80">production deployment</span>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Testing <span className="text-white/80">user-facing systems</span>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Need <span className="text-white/80">security validation</span>.</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Comparison View Guide */}
          {activeTab === 'comparison' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Does</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Side-by-side comparison of <span className="text-white/80 font-medium">multiple prompts or models</span> on the same inputs.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Best Practices</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      <span className="text-white/80 font-medium">Use diverse test cases</span> covering common and edge scenarios.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      <span className="text-white/80 font-medium">Compare systematically</span> - same inputs, same evaluation criteria.
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      <span className="text-white/80 font-medium">Document differences</span> to understand trade-offs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">When to Use</span>
                </div>
                <ul className="text-[11px] text-white/60 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>A/B testing <span className="text-white/80">prompt variants</span>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Choosing between <span className="text-white/80">different models</span>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400/60">•</span>
                    <span>Need <span className="text-white/80">qualitative review</span>.</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

