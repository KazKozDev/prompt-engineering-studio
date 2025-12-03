import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Map article titles to documentation file paths
const articleDocs: Record<string, string> = {
  // Create
  'Generator': '/docs/getting-started/01-generator.md',
  'DSPy': '/docs/getting-started/02-dspy.md',
  // Test
  'Datasets': '/docs/getting-started/03-datasets.md',
  'Evaluation': '/docs/getting-started/04-evaluation.md',
  // Deploy
  'Library': '/docs/getting-started/05-library.md',
  'Metrics': '/docs/getting-started/06-metrics.md',
  'History': '/docs/getting-started/07-history.md',
  // Configuration
  'Settings': '/docs/getting-started/08-settings.md',
  'Help': '/docs/getting-started/09-help.md',
  'DSPy Guide': '/docs/getting-started/10-dspy-guide.md',
};

// Article descriptions
const articleDescriptions: Record<string, string> = {
  'Generator': 'Create prompts from task descriptions',
  'DSPy': 'Automated prompt optimization with DSPy',
  'Datasets': 'Manage test data for evaluation',
  'Evaluation': 'Test prompt quality and consistency',
  'Library': 'Store and version your prompts',
  'Metrics': 'Track performance over time',
  'History': 'View past runs and results',
  'Settings': 'Configure API keys and preferences',
  'Help': 'Documentation and guides',
  'DSPy Guide': 'Complete guide to DSPy framework',
};

const categories = [
  {
    title: 'Create',
    description: 'Generate and optimize prompts',
    number: '1',
    articles: ['Generator', 'DSPy'],
  },
  {
    title: 'Test',
    description: 'Evaluate prompt quality',
    number: '2',
    articles: ['Datasets', 'Evaluation'],
  },
  {
    title: 'Deploy',
    description: 'Manage and monitor prompts',
    number: '3',
    articles: ['Library', 'Metrics', 'History'],
  },
  {
    title: 'Configuration',
    description: 'Settings and help',
    number: '4',
    articles: ['Settings'],
  },
  {
    title: 'Resources',
    description: 'Deep dive guides',
    number: '5',
    articles: ['DSPy Guide'],
  },
];

// Flatten articles for next/prev navigation
const allArticles = categories.flatMap(c => c.articles);


