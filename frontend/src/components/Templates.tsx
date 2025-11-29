import { useState, useEffect } from 'react';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    prompt: string;
    tags: string[];
    createdAt: string;
}

const EXAMPLE_TEMPLATES: Template[] = [
    {
        id: 'customer-support-agent',
        name: 'Customer Support Agent',
        description: 'Professional customer service assistant with empathetic responses',
        category: 'Business',
        prompt: `You are a professional customer support agent. Your goal is to help customers resolve their issues efficiently and courteously.

Guidelines:
- Always greet the customer warmly
- Listen carefully to their concern
- Provide clear, step-by-step solutions
- Show empathy and patience
- End with asking if there's anything else you can help with

Respond to the customer's inquiry:`,
        tags: ['customer-service', 'support', 'business'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'code-reviewer',
        name: 'Code Review Assistant',
        description: 'Technical code reviewer providing constructive feedback',
        category: 'Development',
        prompt: `You are an experienced software engineer conducting a code review. Analyze the provided code and give constructive feedback.

Focus on:
- Code quality and readability
- Potential bugs or edge cases
- Performance considerations
- Best practices and design patterns
- Security vulnerabilities

Provide specific, actionable suggestions for improvement:`,
        tags: ['code', 'development', 'review'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'content-writer',
        name: 'Content Writer',
        description: 'Professional content creator for blogs and articles',
        category: 'Writing',
        prompt: `You are a professional content writer specializing in engaging, SEO-optimized articles.

Your writing should be:
- Clear and concise
- Well-structured with proper headings
- Engaging and informative
- Optimized for readability
- Factually accurate

Write content about the following topic:`,
        tags: ['writing', 'content', 'blog'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'data-analyst',
        name: 'Data Analysis Assistant',
        description: 'Analytical assistant for data interpretation and insights',
        category: 'Analytics',
        prompt: `You are a data analyst helping to interpret data and extract meaningful insights.

Your analysis should include:
- Key patterns and trends
- Statistical significance
- Actionable recommendations
- Clear visualizations suggestions
- Potential limitations

Analyze the following data:`,
        tags: ['data', 'analytics', 'insights'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'translator',
        name: 'Professional Translator',
        description: 'Accurate translation maintaining context and tone',
        category: 'Language',
        prompt: `You are a professional translator with expertise in multiple languages.

Translation guidelines:
- Maintain the original meaning and context
- Preserve the tone and style
- Use culturally appropriate expressions
- Ensure grammatical accuracy
- Note any untranslatable idioms

Translate the following text to [TARGET_LANGUAGE]:`,
        tags: ['translation', 'language', 'localization'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'brainstorm-facilitator',
        name: 'Brainstorming Facilitator',
        description: 'Creative ideation and problem-solving assistant',
        category: 'Creative',
        prompt: `You are a creative brainstorming facilitator helping generate innovative ideas.

Your approach:
- Think outside the box
- Build on existing ideas
- Consider multiple perspectives
- Combine concepts creatively
- Evaluate feasibility

Let's brainstorm ideas for:`,
        tags: ['creative', 'brainstorming', 'innovation'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'email-composer',
        name: 'Professional Email Writer',
        description: 'Business email composition with proper etiquette',
        category: 'Business',
        prompt: `You are a professional email writer crafting clear, courteous business communications.

Email structure:
- Appropriate greeting
- Clear subject line suggestion
- Concise, well-organized body
- Professional tone
- Proper closing

Compose an email for the following purpose:`,
        tags: ['email', 'business', 'communication'],
        createdAt: '2024-01-01T00:00:00'
    },
    {
        id: 'tutor',
        name: 'Educational Tutor',
        description: 'Patient teacher explaining complex concepts simply',
        category: 'Education',
        prompt: `You are an experienced tutor who excels at explaining complex topics in simple terms.

Teaching approach:
- Break down concepts step-by-step
- Use analogies and examples
- Check for understanding
- Encourage questions
- Provide practice exercises

Explain the following concept:`,
        tags: ['education', 'teaching', 'learning'],
        createdAt: '2024-01-01T00:00:00'
    }
];

export function Templates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [activeTab, setActiveTab] = useState<'my-templates' | 'examples' | 'create'>('examples');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Create form state
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateDescription, setNewTemplateDescription] = useState('');
    const [newTemplatePrompt, setNewTemplatePrompt] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('Custom');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const saved = localStorage.getItem('prompt-templates');
        if (saved) {
            try {
                setTemplates(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading templates:', e);
            }
        }
    };

    const saveTemplates = (newTemplates: Template[]) => {
        localStorage.setItem('prompt-templates', JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    };

    const handleCreateTemplate = () => {
        if (!newTemplateName.trim() || !newTemplatePrompt.trim()) {
            alert('Please enter template name and prompt');
            return;
        }

        const newTemplate: Template = {
            id: `custom-${Date.now()}`,
            name: newTemplateName,
            description: newTemplateDescription,
            category: newTemplateCategory,
            prompt: newTemplatePrompt,
            tags: [],
            createdAt: new Date().toISOString()
        };

        const updated = [...templates, newTemplate];
        saveTemplates(updated);

        // Reset form
        setNewTemplateName('');
        setNewTemplateDescription('');
        setNewTemplatePrompt('');
        setNewTemplateCategory('Custom');
        setShowCreateForm(false);
        setActiveTab('my-templates');
    };

    const handleDeleteTemplate = (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        const updated = templates.filter(t => t.id !== templateId);
        saveTemplates(updated);

        if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null);
        }
    };

    const handleImportExample = (example: Template) => {
        const imported: Template = {
            ...example,
            id: `imported-${Date.now()}`,
            name: `${example.name} (Copy)`,
            createdAt: new Date().toISOString()
        };

        const updated = [...templates, imported];
        saveTemplates(updated);
        setActiveTab('my-templates');
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const categories = ['Business', 'Development', 'Writing', 'Analytics', 'Language', 'Creative', 'Education', 'Custom'];

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-100 mb-3">Prompt Templates</h2>
                <p className="text-lg text-slate-300 mb-5">
                    Browse, create, and manage reusable prompt templates for common tasks.
                </p>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('examples')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'examples'
                                ? 'text-white border-b-2 border-purple-500'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Example Templates ({EXAMPLE_TEMPLATES.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('my-templates')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'my-templates'
                                ? 'text-white border-b-2 border-purple-500'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        My Templates ({templates.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('create');
                            setShowCreateForm(true);
                        }}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'create'
                                ? 'text-white border-b-2 border-purple-500'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Create New
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Example Templates Tab */}
                {activeTab === 'examples' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {EXAMPLE_TEMPLATES.map((template) => (
                            <div
                                key={template.id}
                                className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-slate-100">{template.name}</h3>
                                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                                        {template.category}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedTemplate(template)}
                                        className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
                                    >
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => handleImportExample(template)}
                                        className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-900/70 text-purple-300 text-sm rounded"
                                    >
                                        Import
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My Templates Tab */}
                {activeTab === 'my-templates' && (
                    <div className="space-y-4">
                        {templates.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                                <p className="text-slate-400 mb-4">No templates yet. Create or import one!</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => {
                                            setActiveTab('create');
                                            setShowCreateForm(true);
                                        }}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium"
                                    >
                                        Create Template
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('examples')}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
                                    >
                                        Browse Examples
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-semibold text-slate-100">{template.name}</h3>
                                            <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                                                {template.category}
                                            </span>
                                        </div>
                                        {template.description && (
                                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedTemplate(template)}
                                                className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleCopyToClipboard(template.prompt)}
                                                className="px-3 py-1.5 bg-green-900/50 hover:bg-green-900/70 text-green-300 text-sm rounded"
                                            >
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 text-red-300 text-sm rounded"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Create Tab */}
                {activeTab === 'create' && showCreateForm && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-semibold text-slate-100 mb-4">Create New Template</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Template Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., Email Response Template"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={newTemplateCategory}
                                        onChange={(e) => setNewTemplateCategory(e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newTemplateDescription}
                                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Brief description of this template..."
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Prompt Template *
                                    </label>
                                    <textarea
                                        value={newTemplatePrompt}
                                        onChange={(e) => setNewTemplatePrompt(e.target.value)}
                                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Enter your prompt template here..."
                                        rows={12}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Tip: Use placeholders like [TOPIC] or [LANGUAGE] for variable parts
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleCreateTemplate}
                                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium"
                                    >
                                        Create Template
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setActiveTab('my-templates');
                                        }}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Template Preview Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-100">{selectedTemplate.name}</h3>
                                    {selectedTemplate.description && (
                                        <p className="text-sm text-slate-400 mt-1">{selectedTemplate.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                                            {selectedTemplate.category}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs text-slate-400">Prompt Template:</div>
                                    <button
                                        onClick={() => handleCopyToClipboard(selectedTemplate.prompt)}
                                        className="text-xs text-green-400 hover:text-green-300"
                                    >
                                        Copy to Clipboard
                                    </button>
                                </div>
                                <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono">
                                    {selectedTemplate.prompt}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
