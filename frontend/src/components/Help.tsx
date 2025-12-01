import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Map article titles to documentation file paths
const articleDocs: Record<string, string> = {
  'CREATE: Generator — Transform tasks into optimized prompts': '/docs/getting-started/01-generator.md',
  'CREATE: Optimizer — Iteratively improve prompt performance': '/docs/getting-started/02-optimizer.md',
  'TEST: Datasets — Upload and manage evaluation data': '/docs/getting-started/03-datasets.md',
  'TEST: Evaluation — Run quality benchmarks and robustness tests': '/docs/getting-started/04-evaluation.md',
  'DEPLOY: Library — Save, version, and organize prompts': '/docs/getting-started/05-library.md',
  'DEPLOY: Metrics — Monitor production performance': '/docs/getting-started/06-metrics.md',
  'DEPLOY: History — Track all prompt changes over time': '/docs/getting-started/07-history.md',
  'Settings — Configure LLM providers and workspace': '/docs/getting-started/08-settings.md',
  'Help — Search documentation and guides': '/docs/getting-started/09-help.md',
};

const categories = [
  {
    title: 'Getting Started',
    articles: [
      'CREATE: Generator — Transform tasks into optimized prompts',
      'CREATE: Optimizer — Iteratively improve prompt performance',
      'TEST: Datasets — Upload and manage evaluation data',
      'TEST: Evaluation — Run quality benchmarks and robustness tests',
      'DEPLOY: Library — Save, version, and organize prompts',
      'DEPLOY: Metrics — Monitor production performance',
      'DEPLOY: History — Track all prompt changes over time',
      'Settings — Configure LLM providers and workspace',
      'Help — Search documentation and guides',
    ],
  },
  {
    title: 'Evaluation & Benchmarks',
    articles: [
      'Configuring metrics in Evaluation Lab',
      'Running Unified Report end-to-end',
      'Label-free eval: self-consistency and mutual scoring',
      'Robustness tests: format, length, adversarial',
    ],
  },
  {
    title: 'Prompt Engineering',
    articles: [
      'Techniques guide: CoT, Few-Shot, ReAct',
      'Guardrails and safety patterns',
      'Reducing hallucinations with structure',
      'Designing evaluation datasets',
    ],
  },
];

// Flatten articles for next/prev navigation
const allArticles = categories.flatMap(c => c.articles);

// Helper to get short title for sidebar
const getShortTitle = (title: string) => {
  return title
    .replace(/^(CREATE|TEST|DEPLOY): /, '') // Remove prefixes
    .split('—')[0] // Remove description after em-dash
    .split(':')[0] // Remove description after colon
    .trim();
};

