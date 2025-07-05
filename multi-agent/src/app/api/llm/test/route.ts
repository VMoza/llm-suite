import { NextRequest, NextResponse } from 'next/server';
import { OpenAIProvider } from '@/lib/llm/providers/openai';
import { AnthropicProvider } from '@/lib/llm/providers/anthropic';
import { ProviderType } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const { provider, apiKey, model, prompt, temperature, maxTokens, systemPrompt } = await request.json();

        if (!provider || !apiKey || !model || !prompt) {
            return NextResponse.json(
                { error: 'Missing required fields: provider, apiKey, model, prompt' },
                { status: 400 }
            );
        }

        // Create provider instance
        let providerInstance;
        switch (provider as ProviderType) {
            case 'openai':
                providerInstance = new OpenAIProvider({ apiKey });
                break;
            case 'anthropic':
                providerInstance = new AnthropicProvider({ apiKey });
                break;
            default:
                return NextResponse.json(
                    { error: `Unsupported provider: ${provider}` },
                    { status: 400 }
                );
        }

        // Validate API key first
        const isValidKey = await providerInstance.validateApiKey(apiKey);
        if (!isValidKey) {
            return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 401 }
            );
        }

        // Execute the prompt
        const startTime = Date.now();
        const response = await providerInstance.execute(prompt, {
            model,
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 1000,
            systemPrompt: systemPrompt || undefined,
        });

        const totalTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            provider: response.provider,
            model: response.model,
            response: response.content,
            usage: response.usage,
            cost: response.cost,
            executionTime: totalTime,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('LLM Test API Error:', error);
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
        message: 'LLM Test API',
        usage: 'POST with { provider, apiKey, model, prompt, temperature?, maxTokens?, systemPrompt? }',
        supportedProviders: ['openai', 'anthropic'],
        models: {
            openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307']
        }
    });
} 