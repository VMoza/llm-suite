import {
    Workflow,
    WorkflowExecution,
    WorkflowNode,
    WorkflowEdge,
    ExecutionStep,
    LLMConfig,
    ProviderType
} from '@/types';
import { providerFactory } from '../llm/provider-factory';

export class WorkflowExecutionEngine {
    async executeWorkflow(
        workflow: Workflow,
        inputPrompt: string,
        userId: string,
        providerConfigs: Record<ProviderType, { apiKey: string }>
    ): Promise<WorkflowExecution> {
        const executionId = crypto.randomUUID();
        const startTime = Date.now();

        const execution: WorkflowExecution = {
            id: executionId,
            workflowId: workflow.id,
            userId,
            inputPrompt,
            totalCost: 0,
            status: 'running',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            // Register providers for this execution
            for (const [providerType, config] of Object.entries(providerConfigs)) {
                providerFactory.registerProvider(providerType as ProviderType, config);
            }

            // Find the input node
            const inputNode = workflow.nodes.find(node => node.type === 'input');
            if (!inputNode) {
                throw new Error('Workflow must have an input node');
            }

            // Execute the workflow
            const result = await this.executeFromNode(
                inputNode,
                inputPrompt,
                workflow.nodes,
                workflow.edges,
                new Map() // execution context
            );

            execution.outputResult = result.output;
            execution.totalCost = result.totalCost;
            execution.executionTimeMs = Date.now() - startTime;
            execution.status = 'completed';
            execution.updatedAt = new Date();

            // Debug: Log the final output length
            console.log('Final output length:', result.output?.length || 0);
            console.log('Final output preview:', result.output?.substring(0, 100) + '...');

            // --- Collect nodeDebug info ---
            const nodeDebug: Array<any> = [];
            for (const step of result.steps) {
                // Find the node for label
                const node = workflow.nodes.find(n => n.id === step.nodeId);
                // Try to extract recommendations/reasoning from output
                let recommendations = undefined;
                let reasoning = undefined;
                if (step.output) {
                    // Extract <B_Edits>...</B_Edits> and <B_Reasoning>...</B_Reasoning>
                    const editsMatch = step.output.match(/<B_Edits>([\s\S]*?)<\/B_Edits>/);
                    if (editsMatch) recommendations = editsMatch[1].trim();
                    const reasoningMatch = step.output.match(/<B_Reasoning>([\s\S]*?)<\/B_Reasoning>/);
                    if (reasoningMatch) reasoning = reasoningMatch[1].trim();
                }
                nodeDebug.push({
                    id: step.nodeId,
                    label: node?.data?.label || step.nodeId,
                    prompt: step.input,
                    output: step.output || '',
                    recommendations,
                    reasoning
                });
            }
            execution.nodeDebug = nodeDebug;
            // --- End nodeDebug ---

        } catch (error) {
            execution.status = 'failed';
            execution.error = error instanceof Error ? error.message : 'Unknown error';
            execution.updatedAt = new Date();
        }

        return execution;
    }

    private async executeFromNode(
        currentNode: WorkflowNode,
        input: string,
        nodes: WorkflowNode[],
        edges: WorkflowEdge[],
        context: Map<string, any>
    ): Promise<{ output: string; totalCost: number; steps: ExecutionStep[] }> {
        const steps: ExecutionStep[] = [];
        let totalCost = 0;
        let currentOutput = input;

        // Store current output in context
        context.set(currentNode.id, currentOutput);

        // Process current node
        if (currentNode.type === 'llm') {
            const step = await this.executeLLMNode(currentNode, input, context);
            steps.push(step);
            totalCost += step.cost;
            currentOutput = step.output || currentOutput;
            context.set(currentNode.id, currentOutput);
        }

        // Find next nodes
        const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);

        if (outgoingEdges.length === 0) {
            // This is a terminal node
            return { output: currentOutput, totalCost, steps };
        }

        // For now, handle single path execution (no branching)
        const nextEdge = outgoingEdges[0];
        const nextNode = nodes.find(node => node.id === nextEdge.target);

        if (!nextNode) {
            throw new Error(`Next node ${nextEdge.target} not found`);
        }

        // Handle output node
        if (nextNode.type === 'output') {
            console.log('Reaching output node, final output length:', currentOutput?.length || 0);
            console.log('Final output preview:', currentOutput?.substring(0, 200) + '...');
            return { output: currentOutput, totalCost, steps };
        }

        // Recursively execute next node
        const result = await this.executeFromNode(
            nextNode,
            currentOutput, // Pass current output to next node for chaining
            nodes,
            edges,
            context
        );

