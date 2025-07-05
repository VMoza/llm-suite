import React from 'react';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
            <div className="w-full max-w-5xl px-4 py-12 mx-auto flex flex-col items-center gap-8">
                <header className="text-center mb-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-1 tracking-tight">Multi-Agent LLM Orchestration Platform</h1>
                    <p className="text-lg text-blue-100 mb-2">Create complex workflows by chaining multiple state-of-the-art LLMs together</p>
                </header>
                <div className="grid md:grid-cols-2 gap-6 w-full">
                    {/* Phase 1 */}
                    <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
                        <h2 className="text-xl font-bold text-green-700 mb-2 flex items-center gap-2"> <span>✅</span> Phase 1: Foundation Complete</h2>
                        <ul className="text-base text-gray-800 space-y-1">
                            <li><span className="mr-2">✅</span>Next.js 14 + TypeScript Setup</li>
                            <li><span className="mr-2">✅</span>Core TypeScript Interfaces</li>
                            <li><span className="mr-2">✅</span>OpenAI Provider</li>
                            <li><span className="mr-2">✅</span>Anthropic Claude Provider</li>
                            <li><span className="mr-2">✅</span>Provider Factory & Management</li>
                        </ul>
                    </div>
                    {/* Phase 2 */}
                    <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
                        <h2 className="text-xl font-bold text-blue-700 mb-2 flex items-center gap-2"> <span>✅</span> Phase 2: Workflow Engine</h2>
                        <ul className="text-base text-gray-800 space-y-1">
                            <li><span className="mr-2">✅</span>Workflow Execution Engine</li>
                            <li><span className="mr-2">✅</span>Node-based Processing</li>
                            <li><span className="mr-2">✅</span>Prompt Template System</li>
                            <li><span className="mr-2">✅</span>Workflow Validation</li>
                            <li><span className="mr-2">✅</span>Error Handling & Cost Tracking</li>
                        </ul>
                    </div>
                </div>
                {/* Phase 3 */}
                <div className="w-full">
                    <div className="bg-yellow-50 rounded-xl shadow p-6 border border-yellow-200 mb-2">
                        <h2 className="text-xl font-bold text-yellow-700 mb-2 flex items-center gap-2"> <span role="img" aria-label="party">🎉</span> Phase 3: Visual Editor (Next)</h2>
                        <ul className="text-base text-gray-800 space-y-1">
                            <li><span className="mr-2">⏳</span>React Flow Integration</li>
                            <li><span className="mr-2">⏳</span>Drag & Drop Workflow Builder</li>
                            <li><span className="mr-2">⏳</span>Node Configuration Panels</li>
                            <li><span className="mr-2">⏳</span>Execution Controls & Results</li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full justify-center">
                    <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">Test LLM Providers Now</span>
                    <span className="bg-blue-800 text-white px-3 py-1 rounded text-sm font-semibold">Ready for Phase 3: Visual Workflow Editor</span>
                </div>
            </div>
        </main>
    );
} 