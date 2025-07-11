import { LLMProvider, LLMConfig, LLMResponse, ProviderConfig } from '@/types';

export class OpenAIProvider implements LLMProvider {
    id = 'openai';
    name = 'OpenAI';
    models = [
        'gpt-4o-mini',
        'gpt-4.1',
        'o3',
        'gpt-4o',
        'gpt-4o-2024-05-13',
        'o4-mini',
        'gpt-4.1-mini',
        'gpt-4.1-nano',
        // Legacy models
        'gpt-4-turbo',
        'gpt-4-turbo-preview',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k'
    ];

    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = {
            baseUrl: 'https://api.openai.com/v1',
            timeout: 30000,
            ...config
        };
    }

    async execute(prompt: string, config: LLMConfig): Promise<LLMResponse> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        ...(config.systemPrompt ? [{
                            role: 'system',
                            content: config.systemPrompt
                        }] : []),
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: config.temperature || 0.7,
                    max_tokens: config.maxTokens || 1000,
                    top_p: config.topP || 1,
                    frequency_penalty: config.frequencyPenalty || 0,
                    presence_penalty: config.presencePenalty || 0,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const executionTime = Date.now() - startTime;

            return {
                content: data.choices[0].message.content,
                usage: {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                },
                cost: this.calculateCost(config.model, data.usage),
                executionTime,
                model: config.model,
                provider: this.id,
            };
        } catch (error) {
            throw new Error(`OpenAI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private calculateCost(model: string, usage: any): number {
        // OpenAI pricing per 1K tokens (updated with new models)
        const pricing: Record<string, { input: number; output: number }> = {
            // New GPT models (per 1K tokens)
            'gpt-4.1': { input: 0.002, output: 0.008 },
            'o3': { input: 0.002, output: 0.008 },
            'gpt-4o': { input: 0.005, output: 0.020 },
            'gpt-4o-2024-05-13': { input: 0.005, output: 0.020 },
            'o4-mini': { input: 0.0011, output: 0.0044 },
            'gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
            'gpt-4o-mini': { input: 0.0006, output: 0.0024 },
            'gpt-4.1-nano': { input: 0.0001, output: 0.0004 },
            // Legacy models
            'gpt-4-turbo': { input: 0.01, output: 0.03 },
            'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
        };

        const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
        const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
        const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;

        return inputCost + outputCost;
    }
} 