"use client";

import React, { useCallback, useRef, useState } from "react";
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

// Custom node components for dark theme
const CustomNode = ({ data }: any) => (
    <div style={{
        background: '#18181b',
        color: '#f1f5f9',
        border: '2px solid #6366f1',
        borderRadius: 16,
        padding: '24px 40px',
        minWidth: 180,
        textAlign: 'center',
        fontWeight: 700,
        fontSize: 28,
        boxShadow: '0 2px 16px #0004',
        transition: 'box-shadow 0.2s',
    }}>
        {data.label}
        <Handle type="target" position={Position.Left} style={{ background: '#6366f1' }} />
        <Handle type="source" position={Position.Right} style={{ background: '#6366f1' }} />
    </div>
);

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const Sidebar = ({ onDragStart }: { onDragStart: (event: React.DragEvent, nodeType: string) => void }) => (
    <aside
        style={{
            width: 200,
            padding: 24,
            background: '#18181b',
            borderRight: '1px solid #27272a',
            height: 'calc(100vh - 56px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'fixed',
            left: 0,
            top: 56,
            zIndex: 10,
        }}
    >
        <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: 18, marginBottom: 8 }}>Node Library</div>
        <div
            onDragStart={event => onDragStart(event, 'input')}
            draggable
            style={{
                padding: 12,
                background: '#27272a',
                borderRadius: 8,
                color: '#f1f5f9',
                fontWeight: 500,
                cursor: 'grab',
                border: '1.5px solid #6366f1',
                marginBottom: 4,
                userSelect: 'none',
            }}
        >
            Input Node
        </div>
        <div
            onDragStart={event => onDragStart(event, 'llm')}
            draggable
            style={{
                padding: 12,
                background: '#27272a',
                borderRadius: 8,
                color: '#f1f5f9',
                fontWeight: 500,
                cursor: 'grab',
                border: '1.5px solid #6366f1',
                marginBottom: 4,
                userSelect: 'none',
            }}
        >
            LLM Node
        </div>
        <div
            onDragStart={event => onDragStart(event, 'output')}
            draggable
            style={{
                padding: 12,
                background: '#27272a',
                borderRadius: 8,
                color: '#f1f5f9',
                fontWeight: 500,
                cursor: 'grab',
                border: '1.5px solid #6366f1',
                userSelect: 'none',
            }}
        >
            Output Node
        </div>
    </aside>
);

function WorkflowEditor() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

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
            const id = `custom-${+new Date()}`;
            let label = '';
            if (type === 'input') label = 'Input Node';
            else if (type === 'llm') label = 'LLM Node';
            else if (type === 'output') label = 'Output Node';
            setNodes(nds =>
                nds.concat({
                    id,
                    type: 'custom',
                    position,
                    data: { label },
                })
            );
        },
        [reactFlowInstance, setNodes]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", background: '#09090b' }}>
            <Sidebar onDragStart={onDragStart} />
            <div
                style={{ flex: 1, height: "100vh", marginLeft: 200, background: '#09090b' }}
                ref={reactFlowWrapper}
            >
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
                        fitView
                        nodeTypes={nodeTypes}
                        style={{ background: '#09090b' }}
                    >
                        <MiniMap nodeColor={() => '#6366f1'} maskColor="#18181b99" />
                        <Controls style={{ background: '#18181b', color: '#a5b4fc' }} />
                        <Background gap={16} color="#27272a" />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}

export default WorkflowEditor; 