export function Help() {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
      setArticleContent(`# ${article}\n\n**Documentation coming soon...**\n\nThis article is currently being written. Check back later for detailed information.`);
      return;
    }

    setIsLoading(true);
    setSelectedArticle(article);

    try {
      // Add timestamp to prevent caching
      const response = await fetch(`${docPath}?v=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Failed to load article');
      const content = await response.text();
      setArticleContent(content);
    } catch (error) {
      console.error('Error loading article:', error);
      setArticleContent(`# ${article}\n\n**Error loading article**\n\nCould not load the documentation file. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedArticle(null);
    setArticleContent('');
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
  const resourcesCategory = categories.find(c => c.title === 'Resources');

  return (
    <div className="h-full flex gap-6 p-6">
      {/* Left column - Navigation */}
      <div className="w-72 shrink-0 flex flex-col gap-4 hidden xl:flex">
        <div>
          <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">HELP</h2>
          <p className="text-xs text-white/40 mb-4 mt-1">Documentation and guides for the application</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-4 text-sm text-white/80 backdrop-blur-sm">
          <div className="text-sm font-bold text-white tracking-wide flex items-baseline gap-1.5">
            <span>Prompt Engineering Studio</span>
            <span className="text-[11px] font-normal text-white/40 tracking-wide">v2.0</span>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="space-y-2 text-[13px]">
            <div>Copyright (c) 2025<br />Artem Kazakov Kozlov</div>
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
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white/90 mb-1">
              {selectedArticle || 'Documentation'}
            </h2>
            <p className="text-xs text-white/45 mt-1">
              {selectedArticle
                ? categories.find(c => c.articles.includes(selectedArticle))?.description
                : 'Learn how to use Prompt Engineering Studio'}
            </p>
          </div>
          {selectedArticle && (
            <div className="flex items-center gap-2">
              {prevArticle && (
                <button
                  onClick={() => navigateArticle('prev')}
                  className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
                  title={`Previous: ${prevArticle} `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {nextArticle && (
                <button
                  onClick={() => navigateArticle('next')}
                  className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
                  title={`Next: ${nextArticle} `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleBack}
                className="p-2 rounded-lg text-white/50 hover:text-white transition-colors"
                title="Close article"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedArticle ? (
            <div className="p-6">
              <div className="max-w-5xl">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-white/60 rounded-full animate-spin"></div>
                    </div>
                    <span className="text-sm text-white/50 font-medium animate-pulse">Loading article...</span>
                  </div>
                ) : (
                  <article className="prose prose-invert max-w-3xl mb-32">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs mb-6">
                      <button
                        onClick={handleBack}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        Documentation
                      </button>
                      <svg className="w-2.5 h-2.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-white/40">
                        {categories.find(c => c.articles.includes(selectedArticle))?.title}
                      </span>
                      <svg className="w-2.5 h-2.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-white/60">{selectedArticle}</span>
                    </div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: () => null,
                        h2: ({ node, children, ...props }) => {
                          const id = String(children).toLowerCase().replace(/[^\w]+/g, '-');
                          return <h2 id={id} className="text-lg font-semibold text-white mt-10 mb-4 scroll-mt-20 first:mt-0" {...props}>{children}</h2>;
                        },
                        h3: ({ node, children, ...props }) => {
                          const id = String(children).toLowerCase().replace(/[^\w]+/g, '-');
                          return <h3 id={id} className="text-sm font-semibold text-white/90 mt-6 mb-2 scroll-mt-20" {...props}>{children}</h3>;
                        },
                        p: ({ node, ...props }) => <p className="text-sm text-white/50 leading-relaxed mb-4" {...props} />,
                        ul: ({ node, ...props }) => <ul className="space-y-2 mb-4" {...props} />,
                        ol: ({ node, ...props }) => <ol className="space-y-2 mb-4 list-decimal list-inside marker:text-white/40" {...props} />,
                        li: ({ node, children, ...props }) => (
                          <li className="text-sm text-white/50 leading-relaxed flex gap-2" {...props}>
                            <span className="text-white/30 mt-1.5">•</span>
                            <span>{children}</span>
                          </li>
                        ),
                        a: ({ node, href, children, ...props }) => {
                          const text = typeof children?.[0] === 'string' ? children[0] : String(children);
                          const isNumericRef = /^\d+$/.test(text.trim());

                          if (isNumericRef) {
                            return (
                              <sup>
                                <a
                                  href={href}
                                  className="text-white/40 hover:text-white/70 text-[10px] no-underline align-super"
                                  target="_blank"
                                  rel="noreferrer"
                                  {...props}
                                >
                                  {text}
                                </a>
                              </sup>
                            );
                          }

                          return (
                            <a
                              href={href}
                              className="text-white/60 hover:text-white underline underline-offset-2"
                              target="_blank"
                              rel="noreferrer"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                        blockquote: ({ children }: any) => (
                          <div className="border-l-2 border-white/20 pl-4 my-4 text-sm text-white/40 italic">{children}</div>
                        ),
                        code: ({ inline, children }: any) => {
                          return !inline ? (
                            <div className="my-4 rounded bg-white/5 border border-white/10">
                              <pre className="p-3 overflow-x-auto">
                                <code className="font-mono text-xs text-white/60">{children}</code>
                              </pre>
                            </div>
                          ) : (
                            <code className="bg-white/10 text-white/70 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                          );
                        },
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-black/30">
                            <table className="w-full text-left text-sm border-collapse" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="bg-white/10 border-b border-white/15 px-4 py-3 text-[11px] font-semibold text-white/70 uppercase tracking-wide align-top text-left"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="border-b border-white/5 px-4 py-3 text-sm text-white/60 align-top text-left"
                            {...props}
                          />
                        ),
                        hr: () => <hr className="border-white/10 my-8" />,
                        strong: ({ node, ...props }) => <strong className="text-white/70 font-medium" {...props} />,
                      }}
                    >
                      {articleContent}
                    </ReactMarkdown>

                  </article>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categories
                  .filter(cat => cat.title !== 'Resources')
                  .map((cat) => (
                  <div
                    key={cat.title}
                    className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 text-white/90 flex items-center justify-center text-2xl font-bold">
                        {cat.number}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{cat.title}</h3>
                        <p className="text-[11px] text-white/40">{cat.description}</p>
                      </div>
                    </div>

                    {/* Articles Grid */}
                    <div className="space-y-2">
                      {cat.articles.map((article) => (
                        <button
                          key={article}
                          onClick={() => handleArticleClick(article)}
                          className="w-full group flex items-center gap-3 py-2 px-3 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-200"
                        >
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                              {article}
                            </div>
                            <div className="text-[11px] text-white/30 group-hover:text-white/50 transition-colors">
                              {articleDescriptions[article]}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Right: Summary / Table of Contents */}
      <div className="w-[320px] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col shrink-0 overflow-hidden hidden xl:flex">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-sm font-semibold text-white/80">
              {selectedArticle ? 'On This Page' : 'Quick Links'}
            </h2>
            <p className="text-[10px] text-white/40">
              {selectedArticle ? 'Jump to section' : 'Deep dive guides'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {selectedArticle && !isLoading && toc.length > 0 ? (
            /* Table of Contents for selected article */
            <div className="space-y-1">
              {toc.map((item, i) => (
                <a
                  key={i}
                  href={`#${item.id}`}
                  className={`block px-3 py-1.5 text-[13px] rounded-lg transition-colors hover:bg-white/5 hover:text-white ${
                    item.level === 3 ? 'ml-3 text-white/40' : 'text-white/60'
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
          ) : selectedArticle && isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"></div>
            </div>
          ) : (
            /* Resources section in quick links when no article selected */
            resourcesCategory && (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
                  {resourcesCategory.title}
                </div>
                <div className="space-y-2">
                  {resourcesCategory.articles.map((article) => (
                    <button
                      key={article}
                      onClick={() => handleArticleClick(article)}
                      className="w-full text-left py-2 px-3 rounded-lg bg-black/40 border border-white/5 hover:bg-black/60 hover:border-white/20 transition-colors"
                    >
                      <div className="text-xs font-medium text-white/80">
                        {article}
                      </div>
                      {articleDescriptions[article] && (
                        <div className="text-[11px] text-white/40 mt-0.5">
                          {articleDescriptions[article]}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
