import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { OfflineBenchmarks } from './evaluation/OfflineBenchmarks';
import { LabelFreeEval } from './evaluation/LabelFreeEval';
import { RobustnessLab } from './evaluation/RobustnessLab';
import { ComparisonView } from './evaluation/ComparisonView';
import { FullReport } from './evaluation/FullReport';
import { type LibraryPrompt } from './PromptLibrary';
import { MethodologyIcon } from './icons/MethodologyIcon';

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

type TabType = 'offline' | 'labelfree' | 'robustness' | 'comparison' | 'report';
type LabelFreeMode = 'consistency' | 'judge' | 'mutual';
type RobustnessTestType = 'format' | 'length' | 'adversarial';

export function EvaluationLab({ settings, promptToEvaluate }: EvaluationLabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('offline');
  const [datasets, setDatasets] = useState<any[]>([]);
  const [labelFreeMode, setLabelFreeMode] = useState<LabelFreeMode>('consistency');
  const [_robustnessTestType, setRobustnessTestType] = useState<RobustnessTestType>('format');
  const [offlineGuideOpen, setOfflineGuideOpen] = useState(false);
  const [labelFreeGuideOpen, setLabelFreeGuideOpen] = useState(false);
  const [robustnessGuideOpen, setRobustnessGuideOpen] = useState(false);
  const [comparisonGuideOpen, setComparisonGuideOpen] = useState(false);
  const [reportGuideOpen, setReportGuideOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Sync prompt when passed from Library (currently not used in UI but kept for future)
  useEffect(() => {
    if (promptToEvaluate) {
      // Could be used to pre-populate evaluation forms
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
    {
      id: 'report' as TabType,
      label: 'Unified Report',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
  ];

  const guideTitle =
    activeTab === 'offline'
      ? 'Offline Benchmarks'
      : activeTab === 'labelfree'
        ? labelFreeMode === 'consistency'
          ? 'Self-Consistency'
          : labelFreeMode === 'mutual'
            ? 'Mutual-Consistency (GLaPE)'
            : 'LLM-as-a-Judge'
        : activeTab === 'robustness'
          ? 'Robustness Testing'
          : activeTab === 'comparison'
            ? 'Comparison Guide'
            : 'Unified Report';

  const guideContent = (
    <>
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

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide">Production Use Cases</span>
            </div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">💬</span>
                <span><span className="text-white/80">Customer Support:</span> Compare chatbot response quality against golden answers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">📄</span>
                <span><span className="text-white/80">Document Summarization:</span> Evaluate summary accuracy vs. human-written summaries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">🌐</span>
                <span><span className="text-white/80">Translation Services:</span> Measure translation quality against professional translations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">🏷️</span>
                <span><span className="text-white/80">Content Classification:</span> Test prompt accuracy for categorizing support tickets, emails</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">📊</span>
                <span><span className="text-white/80">Data Extraction:</span> Validate structured data extraction from invoices, contracts</span>
              </li>
            </ul>
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
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Interpretation</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      Higher <span className="text-white/70">Consistency Score (closer to 1.0)</span> means the model is confident. Low scores indicate potential hallucinations or ambiguous instructions.
                    </p>
                  </div>
                  <a href="https://arxiv.org/abs/2203.11171" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1 mt-2">
                    <span>Wang et al. (2022) - Self-Consistency</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </p>
              )}
              {labelFreeMode === 'mutual' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Compares outputs from <span className="text-white/80 font-medium">multiple prompt variants</span> and measures how
                  often they agree (GLaPE). High mutual agreement suggests all prompts capture the task well.
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Interpretation</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      High <span className="text-white/70">GLaPE Score</span> means different prompts converge on the same answer. Use this to identify the "consensus" prompt when ground truth is missing.
                    </p>
                  </div>
                  <a href="https://arxiv.org/abs/2305.14658" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1 mt-2">
                    <span>Deng et al. (2023) - GLaPE</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </p>
              )}
              {labelFreeMode === 'judge' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Uses an <span className="text-white/80 font-medium">LLM as an automatic judge</span> to score a single response along
                  general quality dimensions (relevance, correctness, clarity).
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Interpretation</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      <span className="text-white/70">Score (0-1)</span> reflects overall quality. <span className="text-white/70">Confidence</span> shows how sure the judge is. Always read the <span className="text-white/70">Reasoning</span> for qualitative feedback.
                    </p>
                  </div>
                  <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1 mt-2">
                    <span>Zheng et al. (2023) - LLM-as-a-Judge</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
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

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide">Production Use Cases</span>
            </div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              {labelFreeMode === 'consistency' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🤖</span>
                    <span><span className="text-white/80">Chatbot Reliability:</span> Ensure consistent answers to FAQ across sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">📧</span>
                    <span><span className="text-white/80">Email Auto-Replies:</span> Verify stable tone and messaging in automated responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🎯</span>
                    <span><span className="text-white/80">Content Moderation:</span> Test if classification decisions are stable and reproducible</span>
                  </li>
                </>
              )}
              {labelFreeMode === 'mutual' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🔄</span>
                    <span><span className="text-white/80">Prompt A/B Testing:</span> Compare different instruction phrasings before rollout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🌍</span>
                    <span><span className="text-white/80">Multi-Language Consistency:</span> Verify prompts work equally well across languages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">👥</span>
                    <span><span className="text-white/80">Team Alignment:</span> Ensure different team members' prompts produce similar results</span>
                  </li>
                </>
              )}
              {labelFreeMode === 'judge' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">✍️</span>
                    <span><span className="text-white/80">Content Quality:</span> Score blog posts, product descriptions without manual review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">💡</span>
                    <span><span className="text-white/80">Creative Outputs:</span> Evaluate marketing copy, slogans where no "correct" answer exists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🎓</span>
                    <span><span className="text-white/80">Training Data Filtering:</span> Auto-score generated examples for fine-tuning datasets</span>
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
              {_robustnessTestType === 'format' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Tests if your prompt <span className="text-white/80 font-medium">maintains performance</span> when formatting changes (capitalization, spacing, punctuation). Critical for ensuring <span className="text-white/80 font-medium">cross-platform consistency</span> and handling real user input variations.
                </p>
              )}
              {_robustnessTestType === 'length' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Measures <span className="text-white/80 font-medium">performance degradation</span> as context length increases. Essential for <span className="text-white/80 font-medium">RAG systems</span> and applications with long conversation histories or document processing.
                </p>
              )}
              {_robustnessTestType === 'adversarial' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Evaluates <span className="text-white/80 font-medium">resistance to malicious inputs</span>, prompt injection, and adversarial attacks. Crucial for <span className="text-white/80 font-medium">security validation</span> before production deployment.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Test Types</span>
            </div>
            <div className="space-y-2">
              {_robustnessTestType === 'format' && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/80">Format Sensitivity</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                    Generates variations with different <span className="text-white/70">capitalization</span>, <span className="text-white/70">spacing</span>, and <span className="text-white/70">punctuation</span>. Measures if minor formatting changes cause performance drops. Essential for multi-platform deployment where user input varies.
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Interpretation</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      High <span className="text-white/70">Robustness Score (&gt;0.9)</span> indicates stability. Large negative <span className="text-white/70">Performance Delta</span> means the prompt is fragile to formatting changes.
                    </p>
                  </div>
                  <a href="https://arxiv.org/abs/2102.09690" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1 mt-2">
                    <span>Zhao et al. (2021) - Calibrate Before Use</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )}

              {_robustnessTestType === 'length' && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/80">Context Length ("Context Rot")</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                    Tests at <span className="text-white/70">1x, 2x, 4x, 8x</span> context lengths to find degradation point. Simulates long documents, chat histories, and multi-document RAG. Returns exact token threshold where quality drops &gt;20%.
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Interpretation</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      <span className="text-white/70">Performance Delta</span> shows accuracy drop at max context. If degradation occurs at X tokens, keep inputs below this limit to avoid "Lost in the Middle" phenomenon.
                    </p>
                  </div>
                  <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1 mt-2">
                    <span>Liu et al. (2023) - Lost in the Middle</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )}

              {_robustnessTestType === 'adversarial' && (
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/80">Adversarial Tests</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                    Injects <span className="text-white/70">noise</span> (typos, character swaps, deletions) at light/medium/heavy levels. Measures robustness to adversarial examples and malformed input. Critical for security validation before public deployment.
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Interpretation</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      A significant drop in score compared to <span className="text-white/70">Clean baseline</span> indicates vulnerability. Use this to identify need for better input sanitization or defensive prompting.
                    </p>
                  </div>
                  <a href="https://arxiv.org/abs/2202.03286" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#007AFF] hover:text-[#0071E3] flex items-center gap-1 mt-2">
                    <span>Perez et al. (2022) - Red Teaming LMs</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide">Production Use Cases</span>
            </div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              {_robustnessTestType === 'format' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🌐</span>
                    <span><span className="text-white/80">Multi-Platform Deployment:</span> Ensure prompts work across mobile apps, web interfaces, and API calls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">📱</span>
                    <span><span className="text-white/80">User Input Variations:</span> Test with different capitalization, spacing, punctuation from real users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🔤</span>
                    <span><span className="text-white/80">Localization Testing:</span> Verify prompts handle different text encodings and special characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">⚡</span>
                    <span><span className="text-white/80">Template Flexibility:</span> Validate that minor formatting changes don't break functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🎨</span>
                    <span><span className="text-white/80">UI/UX Consistency:</span> Test prompts with different markdown, HTML, or plain text formats</span>
                  </li>
                </>
              )}
              {_robustnessTestType === 'length' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">📚</span>
                    <span><span className="text-white/80">RAG Systems:</span> Test if retrieval quality degrades with 10+ documents in context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">📄</span>
                    <span><span className="text-white/80">Long Document Analysis:</span> Verify accuracy when processing full contracts, reports, manuals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">💬</span>
                    <span><span className="text-white/80">Chat History:</span> Ensure chatbots maintain quality with extensive conversation history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🔍</span>
                    <span><span className="text-white/80">Search Results:</span> Test performance when context includes many search snippets or FAQs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">📊</span>
                    <span><span className="text-white/80">Data Processing:</span> Validate behavior with large datasets, tables, or structured data in context</span>
                  </li>
                </>
              )}
              {_robustnessTestType === 'adversarial' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🔐</span>
                    <span><span className="text-white/80">Security Testing:</span> Verify prompts resist injection attacks, jailbreaks before public deployment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🛡️</span>
                    <span><span className="text-white/80">Content Safety:</span> Test resistance to generating harmful, biased, or inappropriate content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">⚠️</span>
                    <span><span className="text-white/80">Malicious Input Handling:</span> Validate behavior with typos, gibberish, adversarial examples</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🎭</span>
                    <span><span className="text-white/80">Role-Playing Attacks:</span> Ensure prompts reject requests to ignore instructions or change behavior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400/60">🔒</span>
                    <span><span className="text-white/80">Compliance Validation:</span> Test prompts don't leak sensitive data or violate policies under stress</span>
                  </li>
                </>
              )}
            </ul>
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

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide">Production Use Cases</span>
            </div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">🎯</span>
                <span><span className="text-white/80">Model Selection:</span> Compare GPT-4 vs Claude vs Llama for your specific use case before committing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">🔄</span>
                <span><span className="text-white/80">Prompt Optimization:</span> A/B test different instruction styles to find the best performer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">📊</span>
                <span><span className="text-white/80">Cost vs Quality:</span> Compare expensive vs cheaper models to find optimal cost-performance balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">🔍</span>
                <span><span className="text-white/80">Version Testing:</span> Compare new prompt versions against current production baseline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400/60">👥</span>
                <span><span className="text-white/80">Stakeholder Demos:</span> Show side-by-side results to get buy-in from non-technical teams</span>
              </li>
            </ul>
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
      )
      }

      {/* Full Report Guide */}
      {activeTab === 'report' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Unified Report</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 space-y-2">
            <p className="text-[11px] text-white/60 leading-relaxed">
              FullReport объединяет метрики качества, label-free проверки и робастность в одном экране. Используйте готовый датасет, чтобы получить общий Grade, увидеть слабые места и рекомендации.
            </p>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Шаги: выберите промпт, подключите датасет, нажмите Generate. В резюме — итоговый балл и заметки; ниже — детали по Quality, Stability и Robustness. Отлично подходит для быстрой демонстрации стейкхолдерам без переключения вкладок.
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="relative h-full flex gap-6 p-6 overflow-hidden">
        {/* Left Sidebar: Navigation */}
        <div className="w-64 flex flex-col shrink-0 gap-4">
          <div>
            <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">EVALUATION LAB</h2>
            <p className="text-xs text-white/40 mb-4 mt-1">Comprehensive prompt evaluation suite</p>
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
              <OfflineBenchmarks settings={settings} datasets={datasets} onDatasetCreated={loadDatasets} />
            )}
            {activeTab === 'labelfree' && (
              <LabelFreeEval settings={settings} onModeChange={setLabelFreeMode} />
            )}
            {activeTab === 'robustness' && (
              <RobustnessLab settings={settings} datasets={datasets} onTestTypeChange={setRobustnessTestType} onDatasetCreated={loadDatasets} />
            )}
            {activeTab === 'comparison' && (
              <ComparisonView settings={settings} datasets={datasets} onDatasetCreated={loadDatasets} />
            )}
            {activeTab === 'report' && (
              <FullReport
                provider={settings.provider}
                model={settings.model}
                initialPrompt={promptToEvaluate?.text || ''}
                initialDataset={datasets?.[0]?.data || []}
              />
            )}
          </div>
        </div>

        {/* Offline tab: collapsed help strip with slide-out panel */}
        {activeTab === 'offline' && (
          <>
            <div className="absolute top-6 right-2 z-10">
              <button
                onClick={() => setOfflineGuideOpen(true)}
                className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60 hover:border-[#007AFF]/40 hover:text-white transition-colors shadow-lg shadow-black/30"
              >
                <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </>
        )}

        {/* Label-free: collapsed help strip with slide-out panel */}
        {activeTab === 'labelfree' && (
          <>
            <div className="absolute top-6 right-2 z-10">
              <button
                onClick={() => setLabelFreeGuideOpen(true)}
                className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60 hover:border-[#007AFF]/40 hover:text-white transition-colors shadow-lg shadow-black/30"
              >
                <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </>
        )}

        {/* Robustness: collapsed help strip with slide-out panel */}
        {activeTab === 'robustness' && (
          <>
            <div className="absolute top-6 right-2 z-10">
              <button
                onClick={() => setRobustnessGuideOpen(true)}
                className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60 hover:border-[#007AFF]/40 hover:text-white transition-colors shadow-lg shadow-black/30"
              >
                <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </>
        )}

        {/* Comparison: collapsed help strip with slide-out panel */}
        {activeTab === 'comparison' && (
          <>
            <div className="absolute top-6 right-2 z-10">
              <button
                onClick={() => setComparisonGuideOpen(true)}
                className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60 hover:border-[#007AFF]/40 hover:text-white transition-colors shadow-lg shadow-black/30"
              >
                <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </>
        )}

        {/* Unified Report: collapsed help strip with slide-out panel */}
        {activeTab === 'report' && (
          <>
            <div className="absolute top-6 right-2 z-10">
              <button
                onClick={() => setReportGuideOpen(true)}
                className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60 hover:border-[#007AFF]/40 hover:text-white transition-colors shadow-lg shadow-black/30"
              >
                <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </>
        )}
      </div>
      {isClient && typeof document !== 'undefined' && (activeTab === 'offline'
        ? offlineGuideOpen
        : activeTab === 'labelfree'
          ? labelFreeGuideOpen
          : activeTab === 'robustness'
            ? robustnessGuideOpen
            : activeTab === 'comparison'
              ? comparisonGuideOpen
              : reportGuideOpen) && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => {
                  if (activeTab === 'offline') setOfflineGuideOpen(false);
                  else if (activeTab === 'labelfree') setLabelFreeGuideOpen(false);
                  else if (activeTab === 'robustness') setRobustnessGuideOpen(false);
                  else if (activeTab === 'comparison') setComparisonGuideOpen(false);
                  else if (activeTab === 'report') setReportGuideOpen(false);
                }}>
                  <div
                    className="w-[440px] max-w-full h-full bg-[#0f1115] border-l border-white/10 shadow-2xl shadow-black/60 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Best Practices</p>
                        <h3 className="text-lg font-semibold text-white/90">{guideTitle}</h3>
                      </div>
                      <button
                        onClick={() => {
                          if (activeTab === 'offline') setOfflineGuideOpen(false);
                          else if (activeTab === 'labelfree') setLabelFreeGuideOpen(false);
                          else if (activeTab === 'robustness') setRobustnessGuideOpen(false);
                          else if (activeTab === 'comparison') setComparisonGuideOpen(false);
                          else if (activeTab === 'report') setReportGuideOpen(false);
                        }}
                        className="p-2 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-white/80 leading-relaxed custom-scrollbar">
                      {guideContent}
                    </div>
                    <div className="px-5 py-3 border-t border-white/10 flex justify-end">
                      <button
                        onClick={() => {
                          if (activeTab === 'offline') setOfflineGuideOpen(false);
                          else if (activeTab === 'labelfree') setLabelFreeGuideOpen(false);
                          else if (activeTab === 'robustness') setRobustnessGuideOpen(false);
                          else if (activeTab === 'comparison') setComparisonGuideOpen(false);
                          else if (activeTab === 'report') setReportGuideOpen(false);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
    </>
  );
}
