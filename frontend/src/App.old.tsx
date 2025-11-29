import { useState } from 'react';

const SIDEBAR_ITEMS = ['Studio', 'History', 'Templates', 'Datasets', 'API Keys', 'Settings'] as const;
type SidebarItem = (typeof SIDEBAR_ITEMS)[number];

const TASK_TYPES = ['General', 'Reasoning', 'Coding', 'Summarization', 'Creative Writing', 'Data Extraction'] as const;
type TaskType = (typeof TASK_TYPES)[number];

const OUTPUT_TABS = ['Latest Run (Empty)', 'Logs'] as const;
type OutputTab = (typeof OUTPUT_TABS)[number];

function App() {
  const [activeSection, setActiveSection] = useState<SidebarItem>('Studio');
  const [activeTaskType, setActiveTaskType] = useState<TaskType>('Reasoning');
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>('Latest Run (Empty)');

  const renderRightPanelContent = () => {
    switch (activeOutputTab) {
      case 'Logs':
        return (
          <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
            No logs available yet. Run an optimization to see request/response logs here.
          </pre>
        );
      default:
        return (
          <p>
            Reasoning tasks benefit from structured thought processes. Techniques like Chain-of-Thought break down
            problems, while ReAct combines reasoning with action planning.
          </p>
        );
    }
  };

  const renderCenterContent = () => {
    if (activeSection !== 'Studio') {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          <div className="text-center space-y-2">
            <div className="text-base font-semibold text-slate-200">{activeSection}</div>
            <div className="text-xs text-slate-400">This section will be available in a future update.</div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Configuration & Context */}
        <div className="border border-gray-600 rounded-lg bg-gray-800/50 shadow-sm mb-5">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Configuration &amp; Context</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-300 tracking-wide mb-2">Input Prompt Editor</div>
              <div className="rounded-md border border-gray-700 bg-gray-900 overflow-hidden">
                <div className="h-7 bg-gray-800 border-b border-gray-700 flex items-center px-3 text-[11px] text-slate-400 font-mono">
                  1 &nbsp;|&nbsp; Insert your complex reasoning problem here...
                </div>
                <div className="h-28" />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-300 tracking-wide mb-2">
                Select Task Type for Recommendations
              </div>
              <div className="border border-gray-600 rounded-2xl bg-gray-900 px-1 py-1 inline-flex shadow-sm gap-1">
                {TASK_TYPES.map((label) => {
                  const selected = label === activeTaskType;
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveTaskType(label)}
                      className={
                        selected
                          ? 'px-3 py-1 text-xs rounded-full border border-blue-500 bg-blue-600/20 text-blue-200'
                          : 'px-3 py-1 text-xs rounded-full text-slate-300 hover:bg-gray-800'
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Strategy Selection */}
        <div className="mb-2 text-sm font-semibold text-slate-100">Optimization Strategy Selection</div>

        <div className="mb-3 flex gap-3 items-center">
          <div className="flex-1 flex items-center gap-2 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-slate-200">
            <span className="text-slate-500">▢</span>
            <input
              className="flex-1 bg-transparent outline-none placeholder:text-slate-500 text-xs text-slate-200"
              placeholder="Search techniques..."
            />
          </div>
          <div className="w-48 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Filter:</span>
            <select className="flex-1 rounded-md border border-gray-700 bg-gray-800 text-xs px-2 py-1 text-slate-200">
              <option>All Categories</option>
            </select>
          </div>
          <button className="text-[11px] px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-slate-200 hover:bg-gray-700">
            Clear Selection
          </button>
        </div>

        {/* Techniques table (static sample) */}
        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/40 text-xs">
          <table className="w-full border-collapse">
            <thead className="bg-gray-800 text-[11px] text-slate-400">
              <tr>
                <th className="font-semibold text-left px-4 py-2 border-b border-gray-700 w-1/2">Technique Name</th>
                <th className="font-semibold text-left px-4 py-2 border-b border-gray-700 w-20">Year</th>
                <th className="font-semibold text-left px-4 py-2 border-b border-gray-700">Best For</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-2.5 flex items-center gap-2 text-slate-100">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-500 bg-gray-700" />
                    <span className="truncate">Chain-of-Thought Prompting</span>
                    <span className="ml-2 inline-flex items-center rounded-sm bg-emerald-900/60 px-2 py-0.5 text-[10px] text-emerald-200">
                      Recommended for Reasoning
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">2027</td>
                  <td className="px-4 py-2.5 text-slate-400">Complex Logic</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button className="w-full rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-semibold py-2.5 text-white shadow">
            Initialize Optimization Run
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-studio-bg text-slate-100">
      {/* Top header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-studio-border bg-studio-sidebar">
        <div className="text-sm font-semibold tracking-tight text-slate-100">PE Studio</div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-studio-sidebar border-r border-studio-border flex flex-col">
          <div className="px-4 py-4 border-b border-studio-border flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-600 text-white text-xs font-bold">
              PE
            </span>
            <span>PE Studio</span>
          </div>

          <nav className="flex-1 py-3 text-[13px] font-medium text-slate-300">
            <div className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const selected = item === activeSection;
                return (
                  <button
                    key={item}
                    onClick={() => setActiveSection(item)}
                    className={
                      'w-full flex items-center gap-3 px-4 py-2 rounded-r-full transition ' +
                      (selected
                        ? 'bg-gray-700 text-slate-100 border-l-4 border-gray-400'
                        : 'hover:bg-gray-700/50 text-slate-300')
                    }
                  >
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="px-4 py-4 border-t border-studio-border text-[11px] text-slate-500 flex items-center justify-between">
            <span>API Status: Connected (v4.1)</span>
            <span>Latency: – ms</span>
          </div>
        </aside>

        {/* Center + right panels */}
        <main className="flex-1 flex overflow-hidden">
          {/* Center panel */}
          <section className="flex-1 bg-studio-panel px-6 py-5 overflow-y-auto border-r border-studio-border">
            {renderCenterContent()}
          </section>

          {/* Right panel */}
          <section className="w-[430px] bg-white text-slate-900 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex gap-4 text-xs text-slate-500">
                {OUTPUT_TABS.map((tab) => {
                  const selected = tab === activeOutputTab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveOutputTab(tab)}
                      className={
                        'pb-1 border-b-2 ' +
                        (selected
                          ? 'border-slate-500 text-slate-900 font-medium'
                          : 'border-transparent hover:border-slate-300')
                      }
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 px-6 py-4 text-xs leading-relaxed text-slate-700">
              {renderRightPanelContent()}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
