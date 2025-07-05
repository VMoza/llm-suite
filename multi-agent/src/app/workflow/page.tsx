"use client";

import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Node,
    Edge,
    Connection,
    OnConnect,
    NodeTypes,
    Handle,
    Position,
} from "reactflow";
import "reactflow/dist/style.css";

// Types
interface ApiKeys {
    openai: string;
    anthropic: string;
    google: string;
}

interface WorkflowResult {
    success: boolean;
    execution: {
        id: string;
        status: string;
        inputPrompt: string;
        outputResult: string;
        totalCost: number;
        executionTimeMs: number;
        nodeDebug?: Array<{
            id: string;
            label: string;
            prompt: string;
            output: string;
            recommendations?: string;
            reasoning?: string;
        }>;
    };
    error?: string;
    details?: string;
}

// Custom node component
const CustomNode = ({ data, selected, id, activeNodeId, isExecuting }: any) => (
    <div
        style={{
            background: selected ? '#1e1b4b' : id === activeNodeId && isExecuting ? '#059669' : '#18181b',
            color: '#f1f5f9',
            border: selected ? '2px solid #8b5cf6' : id === activeNodeId && isExecuting ? '2px solid #10b981' : '2px solid #6366f1',
            borderRadius: 12,
            padding: '16px 24px',
            minWidth: 140,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: selected ? '0 4px 20px #8b5cf644' : id === activeNodeId && isExecuting ? '0 4px 20px #10b98144' : '0 2px 16px #0004',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
            transform: id === activeNodeId && isExecuting ? 'scale(1.05)' : 'scale(1)',
        }}
    >
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            {data.type === 'input' ? '📥' : data.type === 'output' ? '📤' : '🤖'}
        </div>
        <div>{data.label}</div>
        {data.type === 'llm' && (
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                {data.provider || 'openai'} • {data.model || 'gpt-4o-mini'}
            </div>
        )}
        {id === activeNodeId && isExecuting && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <span className="animate-spin" style={{ display: 'inline-block', fontSize: 16 }}>⚡</span>
            </div>
        )}
        <Handle
            type="target"
            position={Position.Left}
            style={{
                background: selected ? '#8b5cf6' : id === activeNodeId && isExecuting ? '#10b981' : '#6366f1',
                width: 8,
                height: 8,
                border: 'none'
            }}
        />
        <Handle
            type="source"
            position={Position.Right}
            style={{
                background: selected ? '#8b5cf6' : id === activeNodeId && isExecuting ? '#10b981' : '#6366f1',
                width: 8,
                height: 8,
                border: 'none'
            }}
        />
    </div>
);