export function Help() {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Extract Table of Contents
  const toc = useMemo(() => {
    if (!articleContent) return [];
    const lines = articleContent.split('\n');
    const headers = [];
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        headers.push({
          level: match[1].length,
          text: match[2],
          id: match[2].toLowerCase().replace(/[^\w]+/g, '-')
        });
      }
    }
    return headers;
  }, [articleContent]);

  const handleArticleClick = async (article: string) => {
    const docPath = articleDocs[article];

    if (!docPath) {
      setSelectedArticle(article);
      setArticleContent(`# ${article}\n\n📝 **Documentation coming soon...**\n\nThis article is currently being written. Check back later for detailed information.`);
      return;
    }

    setIsLoading(true);
    setSelectedArticle(article);

    try {
      const response = await fetch(docPath);
      if (!response.ok) throw new Error('Failed to load article');
      const content = await response.text();
      setArticleContent(content);
    } catch (error) {
      console.error('Error loading article:', error);
      setArticleContent(`# ${article}\n\n⚠️ **Error loading article**\n\nCould not load the documentation file. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedArticle(null);
    setArticleContent('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navigateArticle = (direction: 'next' | 'prev') => {
    if (!selectedArticle) return;
    const currentIndex = allArticles.indexOf(selectedArticle);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < allArticles.length) {
      handleArticleClick(allArticles[newIndex]);
    }
  };

  const currentIndex = selectedArticle ? allArticles.indexOf(selectedArticle) : -1;
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  return (
    <div className="h-full flex gap-6 p-6 overflow-hidden">
      {/* Left column - Navigation */}
      <div className="w-72 shrink-0 flex flex-col gap-4 hidden xl:flex">
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-4 text-sm text-white/80 backdrop-blur-sm">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white tracking-wide">Prompt Engineering Studio</div>
            <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Documentation v2.0</div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="space-y-2 text-[13px]">
            <div>Copyright (c) 2025 Artem Kazakov</div>
            <div className="text-white/50">Licensed under MIT License</div>
          </div>

          <div className="space-y-1 pt-2">
            <a className="flex items-center gap-2 text-[#7cb5ff] hover:text-white transition-colors group" href="mailto:KazKozDev@gmail.com">
              <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>Email</span>
            </a>
            <a className="flex items-center gap-2 text-[#7cb5ff] hover:text-white transition-colors group" href="https://github.com/KazKozDev">
              <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm relative">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-4 shrink-0">
          {selectedArticle ? (
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Home</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}

          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/40 transition-all"
              placeholder="Search documentation (e.g., 'optimizer', 'datasets')..."
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-sans text-white/40">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex">
          {selectedArticle ? (
            <>
              <div className="flex-1 max-w-5xl p-6 pb-32">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-10">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-[#007AFF] rounded-full animate-spin"></div>
                      </div>
                      <span className="text-sm text-white/50 font-medium animate-pulse">Loading article...</span>
                    </div>
                  ) : (
                    <article className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <div className="mb-12 pb-6 border-b border-white/10">
                              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-4" {...props} />
                            </div>
                          ),
                          h2: ({ node, children, ...props }) => {
                            const id = String(children).toLowerCase().replace(/[^\w]+/g, '-');
                            return <h2 id={id} className="text-2xl font-semibold text-white mt-12 mb-6 flex items-center gap-2 scroll-mt-20" {...props}>{children}</h2>;
                          },
                          h3: ({ node, children, ...props }) => {
                            const id = String(children).toLowerCase().replace(/[^\w]+/g, '-');
                            return <h3 id={id} className="text-xl font-medium text-white/90 mt-8 mb-4 scroll-mt-20" {...props}>{children}</h3>;
                          },
                          p: ({ node, ...props }) => <p className="text-sm text-white/70 leading-7 mb-6 font-light tracking-wide" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-none ml-0 mb-6 space-y-3" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 text-white/70 mb-6 space-y-3 marker:text-[#007AFF] marker:font-semibold" {...props} />,
                          li: ({ node, children, ...props }) => (
                            <li className="pl-2 relative flex gap-3 text-sm text-white/70" {...props}>
                              <span className="text-[#007AFF] mt-2 w-1.5 h-1.5 rounded-full bg-[#007AFF] shrink-0 block" />
                              <span className="flex-1">{children}</span>
                            </li>
                          ),
                          a: ({ node, ...props }) => <a className="text-[#5FA5F9] hover:text-white transition-colors underline decoration-[#5FA5F9]/30 hover:decoration-white/50 underline-offset-4" {...props} />,
                          blockquote: ({ node, children, ...props }: any) => {
                            // Check for admonitions
                            const content = children?.[1]?.props?.children?.[0] || '';
                            let type = 'info';
                            let title = 'Note';

                            if (typeof content === 'string') {
                              if (content.startsWith('Warning') || content.startsWith('❌')) { type = 'warning'; title = 'Warning'; }
                              else if (content.startsWith('Tip') || content.startsWith('✅')) { type = 'success'; title = 'Tip'; }
                            }

                            const styles = {
                              info: 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF]',
                              warning: 'border-amber-500 bg-amber-500/5 text-amber-500',
                              success: 'border-emerald-500 bg-emerald-500/5 text-emerald-500'
                            };

                            return (
                              <div className={`border-l-4 ${styles[type as keyof typeof styles]} pl-5 py-4 my-8 rounded-r-xl bg-gradient-to-r from-white/[0.02] to-transparent`}>
                                <div className="font-semibold mb-1 opacity-90">{title}</div>
                                <div className="text-white/70 italic">{children}</div>
                              </div>
                            );
                          },
                          code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeText = String(children).replace(/\n$/, '');

                            return !inline ? (
                              <div className="relative group my-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d1117]">
                                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                  <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
                                    {match ? match[1] : 'code'}
                                  </div>
                                  <button
                                    onClick={() => handleCopyCode(codeText)}
                                    className="text-white/40 hover:text-white transition-colors"
                                    title="Copy code"
                                  >
                                    {copiedCode === codeText ? (
                                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-5 overflow-x-auto">
                                  <code className={`font-mono text-sm text-white/80 leading-relaxed ${className}`} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code className="bg-white/10 text-white/90 px-1.5 py-0.5 rounded font-mono text-[13px] border border-white/5" {...props}>
                                {children}
                              </code>
                            );
                          },
                          table: ({ node, ...props }) => <div className="overflow-x-auto my-10 border border-white/10 rounded-xl shadow-lg"><table className="w-full text-left border-collapse bg-white/[0.02]" {...props} /></div>,
                          th: ({ node, ...props }) => <th className="bg-white/5 border-b border-white/10 p-4 text-xs font-bold text-white uppercase tracking-wider" {...props} />,
                          td: ({ node, ...props }) => <td className="border-b border-white/5 p-4 text-sm text-white/70" {...props} />,
                          hr: ({ node, ...props }) => <hr className="border-white/10 my-12" {...props} />,
                        }}
                      >
                        {articleContent}
                      </ReactMarkdown>

                      {/* Article Footer Navigation */}
                      <div className="mt-20 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                        {prevArticle ? (
                          <button
                            onClick={() => navigateArticle('prev')}
                            className="group text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all"
                          >
                            <div className="text-[11px] text-white/40 uppercase tracking-wider mb-1 group-hover:text-[#007AFF] transition-colors">Previous</div>
                            <div className="text-sm font-medium text-white/80 group-hover:text-white truncate">{getShortTitle(prevArticle)}</div>
                          </button>
                        ) : <div />}

                        {nextArticle ? (
                          <button
                            onClick={() => navigateArticle('next')}
                            className="group text-right p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all"
                          >
                            <div className="text-[11px] text-white/40 uppercase tracking-wider mb-1 group-hover:text-[#007AFF] transition-colors">Next</div>
                            <div className="text-sm font-medium text-white/80 group-hover:text-white truncate">{getShortTitle(nextArticle)}</div>
                          </button>
                        ) : <div />}
                      </div>
                    </article>
                  )}
                </div>
              </div>

              {/* Right Column - Table of Contents */}
              {!isLoading && toc.length > 0 && (
                <div className="w-64 shrink-0 hidden 2xl:block p-8">
                  <div className="sticky top-8">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">On this page</h4>
                    <div className="space-y-1 border-l border-white/10">
                      {toc.map((item, i) => (
                        <a
                          key={i}
                          href={`#${item.id}`}
                          className={`block py-1 pl-4 text-[13px] border-l -ml-px transition-colors hover:text-white hover:border-white/40 ${item.level === 3 ? 'ml-2 text-white/40' : 'text-white/60 border-transparent'
                            }`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {item.text}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {categories.map((cat) => (
                <div key={cat.title} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3 hover:border-[#007AFF]/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{cat.title}</h3>
                      <p className="text-[12px] text-white/40">Curated articles in this area</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.articles.map((article) => (
                      <button
                        key={article}
                        onClick={() => handleArticleClick(article)}
                        className="text-left bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white/80 hover:border-[#007AFF]/20 hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span className="pr-2 truncate">{article}</span>
                        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
