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

  // Store results for Overview tab (will be populated via callbacks)
  const [qualityResults, _setQualityResults] = useState<any>(null);
  const [consistencyResults, _setConsistencyResults] = useState<any>(null);
  const [robustnessResults, _setRobustnessResults] = useState<any>(null);
  // TODO: Wire up result callbacks from child tabs to populate these

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

  const tabs = [
    {
      id: 'quality' as TabType,
      label: 'Quality',
      description: 'Reference-based & LLM-as-Judge',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      color: 'text-blue-400'
    },
    {
      id: 'consistency' as TabType,
      label: 'Consistency',
      description: 'Self & Mutual consistency',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      color: 'text-cyan-400'
    },
    {
      id: 'robustness' as TabType,
      label: 'Robustness',
      description: 'Format, Length, Adversarial',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      color: 'text-orange-400'
    },
    {
      id: 'performance' as TabType,
      label: 'Performance',
      description: 'Latency, Cost, Reliability',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'text-green-400'
    },
    {
      id: 'human' as TabType,
      label: 'Human Eval',
      description: 'Rating, Ranking, A/B',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      color: 'text-pink-400'
    },
    {
      id: 'overview' as TabType,
      label: 'Overview',
      description: 'Aggregated report',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      color: 'text-purple-400'
    },
  ];

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
        return humanEvalMode === 'rating' ? 'Rating Scale Evaluation' :
               humanEvalMode === 'ranking' ? 'Ranking Evaluation' : 'A/B Testing';
      case 'overview':
        return 'Evaluation Overview';
      default:
        return 'Guide';
    }
  };

  const guideContent = (
    <>
      {/* Quality Tab Guide */}
      {activeTab === 'quality' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Measures</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              {qualityMode === 'reference' ? (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Compares model outputs against <span className="text-white/80 font-medium">labeled ground truth</span> using standard NLP metrics: BLEU, ROUGE, and Exact Match.
                </p>
              ) : (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Uses an <span className="text-white/80 font-medium">LLM as an automatic judge</span> to score responses along quality dimensions (relevance, correctness, clarity).
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Metrics</span>
            </div>
            <div className="space-y-2">
              {qualityMode === 'reference' ? (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <span className="text-xs font-medium text-white/80">BLEU Score</span>
                    <p className="text-[11px] text-white/50 mt-1">N-gram overlap. Best for translation, summarization.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <span className="text-xs font-medium text-white/80">ROUGE-L</span>
                    <p className="text-[11px] text-white/50 mt-1">Recall-oriented. Ideal for summarization tasks.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <span className="text-xs font-medium text-white/80">Exact Match</span>
                    <p className="text-[11px] text-white/50 mt-1">Binary metric. Perfect for QA, classification.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <span className="text-xs font-medium text-white/80">Quality Score (0-1)</span>
                    <p className="text-[11px] text-white/50 mt-1">Overall quality assessment by the judge LLM.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <span className="text-xs font-medium text-white/80">Confidence</span>
                    <p className="text-[11px] text-white/50 mt-1">How certain the judge is about its assessment.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <span className="text-xs font-medium text-white/80">Reasoning</span>
                    <p className="text-[11px] text-white/50 mt-1">Qualitative explanation of the score.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">When to Use</div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              {qualityMode === 'reference' ? (
                <>
                  <li>• You have <span className="text-white/80">labeled datasets</span> with ground truth</li>
                  <li>• Comparing <span className="text-white/80">multiple prompt variants</span></li>
                  <li>• Need <span className="text-white/80">quantitative benchmarks</span></li>
                </>
              ) : (
                <>
                  <li>• No labeled data available</li>
                  <li>• Evaluating <span className="text-white/80">creative or open-ended</span> outputs</li>
                  <li>• Need <span className="text-white/80">qualitative feedback</span></li>
                </>
              )}
            </ul>
          </div>

          <a href="https://arxiv.org/abs/2303.16634" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-white/70 underline flex items-center gap-1">
            <span>G-Eval: Liu et al. (2023)</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </>
      )}

      {/* Consistency Tab Guide */}
      {activeTab === 'consistency' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Measures</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              {consistencyMode === 'self' ? (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Runs the <span className="text-white/80 font-medium">same prompt multiple times</span> and measures how stable the outputs are. Lower variance = clearer instructions.
                </p>
              ) : (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Compares outputs from <span className="text-white/80 font-medium">multiple prompt variants</span> (GLaPE). High agreement = prompts capture the task well.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Interpretation</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              {consistencyMode === 'self' ? (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  <span className="text-white/70">Score &gt; 80%</span>: Highly consistent, production-ready.<br/>
                  <span className="text-white/70">Score 50-80%</span>: Moderate variance, may need refinement.<br/>
                  <span className="text-white/70">Score &lt; 50%</span>: Unstable, likely ambiguous instructions.
                </p>
              ) : (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  High <span className="text-white/70">GLaPE Score</span> means different prompts converge on the same answer. Use this to identify the "consensus" prompt.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">Use Cases</div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              {consistencyMode === 'self' ? (
                <>
                  <li>• <span className="text-white/80">Chatbot Reliability:</span> Ensure consistent FAQ answers</li>
                  <li>• <span className="text-white/80">Content Moderation:</span> Stable classification decisions</li>
                  <li>• <span className="text-white/80">Email Auto-Replies:</span> Consistent tone and messaging</li>
                </>
              ) : (
                <>
                  <li>• <span className="text-white/80">Prompt A/B Testing:</span> Compare instruction phrasings</li>
                  <li>• <span className="text-white/80">Team Alignment:</span> Ensure team prompts produce similar results</li>
                  <li>• <span className="text-white/80">Multi-Language:</span> Verify prompts work across languages</li>
                </>
              )}
            </ul>
          </div>

          <a href="https://arxiv.org/abs/2203.11171" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-white/70 underline flex items-center gap-1">
            <span>Self-Consistency: Wang et al. (2022)</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </>
      )}

      {/* Robustness Tab Guide */}
      {activeTab === 'robustness' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Measures</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              {robustnessTestType === 'format' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Tests if your prompt <span className="text-white/80 font-medium">maintains performance</span> when formatting changes (capitalization, spacing, punctuation).
                </p>
              )}
              {robustnessTestType === 'length' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Measures <span className="text-white/80 font-medium">performance degradation</span> as context length increases. Essential for RAG systems.
                </p>
              )}
              {robustnessTestType === 'adversarial' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Evaluates <span className="text-white/80 font-medium">resistance to malicious inputs</span>, prompt injection, and adversarial attacks.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Interpretation</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              <p className="text-[11px] text-white/50 leading-relaxed">
                <span className="text-white/70">Robustness Score &gt; 0.9</span>: Stable, production-ready.<br/>
                <span className="text-white/70">Performance Delta</span>: Negative values indicate degradation under stress.
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">Use Cases</div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              {robustnessTestType === 'format' && (
                <>
                  <li>• <span className="text-white/80">Multi-Platform:</span> Mobile, web, API variations</li>
                  <li>• <span className="text-white/80">User Input:</span> Different capitalization, spacing</li>
                </>
              )}
              {robustnessTestType === 'length' && (
                <>
                  <li>• <span className="text-white/80">RAG Systems:</span> 10+ documents in context</li>
                  <li>• <span className="text-white/80">Long Documents:</span> Contracts, reports, manuals</li>
                </>
              )}
              {robustnessTestType === 'adversarial' && (
                <>
                  <li>• <span className="text-white/80">Security Testing:</span> Injection attacks, jailbreaks</li>
                  <li>• <span className="text-white/80">Content Safety:</span> Harmful content resistance</li>
                </>
              )}
            </ul>
          </div>

          <a href="https://arxiv.org/abs/2306.04528" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-white/70 underline flex items-center gap-1">
            <span>PromptRobust: Zhu et al. (2023)</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </>
      )}

      {/* Performance Tab Guide */}
      {activeTab === 'performance' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Measures</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              {performanceMode === 'latency' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Measures <span className="text-white/80 font-medium">response time</span> across multiple runs. Reports avg, P50, P95, P99 latencies.
                </p>
              )}
              {performanceMode === 'cost' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Estimates <span className="text-white/80 font-medium">token usage and cost</span> per request. Critical for budget planning.
                </p>
              )}
              {performanceMode === 'reliability' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Tracks <span className="text-white/80 font-medium">failure rate</span> and error types. Essential for production monitoring.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">Use Cases</div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              <li>• <span className="text-white/80">SLA Compliance:</span> Verify response times meet requirements</li>
              <li>• <span className="text-white/80">Cost Optimization:</span> Compare prompt efficiency</li>
              <li>• <span className="text-white/80">Capacity Planning:</span> Estimate infrastructure needs</li>
            </ul>
          </div>
        </>
      )}

      {/* Human Eval Tab Guide */}
      {activeTab === 'human' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Does</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              {humanEvalMode === 'rating' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  <span className="text-white/80 font-medium">Likert scale scoring</span> (1-5) across multiple criteria: relevance, accuracy, coherence, completeness, tone.
                </p>
              )}
              {humanEvalMode === 'ranking' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  <span className="text-white/80 font-medium">Order responses by preference</span>. Best for comparing multiple variants.
                </p>
              )}
              {humanEvalMode === 'ab' && (
                <p className="text-[11px] text-white/50 leading-relaxed">
                  <span className="text-white/80 font-medium">Side-by-side comparison</span> of two prompt/response variants. Pick a winner.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">Best Practices</div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              <li>• Use <span className="text-white/80">multiple evaluators</span> for reliability</li>
              <li>• Define <span className="text-white/80">clear criteria</span> before evaluation</li>
              <li>• <span className="text-white/80">Blind testing</span> reduces bias</li>
              <li>• Export results for <span className="text-white/80">stakeholder review</span></li>
            </ul>
          </div>
        </>
      )}

      {/* Overview Tab Guide */}
      {activeTab === 'overview' && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">What It Shows</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              <p className="text-[11px] text-white/50 leading-relaxed">
                Aggregates results from <span className="text-white/80 font-medium">Quality, Consistency, and Robustness</span> tabs into a single score and grade.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Grading Scale</span>
            </div>
            <div className="space-y-2">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-center gap-2">
                <span className="text-green-400 font-bold">A+/A</span>
                <span className="text-[11px] text-white/50">≥80% — Production ready</span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 flex items-center gap-2">
                <span className="text-yellow-400 font-bold">B/C</span>
                <span className="text-[11px] text-white/50">50-79% — Needs improvement</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
                <span className="text-red-400 font-bold">D/F</span>
                <span className="text-[11px] text-white/50">&lt;50% — Significant issues</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">How to Use</div>
            <ul className="text-[11px] text-white/60 space-y-1.5">
              <li>• Run evaluations in other tabs first</li>
              <li>• Check overall grade for production readiness</li>
              <li>• Review recommendations for improvements</li>
              <li>• Export report for stakeholders</li>
            </ul>
          </div>
        </>
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
            <p className="text-xs text-white/40 mb-4 mt-1">Test your prompts across 5 dimensions</p>
          </div>

          <div className="flex flex-col gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-3 w-full px-4 py-3 rounded-xl text-left transition-all border ${
                  activeTab === tab.id
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }`}
              >
                <span className={`mt-0.5 ${activeTab === tab.id ? tab.color : 'text-white/40'}`}>
                  {tab.icon}
                </span>
                <div>
                  <div className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-white/70'}`}>
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-white/40">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Quick Stats</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Datasets</span>
                <span className="text-white/70">{datasets.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Model</span>
                <span className="text-white/70 truncate max-w-[120px]">{settings.model || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel: Content */}
        <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
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

        {/* Help Button */}
        <div className="absolute top-6 right-2 z-10">
          <Button
            onClick={() => setGuideOpen(true)}
            variant="subtle"
            size="xs"
            pill
            className="group px-3 py-2 text-[11px] shadow-lg shadow-black/30"
          >
            <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
          </Button>
        </div>
      </div>

      {/* Guide Panel */}
      {isClient && typeof document !== 'undefined' && guideOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setGuideOpen(false)}>
          <div
            className="w-[440px] max-w-full h-full bg-[#0f1115] border-l border-white/10 shadow-2xl shadow-black/60 flex flex-col"
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-white/80 leading-relaxed custom-scrollbar">
              {guideContent}
            </div>
            <div className="px-5 py-3 border-t border-white/10 flex justify-end">
              <Button
                onClick={() => setGuideOpen(false)}
                variant="secondary"
                size="sm"
                className="px-4"
              >
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
