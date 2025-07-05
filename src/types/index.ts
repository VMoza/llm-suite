// Core LLM Types
export interface LLMProvider {
    id: string;
    name: string;
    models: string[];
    execute(prompt: string, config: LLMConfig): Promise<LLMResponse>;
    validateApiKey(apiKey: string): Promise<boolean>;
}

export interface LLMConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    [key: string]: any; // Allow additional provider-specific config
}

export interface LLMResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cost: number;
    executionTime: number;
    provider: string;
    model: string;
}

// Workflow Types
export interface WorkflowNode {
    id: string;
    type: 'llm' | 'input' | 'output' | 'transform';
    position: { x: number; y: number };
    data: any;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    created_at?: string;
    updated_at?: string;
}

// Database Types
export interface User {
    id: string;
    email: string;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    stripe_customer_id?: string;
    created_at: string;
    updated_at: string;
}

export interface UserApiKey {
    id: string;
    user_id: string;
    provider: string;
    encrypted_key: string;
    created_at: string;
}

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    user_id: string;
    input_prompt: string;
    output_result?: string;
    execution_time_ms?: number;
    total_cost?: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error_message?: string;
    created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Execution Context Types
export interface ExecutionContext {
    workflowId: string;
    executionId: string;
    userId: string;
    variables: Record<string, any>;
    currentNodeId?: string;
}

// Template Types
export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    workflow: Workflow;
    is_public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// Usage Analytics Types
export interface UsageStats {
    totalExecutions: number;
    totalCost: number;
    executionsThisMonth: number;
    costThisMonth: number;
    favoriteProviders: Array<{
        provider: string;
        usage: number;
    }>;
} 