function UnifiedWorkflowInterface() {
    // Initial workflow nodes
    const initialNodes: Node[] = [
        {
            id: 'input-1',
            type: 'custom',
            position: { x: 100, y: 200 },
            data: {
                label: 'Input',
                type: 'input',
                prompt: 'Enter your prompt here...'
            }
        },
        {
            id: 'llm-1',
            type: 'custom',
            position: { x: 300, y: 200 },
            data: {
                label: 'Step 1',
                type: 'llm',
                provider: 'openai',
                model: 'gpt-4o-mini',
                prompt: '{input}',
                config: {
                    temperature: 0.7,
                    maxTokens: 300
                }
            }
        },
        {
            id: 'llm-2',
            type: 'custom',
            position: { x: 500, y: 200 },
            data: {
                label: 'Step 2',
                type: 'llm',
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
            type: 'custom',
            position: { x: 700, y: 200 },
            data: {
                label: 'Step 3',
                type: 'llm',
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
            type: 'custom',
            position: { x: 900, y: 200 },
            data: {
                label: 'Output',
                type: 'output'
            }
        }
    ];

    const initialEdges: Edge[] = [
        { id: 'e1', source: 'input-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'llm-2' },
        { id: 'e3', source: 'llm-2', target: 'llm-3' },
        { id: 'e4', source: 'llm-3', target: 'output-1' }
    ];

    // React Flow state
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

    // API Keys
    const [apiKeys, setApiKeys] = useState<ApiKeys>({
        openai: '',
        anthropic: '',
        google: ''
    });

    // Workflow execution state
    const [inputPrompt, setInputPrompt] = useState('Artificial intelligence is transforming the world in many ways.');
    const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [debugMode, setDebugMode] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);

    // Always get the latest selected node from nodes state
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;

    // Load API keys from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('multiagent-api-keys');
        if (stored) {
            try {
                setApiKeys(JSON.parse(stored));
            } catch { }
        }
    }, []);

    // Save API keys to localStorage
    useEffect(() => {
        localStorage.setItem('multiagent-api-keys', JSON.stringify(apiKeys));
    }, [apiKeys]);

    // React Flow handlers
    const onConnect: OnConnect = useCallback(
        (params: Edge | Connection) => setEdges(eds => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData("application/reactflow");
            if (!type || !reactFlowWrapper.current || !reactFlowInstance) return;

            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });

            const id = `${type}-${+new Date()}`;
            let label = '';
            let nodeData: any = { type };

            if (type === 'input') {
                label = 'Input';
                nodeData = { ...nodeData, label, prompt: '{input}' };
            } else if (type === 'llm') {
                label = 'LLM Node';
                nodeData = {
                    ...nodeData,
                    label,
                    provider: 'openai',
                    model: 'gpt-4o-mini',
                    prompt: '{input}',
                    config: { temperature: 0.7, maxTokens: 500 }
                };
            } else if (type === 'output') {
                label = 'Output';
                nodeData = { ...nodeData, label };
            }

            setNodes(nds =>
                nds.concat({
                    id,
                    type: 'custom',
                    position,
                    data: nodeData,
                })
            );
        },
        [reactFlowInstance, setNodes]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    // Update selected node data
    const updateNodeData = (nodeId: string, data: any) => {
        setNodes(nds =>
            nds.map(node =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            )
        );
    };

    // Execute workflow
    const handleExecuteWorkflow = async () => {
        setUserError(null);
        // Get the prompt from the Input node
        const inputNode = nodes.find(node => node.data.type === 'input');
        const actualInputPrompt = inputNode?.data.prompt || '';

        if (!apiKeys.openai) {
            setUserError('Please provide your OpenAI API key.');
            return;
        }
        if (!actualInputPrompt || actualInputPrompt === 'Enter your prompt here...') {
            setUserError('Please enter a prompt in the Input node.');
            return;
        }

        setIsExecuting(true);
        setWorkflowResult(null);
        setActiveNodeId(null);

        try {
            // Find the execution order of nodes (input -> ... -> output)
            const executionOrder = [];
            let current: Node | undefined = nodes.find(n => n.data.type === 'input');

            while (current) {
                executionOrder.push(current.id);
                const nextEdge = edges.find(e => e.source === current.id);
                if (!nextEdge) break;
                const nextNode = nodes.find(n => n.id === nextEdge.target);
                if (!nextNode || nextNode.data.type === 'output') break;
                current = nextNode;
            }
            // Add output node at the end
            const outputNode = nodes.find(n => n.data.type === 'output');
            if (outputNode) executionOrder.push(outputNode.id);

            // Simulate highlighting each node (for demo, real backend should stream progress)
            for (const nodeId of executionOrder) {
                setActiveNodeId(nodeId);
                await new Promise(res => setTimeout(res, 800));
            }

            const workflow = {
                id: 'unified-workflow',
                name: 'Unified Workflow',
                description: 'A workflow created in the unified interface',
                nodes: nodes.map(node => ({
                    id: node.id,
                    type: node.data.type,
                    position: node.position,
                    data: node.data
                })),
                edges: edges,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'test-user',
                isTemplate: false,
                isPublic: false
            };

            const response = await fetch('/api/workflow/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workflow,
                    inputPrompt: actualInputPrompt,
                    providerConfigs: {
                        openai: { apiKey: apiKeys.openai },
                        anthropic: { apiKey: apiKeys.anthropic }
                    }
                }),
            });

            const data = await response.json();
            setWorkflowResult(data);
        } catch (error) {
            setUserError(error instanceof Error ? error.message : 'Unknown error');
            setWorkflowResult({
                success: false,
                error: 'Network error',
                details: error instanceof Error ? error.message : 'Unknown error',
                execution: {
                    id: '',
                    status: 'failed',
                    inputPrompt: '',
                    outputResult: '',
                    totalCost: 0,
                    executionTimeMs: 0
                }
            });
        } finally {
            setIsExecuting(false);
            setActiveNodeId(null);
        }
    };

    // Move nodeTypes here so it can access state
    const nodeTypes = useMemo(() => ({
        custom: (props: any) => <CustomNode {...props} id={props.id} activeNodeId={activeNodeId} isExecuting={isExecuting} />,
    }), [activeNodeId, isExecuting]);

    return (
        <div className="flex h-screen bg-slate-950 text-white">
            {/* Left Sidebar */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white">Workflow Studio</h1>
                    <p className="text-sm text-slate-400">Build and test AI workflows</p>
                </div>

                {/* API Keys */}
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">API Keys</h3>
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">OpenAI</label>
                            <input
                                type="password"
                                value={apiKeys.openai}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                                placeholder="sk-..."
                                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Anthropic</label>
                            <input
                                type="password"
                                value={apiKeys.anthropic}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                                placeholder="sk-ant-..."
                                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Node Library */}
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Node Library</h3>
                    <div className="space-y-2">
                        <div
                            onDragStart={event => onDragStart(event, 'input')}
                            draggable
                            className="p-2 bg-slate-800 border border-slate-700 rounded cursor-grab text-xs text-center hover:bg-slate-700 transition-colors"
                        >
                            📥 Input Node
                        </div>
                        <div
                            onDragStart={event => onDragStart(event, 'llm')}
                            draggable
                            className="p-2 bg-slate-800 border border-slate-700 rounded cursor-grab text-xs text-center hover:bg-slate-700 transition-colors"
                        >
                            🤖 LLM Node
                        </div>
                        <div
                            onDragStart={event => onDragStart(event, 'output')}
                            draggable
                            className="p-2 bg-slate-800 border border-slate-700 rounded cursor-grab text-xs text-center hover:bg-slate-700 transition-colors"
                        >
                            📤 Output Node
                        </div>
                    </div>
                </div>

                {/* Node Configuration */}
                <div className="p-4 border-b border-slate-800 flex-1 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Node Configuration</h3>
                    {selectedNode ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Label</label>
                                <input
                                    type="text"
                                    value={selectedNode.data.label}
                                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                />
                            </div>

                            {selectedNode.data.type === 'input' && (
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Input Prompt</label>
                                    <textarea
                                        value={selectedNode.data.prompt || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                                        placeholder="Enter the input prompt for this workflow..."
                                        rows={4}
                                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                                    />
                                </div>
                            )}

                            {selectedNode.data.type === 'llm' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Provider</label>
                                        <select
                                            value={selectedNode.data.provider}
                                            onChange={(e) => updateNodeData(selectedNode.id, { provider: e.target.value })}
                                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Model</label>
                                        <select
                                            value={selectedNode.data.model}
                                            onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                        >
                                            {selectedNode.data.provider === 'openai' ? (
                                                <>
                                                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                                                    <option value="gpt-4.1">gpt-4.1</option>
                                                    <option value="o3">o3</option>
                                                    <option value="gpt-4o">gpt-4o</option>
                                                    <option value="gpt-4o-2024-05-13">gpt-4o-2024-05-13</option>
                                                    <option value="o4-mini">o4-mini</option>
                                                    <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                                    <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet</option>
                                                    <option value="claude-3-5-haiku-20241022">claude-3-5-haiku</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Prompt (Auto-generated)</label>
                                        <div className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 opacity-75">
                                            This step uses a predefined prompt template that automatically processes the workflow data.
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Temperature</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={selectedNode.data.config?.temperature || 0.7}
                                                onChange={(e) => updateNodeData(selectedNode.id, {
                                                    config: {
                                                        ...selectedNode.data.config,
                                                        temperature: parseFloat(e.target.value)
                                                    }
                                                })}
                                                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Max Tokens</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="4000"
                                                value={selectedNode.data.config?.maxTokens || 500}
                                                onChange={(e) => updateNodeData(selectedNode.id, {
                                                    config: {
                                                        ...selectedNode.data.config,
                                                        maxTokens: parseInt(e.target.value)
                                                    }
                                                })}
                                                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 mt-8">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                ⚙️
                            </div>
                            <p className="text-xs">Select a node to configure</p>
                        </div>
                    )}
                </div>

                {/* Execute Workflow Button - fixed at bottom */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10">
                    {userError && (
                        <div className="p-2 mb-2 bg-red-900 text-red-200 rounded text-xs text-center border border-red-700">
                            {userError}
                        </div>
                    )}
                    <button
                        onClick={handleExecuteWorkflow}
                        disabled={isExecuting || !apiKeys.openai}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded text-xs font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isExecuting ? 'Executing...' : 'Execute Workflow'}
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col">
                {/* Canvas */}
                <div className="flex-1" ref={reactFlowWrapper}>
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            fitView
                            nodeTypes={nodeTypes}
                            className="bg-slate-900"
                        >
                            <MiniMap nodeColor={() => '#6366f1'} maskColor="#18181b99" />
                            <Controls className="bg-slate-800 border-slate-700" />
                            <Background gap={16} color="#374151" />
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
                {/* Debug Panel */}
                <div className="flex-1 p-4 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-300">Debug Information</h3>
                        <button
                            onClick={() => setDebugMode(!debugMode)}
                            className={`px-2 py-1 rounded text-xs ${debugMode ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                            {debugMode ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-96">
                        {workflowResult && workflowResult.success && debugMode && workflowResult.execution.nodeDebug ? (
                            workflowResult.execution.nodeDebug.map((node, index) => (
                                <div key={index} className="bg-slate-800 rounded p-3 space-y-2">
                                    <div className="font-semibold text-xs text-blue-300">
                                        Step {index + 1}: {node.label}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        <div className="font-medium">Prompt:</div>
                                        <div className="mt-1 p-2 bg-slate-900 rounded text-slate-300 whitespace-pre-wrap text-xs">
                                            {node.prompt}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        <div className="font-medium">Output:</div>
                                        <div className="mt-1 p-2 bg-slate-900 rounded text-white whitespace-pre-wrap text-xs">
                                            {node.output}
                                        </div>
                                    </div>
                                    {node.recommendations && (
                                        <div className="text-xs text-yellow-400">
                                            <div className="font-medium">Recommendations:</div>
                                            <div className="mt-1 p-2 bg-slate-900 rounded text-yellow-200 whitespace-pre-wrap text-xs">
                                                {node.recommendations}
                                            </div>
                                        </div>
                                    )}
                                    {node.reasoning && (
                                        <div className="text-xs text-green-400">
                                            <div className="font-medium">Reasoning:</div>
                                            <div className="mt-1 p-2 bg-slate-900 rounded text-green-200 whitespace-pre-wrap text-xs">
                                                {node.reasoning}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : !workflowResult ? (
                            <div className="text-center text-slate-500 mt-8">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                    🔍
                                </div>
                                <p className="text-xs">Execute workflow to see debug info</p>
                            </div>
                        ) : !workflowResult.success ? (
                            <div className="bg-red-900 rounded p-3 text-red-200">
                                <div className="font-semibold text-sm">Error</div>
                                <div className="text-xs mt-1">{workflowResult.error}</div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Final Output Panel */}
                <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Final Output</h3>
                    {workflowResult ? (
                        workflowResult.success ? (
                            <div className="bg-slate-800 rounded p-3 space-y-2">
                                <div className="flex items-center text-green-400 font-semibold text-xs">
                                    ✓ Success
                                </div>
                                <div className="bg-slate-900 rounded p-3 text-white text-xs whitespace-pre-wrap overflow-y-auto max-h-64">
                                    {workflowResult.execution.outputResult}
                                </div>
                                <div className="text-xs text-slate-400 bg-slate-900 rounded p-2">
                                    <div className="flex justify-between items-center">
                                        <span>💰 Cost: ${(workflowResult.execution.totalCost || 0).toFixed(6)}</span>
                                        <span>⏱️ Time: {workflowResult.execution.executionTimeMs || 0}ms</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-900 rounded p-3 text-red-200">
                                <div className="font-semibold text-sm">Failed</div>
                                <div className="text-xs mt-1">{workflowResult.error}</div>
                                {workflowResult.details && (
                                    <div className="text-xs mt-1 opacity-75">{workflowResult.details}</div>
                                )}
                            </div>
                        )
                    ) : !userError ? (
                        <div className="text-center text-slate-500">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                📄
                            </div>
                            <p className="text-xs">Final output will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-red-900 rounded p-3 text-red-200 mb-2">
                            <div className="font-semibold text-sm">Error</div>
                            <div className="text-xs mt-1">{userError}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UnifiedWorkflowInterface; 