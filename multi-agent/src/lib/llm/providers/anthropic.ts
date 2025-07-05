import { LLMProvider, LLMConfig, LLMResponse, ProviderConfig } from '@/types';

export class AnthropicProvider implements LLMProvider {
    id = 'anthropic';
    name = 'Anthropic';
    models = [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
    ];

    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = {
            baseUrl: 'https://api.anthropic.com/v1',
            timeout: 30000,
            ...config
        };
    }

    async execute(prompt: string, config: LLMConfig): Promise<LLMResponse> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.config.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: config.model,
                    max_tokens: config.maxTokens || 1000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: config.temperature || 0.7,
                    top_p: config.topP || 1,
                    ...(config.systemPrompt && { system: config.systemPrompt })
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const executionTime = Date.now() - startTime;

            return {
                content: data.content[0].text,
                usage: {
                    promptTokens: data.usage.input_tokens,
                    completionTokens: data.usage.output_tokens,
                    totalTokens: data.usage.input_tokens + data.usage.output_tokens,
                },
                cost: this.calculateCost(config.model, data.usage),
                executionTime,
                model: config.model,
                provider: this.id,
            };
        } catch (error) {
            throw new Error(`Anthropic execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [
                        {
                            role: 'user',
                            content: 'test'
                        }
                    ]
                }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private calculateCost(model: string, usage: any): number {
        // Anthropic pricing per 1K tokens (as of 2024)
        const pricing: Record<string, { input: number; output: number }> = {
            'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
            'claude-3-5-haiku-20241022': { input: 0.00025, output: 0.00125 },
            'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
            'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
            'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
        };

        const modelPricing = pricing[model] || pricing['claude-3-haiku-20240307'];
        const inputCost = (usage.input_tokens / 1000) * modelPricing.input;
        const outputCost = (usage.output_tokens / 1000) * modelPricing.output;

        return inputCost + outputCost;
    }
} 