import { LLMProvider, ProviderType, ProviderConfig } from '@/types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export class ProviderFactory {
    private providers: Map<ProviderType, LLMProvider> = new Map();

    constructor() {
        // Initialize providers with empty configs - will be configured per request
    }

    registerProvider(type: ProviderType, config: ProviderConfig): void {
        switch (type) {
            case 'openai':
                this.providers.set(type, new OpenAIProvider(config));
                break;
            case 'anthropic':
                this.providers.set(type, new AnthropicProvider(config));
                break;
            case 'google':
                // TODO: Implement Google Gemini provider
                throw new Error('Google Gemini provider not yet implemented');
            case 'deepseek':
                // TODO: Implement DeepSeek provider
                throw new Error('DeepSeek provider not yet implemented');
            default:
                throw new Error(`Unsupported provider type: ${type}`);
        }
    }

    getProvider(type: ProviderType): LLMProvider {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`Provider ${type} not registered. Please configure API key first.`);
        }
        return provider;
    }

    isProviderRegistered(type: ProviderType): boolean {
        return this.providers.has(type);
    }

    getAvailableProviders(): ProviderType[] {
        return Array.from(this.providers.keys());
    }

    getAllProviderInfo(): Array<{ id: string; name: string; models: string[] }> {
        return Array.from(this.providers.values()).map(provider => ({
            id: provider.id,
            name: provider.name,
            models: provider.models
        }));
    }

    async validateProviderKey(type: ProviderType, apiKey: string): Promise<boolean> {
        try {
            // Create a temporary provider instance to validate the key
            let tempProvider: LLMProvider;
            switch (type) {
                case 'openai':
                    tempProvider = new OpenAIProvider({ apiKey });
                    break;
                case 'anthropic':
                    tempProvider = new AnthropicProvider({ apiKey });
                    break;
                default:
                    return false;
            }

            return await tempProvider.validateApiKey(apiKey);
        } catch {
            return false;
        }
    }
}

// Global provider factory instance
export const providerFactory = new ProviderFactory(); 