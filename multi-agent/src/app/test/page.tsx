'use client';

import { useState, useEffect } from 'react';

interface TestResult {
    success: boolean;
    provider?: string;
    model?: string;
    response?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cost?: number;
    executionTime?: number;
    timestamp?: string;
    error?: string;
    details?: string;
}

interface ApiKeys {
    openai: string;
    anthropic: string;
    google: string;
}

export default function TestPage() {
    const [activeTab, setActiveTab] = useState<'llm' | 'workflow'>('llm');

    // API Keys
    const [apiKeys, setApiKeys] = useState<ApiKeys>({
        openai: '',
        anthropic: '',
        google: ''
    });

    // Persist API keys in localStorage (WARNING: not secure for production)
    useEffect(() => {
        // On mount, load from localStorage
        const stored = localStorage.getItem('multiagent-api-keys');
        if (stored) {
            try {
                setApiKeys(JSON.parse(stored));
            } catch { }
        }
    }, []);
    useEffect(() => {
        // On change, save to localStorage
        localStorage.setItem('multiagent-api-keys', JSON.stringify(apiKeys));
    }, [apiKeys]);

    // LLM Test State
    const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
    const [model, setModel] = useState('gpt-4o-mini');
    const [prompt, setPrompt] = useState('Write a short poem about artificial intelligence.');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1000);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);

    // Workflow Test State
    const [workflowPrompt, setWorkflowPrompt] = useState('Artificial intelligence is transforming the world in many ways.');
    const [workflowLoading, setWorkflowLoading] = useState(false);
    const [workflowResult, setWorkflowResult] = useState<any>(null);
    const [debugMode, setDebugMode] = useState(true); // Debug on by default

    const models = {
        openai: ['gpt-4o-mini', 'gpt-4.1', 'o3', 'gpt-4o', 'gpt-4o-2024-05-13', 'o4-mini', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'],
        google: ['gemini-pro', 'gemini-pro-vision'] // Placeholder - not implemented yet
    };

    const handleApiKeyChange = (provider: keyof ApiKeys, value: string) => {
        setApiKeys(prev => ({ ...prev, [provider]: value }));
    };

    const getRequiredApiKey = () => {
        return apiKeys[provider];
    };

    const canExecuteTest = () => {
        return getRequiredApiKey() && prompt.trim();
    };

    const handleTest = async () => {
        if (!canExecuteTest()) {
            alert(`Please provide ${provider.toUpperCase()} API key and prompt`);
            return;
        }

        if (provider === 'google') {
            alert('Google Gemini provider not yet implemented');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/llm/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    apiKey: getRequiredApiKey(),
                    model,
                    prompt,
                    temperature,
                    maxTokens,
                    systemPrompt: systemPrompt || undefined,
                }),
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: 'Network error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleWorkflowTest = async () => {
        if (!apiKeys.openai || !workflowPrompt) {
            alert('Please provide OpenAI API key and prompt');
            return;
        }

        setWorkflowLoading(true);
        setWorkflowResult(null);

        try {
            // We'll use OpenAI for all nodes for now, but you can swap provider/model as needed
            const workflow = {
                id: 'test-workflow',
                name: 'Refinement Chain Workflow',
                description: 'A workflow that chains LLMs for iterative refinement',
                nodes: [
                    {
                        id: 'input-1',
                        type: 'input',
                        position: { x: 0, y: 0 },
                        data: { label: 'Input' }
                    },
                    {
                        id: 'llm-1',
                        type: 'llm',
                        position: { x: 200, y: 0 },
                        data: {
                            label: 'Step 1',
                            provider: 'openai',
                            model: 'gpt-4o-mini',
                            prompt: '{input}', // Pass original prompt P1
                            config: {
                                temperature: 0.7,
                                maxTokens: 300
                            }
                        }
                    },
                    {
                        id: 'llm-2',
                        type: 'llm',
                        position: { x: 400, y: 0 },
                        data: {
                            label: 'Step 2',
                            provider: 'openai',
                            model: 'gpt-4o-mini',
                            prompt: '{llm-1}',
                            config: {
                                temperature: 0.7,
                                maxTokens: 400
                            }
                        }
                    },
                    {
                        id: 'llm-3',
                        type: 'llm',
                        position: { x: 600, y: 0 },
                        data: {
                            label: 'Step 3',
                            provider: 'openai',
                            model: 'gpt-4o-mini',
                            prompt: '{llm-2}',
                            config: {
                                temperature: 0.7,
                                maxTokens: 1200
                            }
                        }
                    },
                    {
                        id: 'output-1',
                        type: 'output',
                        position: { x: 800, y: 0 },
                        data: { label: 'Output' }
                    }
                ],
                edges: [
                    { id: 'e1', source: 'input-1', target: 'llm-1' },
                    { id: 'e2', source: 'llm-1', target: 'llm-2' },
                    { id: 'e3', source: 'llm-2', target: 'llm-3' },
                    { id: 'e4', source: 'llm-3', target: 'output-1' }
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'test-user',
                isTemplate: false,
                isPublic: false
            };

            // Custom chaining logic for prompt variables
            // We'll do this client-side for now, but ideally this is backend logic
            // We'll run each node step-by-step, extracting edits/reasoning for node 3
            // For now, just send the workflow and inputPrompt as before

            const response = await fetch('/api/workflow/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workflow,
                    inputPrompt: workflowPrompt,
                    providerConfigs: {
                        openai: { apiKey: apiKeys.openai }
                    }
                }),
            });

            const data = await response.json();
            // Post-process nodeDebug for node 3 prompt variable substitution
            if (data?.execution?.nodeDebug && data.execution.nodeDebug.length >= 3) {
                const nodeDebug = data.execution.nodeDebug;
                // Extract <B_Edits> and <B_Reasoning> from node 2 output
                let llm2_edits = '';
                let llm2_reasoning = '';
                const llm2Output = nodeDebug[1]?.output || '';
                const editsMatch = llm2Output.match(/<B_Edits>([\s\S]*?)<\/B_Edits>/);
                if (editsMatch) llm2_edits = editsMatch[1].trim();
                const reasoningMatch = llm2Output.match(/<B_Reasoning>([\s\S]*?)<\/B_Reasoning>/);
                if (reasoningMatch) llm2_reasoning = reasoningMatch[1].trim();
                // Attach these to nodeDebug for display/debugging
                data.execution.nodeDebug[2].llm2_edits = llm2_edits;
                data.execution.nodeDebug[2].llm2_reasoning = llm2_reasoning;
            }
            setWorkflowResult(data);
        } catch (error) {
            setWorkflowResult({
                success: false,
                error: 'Network error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setWorkflowLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
            <div className="w-full max-w-6xl px-4 py-12 mx-auto flex flex-col items-center gap-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-slate-800 text-purple-300 border border-purple-700 mb-4">🧪 AI Testing Lab</span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Multi-Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">Testing Interface</span></h1>
                    <p className="text-lg text-slate-200 max-w-2xl mx-auto">Test individual LLM providers and multi-step workflows in a clean, modern interface.</p>
                </div>
                {/* API Configuration */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow w-full mb-4">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">API Configuration</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-300">OpenAI API Key</label>
                            <input type="password" value={apiKeys.openai} onChange={(e) => handleApiKeyChange('openai', e.target.value)} placeholder="sk-..." className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-purple-400 text-white placeholder-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-300">Anthropic API Key</label>
                            <input type="password" value={apiKeys.anthropic} onChange={(e) => handleApiKeyChange('anthropic', e.target.value)} placeholder="sk-ant-..." className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-purple-400 text-white placeholder-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-300">Google API Key</label>
                            <input type="password" value={apiKeys.google} onChange={(e) => handleApiKeyChange('google', e.target.value)} placeholder="Coming soon..." disabled className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-500 placeholder-slate-500 cursor-not-allowed" />
                        </div>
                    </div>
                </div>
                {/* Tab Navigation */}
                <div className="flex justify-center mb-4 w-full">
                    <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 flex w-full max-w-lg">
                        <button onClick={() => setActiveTab('llm')} className={`flex-1 px-6 py-2 rounded-lg font-semibold text-base transition-all duration-200 ${activeTab === 'llm' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>Single LLM Test</button>
                        <button onClick={() => setActiveTab('workflow')} className={`flex-1 px-6 py-2 rounded-lg font-semibold text-base transition-all duration-200 ${activeTab === 'workflow' ? 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>Workflow Test</button>
                    </div>
                </div>
                {/* LLM Testing Tab */}
                {activeTab === 'llm' && (
                    <div className="grid md:grid-cols-2 gap-8 w-full">
                        {/* Configuration Panel */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-white mb-2">Configuration</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-300">Provider</label>
                                    <select value={provider} onChange={(e) => { const newProvider = e.target.value as 'openai' | 'anthropic' | 'google'; setProvider(newProvider); setModel(models[newProvider][0]); }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="google" disabled>Google (Coming Soon)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-300">Model</label>
                                    <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white">
                                        {models[provider].map(m => (<option key={m} value={m}>{m}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-300">System Prompt (Optional)</label>
                                <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="Enter system prompt..." rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-300">Prompt</label>
                                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt..." rows={3} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-300">Temperature</label>
                                    <input type="number" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-300">Max Tokens</label>
                                    <input type="number" min="1" max="4000" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white" />
                                </div>
                            </div>
                            <button onClick={handleTest} disabled={loading || !canExecuteTest()} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold text-base transition hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2">{loading ? 'Testing...' : 'Test LLM'}</button>
                        </div>
                        {/* Results Panel */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-white mb-2">Results</h2>
                            {result ? (
                                <div className="space-y-4">
                                    {result.success ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-green-400 font-semibold">✓ Success</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-slate-900 rounded p-2">Provider: <span className="text-white font-semibold">{result.provider}</span></div>
                                                <div className="bg-slate-900 rounded p-2">Model: <span className="text-white font-semibold">{result.model}</span></div>
                                                <div className="bg-slate-900 rounded p-2">Tokens: <span className="text-white font-semibold">{result.usage?.totalTokens}</span></div>
                                                <div className="bg-slate-900 rounded p-2">Cost: <span className="text-white font-semibold">${result.cost?.toFixed(7)}</span></div>
                                            </div>
                                            <div className="bg-slate-900 rounded p-4 mt-2 text-white text-sm whitespace-pre-wrap">{result.response}</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-red-400 font-semibold">✗ Error</div>
                                            <div className="bg-slate-900 rounded p-4 text-red-300 text-sm">{result.error}{result.details && (<div className="text-xs text-red-400 mt-1">{result.details}</div>)}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-2">⚡</div>
                                    <p className="text-base font-medium">Run a test to see results here</p>
                                    <p className="text-xs text-slate-500 mt-1">Configure your settings and click "Test LLM"</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Workflow Testing Tab */}
                {activeTab === 'workflow' && (
                    <div className="grid md:grid-cols-3 gap-6 w-full">
                        {/* Configuration Panel */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-white mb-2">Workflow Test</h2>
                            <div className="mb-2 p-3 bg-slate-700 rounded text-purple-200 text-xs font-semibold text-center">Test Workflow Pipeline: <span className="text-white">Input → Summarize → Expand → Output</span></div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-300">Input Text</label>
                                <textarea value={workflowPrompt} onChange={(e) => setWorkflowPrompt(e.target.value)} placeholder="Enter text to process through the workflow..." rows={4} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-400" />
                            </div>
                            <button onClick={handleWorkflowTest} disabled={workflowLoading || !apiKeys.openai || !workflowPrompt} className="w-full bg-gradient-to-r from-pink-600 to-cyan-600 text-white py-3 rounded-lg font-bold text-base transition hover:from-pink-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2">{workflowLoading ? 'Running Workflow...' : 'Execute Workflow'}</button>
                            {(!apiKeys.openai || !workflowPrompt) && (<p className="text-xs text-slate-400 text-center mt-1">{!apiKeys.openai ? 'OpenAI API key required' : 'Input text required'}</p>)}
                        </div>

                        {/* Debug Panel */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-white">Debug Information</h2>
                                <button
                                    className={`px-3 py-1 rounded text-xs font-semibold border ${debugMode ? 'bg-blue-700 text-white border-blue-500' : 'bg-slate-700 text-slate-300 border-slate-600'} transition`}
                                    onClick={() => setDebugMode((d) => !d)}
                                >
                                    {debugMode ? 'Hide Debug' : 'Show Debug'}
                                </button>
                            </div>
                            {workflowResult ? (
                                <div className="space-y-4">
                                    {workflowResult.success ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-green-400 font-semibold">✓ Workflow Completed</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-slate-900 rounded p-2">Status: <span className="text-white font-semibold">{workflowResult.execution.status}</span></div>
                                                <div className="bg-slate-900 rounded p-2">Total Cost: <span className="text-white font-semibold">${workflowResult.execution.totalCost?.toFixed(7)}</span></div>
                                                <div className="bg-slate-900 rounded p-2">Execution Time: <span className="text-white font-semibold">{workflowResult.execution.executionTimeMs}ms</span></div>
                                                <div className="bg-slate-900 rounded p-2 flex items-center gap-1">Steps: <span className="text-white font-semibold">{workflowResult.execution.nodeDebug?.length || 'N/A'}</span>
                                                    <span className="ml-1 text-slate-400" title="Number of LLM nodes executed">ℹ️</span>
                                                </div>
                                            </div>
                                            {debugMode && workflowResult.execution.nodeDebug && (
                                                <div className="mt-4">
                                                    <h3 className="text-base font-bold text-blue-300 mb-2">Debug: Node-by-Node Details</h3>
                                                    <div className="space-y-4">
                                                        {workflowResult.execution.nodeDebug.map((node: any, idx: number) => (
                                                            <div key={node.id || idx} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                                                <div className="font-semibold text-slate-200 mb-1">Node {idx + 1}: {node.label || node.id}</div>
                                                                <div className="text-xs text-slate-400 mb-1">Prompt Sent:</div>
                                                                <div className="bg-slate-800 rounded p-2 mb-2 text-slate-200 whitespace-pre-wrap">{node.prompt}</div>
                                                                <div className="text-xs text-slate-400 mb-1">Output:</div>
                                                                <div className="bg-slate-800 rounded p-2 mb-2 text-slate-100 whitespace-pre-wrap">{node.output}</div>
                                                                {node.recommendations && (
                                                                    <div className="text-xs text-blue-300 mb-1">Recommendations:</div>
                                                                )}
                                                                {node.recommendations && (
                                                                    <div className="bg-blue-900 rounded p-2 mb-2 text-blue-100 whitespace-pre-wrap">{node.recommendations}</div>
                                                                )}
                                                                {node.reasoning && (
                                                                    <div className="text-xs text-purple-300 mb-1">Reasoning:</div>
                                                                )}
                                                                {node.reasoning && (
                                                                    <div className="bg-purple-900 rounded p-2 text-purple-100 whitespace-pre-wrap">{node.reasoning}</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-red-400 font-semibold">✗ Workflow Failed</div>
                                            <div className="bg-slate-900 rounded p-4 text-red-300 text-sm">{workflowResult.error}{workflowResult.details && (<div className="text-xs text-red-400 mt-1">{workflowResult.details}</div>)}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-2">⚡</div>
                                    <p className="text-base font-medium">Execute workflow to see results here</p>
                                    <p className="text-xs text-slate-500 mt-1">Configure your input and click "Execute Workflow"</p>
                                </div>
                            )}
                        </div>

                        {/* Final Output Panel */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-white mb-2">Final Output</h2>
                            {workflowResult ? (
                                <div className="space-y-4">
                                    {workflowResult.success ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-green-400 font-semibold">✓ Final Result</div>
                                            <div className="bg-slate-900 rounded p-4 text-white text-sm whitespace-pre-wrap overflow-y-auto max-h-96 leading-relaxed">
                                                {workflowResult.execution.outputResult}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-2">
                                                Original Input: <span className="text-slate-300">{workflowResult.execution.inputPrompt}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-red-400 font-semibold">✗ No Output</div>
                                            <div className="bg-slate-900 rounded p-3 text-red-300 text-xs">Workflow failed to complete</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-2">📄</div>
                                    <p className="text-base font-medium">Final output will appear here</p>
                                    <p className="text-xs text-slate-500 mt-1">The refined result from your workflow</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 