        return {
            output: result.output,
            totalCost: totalCost + result.totalCost,
            steps: [...steps, ...result.steps]
        };
    }

    private async executeLLMNode(node: WorkflowNode, input: string, context: Map<string, any>): Promise<ExecutionStep> {
        const startTime = Date.now();

        const step: ExecutionStep = {
            nodeId: node.id,
            provider: node.data.provider || 'openai',
            model: node.data.model || 'gpt-4o-mini',
            input,
            cost: 0,
            executionTime: 0,
            status: 'running',
        };

        try {
            console.log(`Starting LLM execution for node ${node.id}`);

            const provider = providerFactory.getProvider(node.data.provider as ProviderType);
            console.log(`Provider obtained: ${provider.id}`);

            const config: LLMConfig = {
                model: node.data.model || 'gpt-4o-mini',
                temperature: node.data.config?.temperature || 0.7,
                maxTokens: node.data.config?.maxTokens || 1000,
                systemPrompt: node.data.config?.systemPrompt,
                ...node.data.config
            };
            console.log(`Config prepared for ${node.id}:`, config);

            // Build template variables from context
            const templateVariables = this.buildTemplateVariables(input, context);

            // Process the prompt template
            const processedPrompt = this.processPromptTemplate(
                node.data.prompt || '{input}',
                templateVariables
            );
            console.log(`Processed prompt for ${node.id}:`, processedPrompt.substring(0, 100) + '...');

            step.input = processedPrompt; // Store the actual processed prompt for debugging

            console.log(`Calling provider.execute for ${node.id}`);
            let response;
            try {
                response = await provider.execute(processedPrompt, config);
                console.log(`Provider response received for ${node.id}:`, response);
            } catch (providerError) {
                console.error(`Provider execution failed for ${node.id}:`, providerError);
                throw providerError;
            }

            step.output = response.content;
            step.cost = response.cost;
            step.executionTime = Date.now() - startTime;
            step.status = 'completed';

            // Debug: Log LLM response
            console.log(`LLM Node ${node.id} output length:`, response.content?.length || 0);
            console.log(`LLM Node ${node.id} output preview:`, response.content?.substring(0, 100) + '...');

        } catch (error) {
            step.status = 'failed';
            step.error = error instanceof Error ? error.message : 'Unknown error';
            step.executionTime = Date.now() - startTime;
        }

        return step;
    }

    private buildTemplateVariables(input: string, context: Map<string, any>): Record<string, any> {
        const variables: Record<string, any> = {
            input: input // Original input prompt
        };

        // Add all node outputs from context
        for (const [nodeId, output] of context.entries()) {
            variables[nodeId] = output;

            // Extract special variables from LLM outputs
            if (typeof output === 'string') {
                // Extract <B_Edits> content
                const editsMatch = output.match(/<B_Edits>([\s\S]*?)<\/B_Edits>/);
                if (editsMatch) {
                    variables[`${nodeId}_edits`] = editsMatch[1].trim();
                }

                // Extract <B_Reasoning> content
                const reasoningMatch = output.match(/<B_Reasoning>([\s\S]*?)<\/B_Reasoning>/);
                if (reasoningMatch) {
                    variables[`${nodeId}_reasoning`] = reasoningMatch[1].trim();
                }
            }
        }

        // Debug: Log template variables
        console.log('Template variables keys:', Object.keys(variables));
        for (const [key, value] of Object.entries(variables)) {
            if (typeof value === 'string') {
                console.log(`${key}: ${value.length} characters`);
            }
        }

        return variables;
    }

    private processPromptTemplate(template: string, variables: Record<string, any>): string {
        let processed = template;

        // Replace variables in the format {variableName}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            processed = processed.replace(regex, String(value));
        }

        return processed;
    }

    validateWorkflow(workflow: Workflow): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check for input node
        const inputNodes = workflow.nodes.filter(node => node.type === 'input');
        if (inputNodes.length === 0) {
            errors.push('Workflow must have at least one input node');
        } else if (inputNodes.length > 1) {
            errors.push('Workflow can only have one input node');
        }

        // Check for output node
        const outputNodes = workflow.nodes.filter(node => node.type === 'output');
        if (outputNodes.length === 0) {
            errors.push('Workflow must have at least one output node');
        }

        // Check for disconnected nodes
        const connectedNodes = new Set<string>();
        workflow.edges.forEach(edge => {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        });

        const disconnectedNodes = workflow.nodes.filter(
            node => !connectedNodes.has(node.id) && workflow.nodes.length > 1
        );

        if (disconnectedNodes.length > 0) {
            errors.push(`Disconnected nodes found: ${disconnectedNodes.map(n => n.id).join(', ')}`);
        }

        // Check for cycles (basic check)
        if (this.hasCycles(workflow.nodes, workflow.edges)) {
            errors.push('Workflow contains cycles');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private hasCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycleUtil = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                return true;
            }

            if (visited.has(nodeId)) {
                return false;
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoingEdges = edges.filter(edge => edge.source === nodeId);
            for (const edge of outgoingEdges) {
                if (hasCycleUtil(edge.target)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of nodes) {
            if (hasCycleUtil(node.id)) {
                return true;
            }
        }

        return false;
    }
}

export const workflowEngine = new WorkflowExecutionEngine(); 