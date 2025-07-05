import { NextRequest, NextResponse } from 'next/server';
import { workflowEngine } from '@/lib/workflow/execution-engine';

export async function POST(request: NextRequest) {
    try {
        const { workflow, inputPrompt, providerConfigs } = await request.json();

        if (!workflow || !inputPrompt || !providerConfigs) {
            return NextResponse.json(
                { error: 'Missing required fields: workflow, inputPrompt, providerConfigs' },
                { status: 400 }
            );
        }

        // Validate workflow structure
        const validation = workflowEngine.validateWorkflow(workflow);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    error: 'Invalid workflow',
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        // Execute the workflow
        const startTime = Date.now();
        const execution = await workflowEngine.executeWorkflow(
            workflow,
            inputPrompt,
            'test-user', // In a real app, this would come from auth
            providerConfigs
        );

        const totalTime = Date.now() - startTime;

        return NextResponse.json({
            success: execution.status === 'completed',
            execution: {
                id: execution.id,
                status: execution.status,
                inputPrompt: execution.inputPrompt,
                outputResult: execution.outputResult,
                totalCost: execution.totalCost,
                executionTimeMs: execution.executionTimeMs,
                error: execution.error,
                createdAt: execution.createdAt,
                nodeDebug: execution.nodeDebug || [],
            },
            totalTime,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Workflow Execution API Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Workflow Execution API',
        usage: 'POST with { workflow, inputPrompt, providerConfigs }',
        exampleWorkflow: {
            id: 'test-workflow',
            name: 'Simple Test Workflow',
            description: 'A simple workflow for testing',
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
                        label: 'LLM Node',
                        provider: 'openai',
                        model: 'gpt-4o-mini',
                        prompt: 'Summarize this in one sentence: {input}',
                        config: {
                            temperature: 0.7,
                            maxTokens: 100
                        }
                    }
                },
                {
                    id: 'output-1',
                    type: 'output',
                    position: { x: 400, y: 0 },
                    data: { label: 'Output' }
                }
            ],
            edges: [
                {
                    id: 'e1',
                    source: 'input-1',
                    target: 'llm-1'
                },
                {
                    id: 'e2',
                    source: 'llm-1',
                    target: 'output-1'
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 'test-user',
            isTemplate: false,
            isPublic: false
        },
        exampleProviderConfigs: {
            openai: { apiKey: 'your-openai-api-key' },
            anthropic: { apiKey: 'your-anthropic-api-key' }
        }
    });
} 