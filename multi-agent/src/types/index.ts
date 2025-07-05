// Core LLM Provider Interfaces
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
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
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
    model: string;
    provider: string;
}

// Workflow Interfaces
export interface WorkflowNode {
    id: string;
    type: 'llm' | 'input' | 'output' | 'transform';
    position: { x: number; y: number };
    data: WorkflowNodeData;
}

export interface WorkflowNodeData {
    label: string;
    provider?: string;
    model?: string;
    config?: LLMConfig;
    prompt?: string;
    outputs?: string[];
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
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isTemplate: boolean;
    isPublic: boolean;
}

// Execution Interfaces
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    userId: string;
    inputPrompt: string;
    outputResult?: string;
    executionTimeMs?: number;
    totalCost: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    createdAt: Date;
    updatedAt: Date;
    nodeDebug?: Array<{
        id: string;
        label?: string;
        prompt: string;
        output: string;
        recommendations?: string;
        reasoning?: string;
    }>;
}

export interface ExecutionStep {
    nodeId: string;
    provider: string;
    model: string;
    input: string;
    output?: string;
    cost: number;
    executionTime: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
}

// User Management Interfaces
export interface User {
    id: string;
    email: string;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    stripeCustomerId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserApiKey {
    id: string;
    userId: string;
    provider: string;
    encryptedKey: string;
    createdAt: Date;
    lastUsed?: Date;
}

// Template Interfaces
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    workflow: Omit<Workflow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
}

// API Response Types
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Error Types
export interface AppError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
}

// Provider-specific types
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'deepseek';

export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}

// Billing and Usage Types
export interface UsageMetrics {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    period: {
        start: Date;
        end: Date;
    };
}

export interface BillingInfo {
    subscriptionTier: string;
    currentPeriod: {
        start: Date;
        end: Date;
    };
    usage: UsageMetrics;
    limits: {
        maxRequests: number;
        maxTokens: number;
        maxWorkflows: number;
    };
}

// All types are exported above 