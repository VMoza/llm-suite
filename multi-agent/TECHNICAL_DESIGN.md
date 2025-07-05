# Multi-Agent LLM Orchestration Platform - Technical Design Document

## Executive Summary

A platform that enables users to create complex workflows by chaining multiple state-of-the-art LLMs together through a visual drag-and-drop interface. The system processes prompts through configurable LLM sequences before delivering optimized outputs.

## Recent Implementation Milestones (2024)

### Backend Workflow Chaining & Debugging (COMPLETED)

- **Node-Based Workflow Execution:**
  - The backend supports execution of workflows as a sequence of nodes (input → LLM(s) → output), with each node able to receive the original prompt and outputs from previous nodes.
  - Prompt chaining is implemented so that each LLM node can reference both the original input and the output of any previous node using template variables (e.g., `{input}`, `{llm-1}`).

- **Per-Node Debugging:**
  - The workflow execution engine now collects detailed debug information for each node, including:
    - The prompt sent to the LLM
    - The output received
    - Any extracted recommendations or reasoning (e.g., from `<B_Edits>`, `<B_Reasoning>` tags)
  - This debug info is returned to the frontend as a `nodeDebug` array, enabling full transparency and step-by-step inspection in the UI.

- **Frontend Debug UI:**
  - The workflow test interface now includes a "Show Debug" toggle, which displays the prompt, output, and extracted recommendations/reasoning for each node in the workflow.
  - This allows users to visually trace the flow of data and logic through the workflow, making it much easier to debug and improve prompt chaining.

- **Improved Prompt Chaining Logic:**
  - The workflow definition and execution logic were updated so that refinement chains work as intended:
    - Node 1 generates a base document.
    - Node 2 reviews and suggests improvements, outputting recommendations and reasoning in tagged sections.
    - Node 3 receives both the original document and the recommendations/reasoning, and is prompted to revise the original document by integrating the suggestions, outputting the improved, complete document.
  - This pattern enables iterative, multi-step LLM workflows that can be easily extended or modified.

### Implementation Notes & Recommendations for Future LLM Iterations

- **Prompt Variable Substitution:**
  - Template variables (e.g., `{input}`, `{llm-1}`, `{llm-2_edits}`) are substituted at runtime, allowing flexible chaining and context passing between nodes.
  - For more advanced workflows, consider supporting richer variable extraction and passing (e.g., structured JSON outputs, multi-field extraction).

- **Debugging & Transparency:**
  - Per-node debug info is essential for diagnosing workflow issues and improving prompt engineering.
  - Future LLM workflows should always expose node-level debug data, including raw prompts, outputs, and any intermediate reasoning or edits.

- **Extensibility:**
  - The current architecture supports easy addition of new node types (e.g., transforms, branching, custom logic) and new LLM providers.
  - The prompt chaining and debug logic are designed to be provider-agnostic.

- **Frontend/Backend Sync:**
  - The frontend expects a `nodeDebug` array in the workflow execution response; backend and frontend must remain in sync on this contract for debugging to work.

- **Recommendations for Next Iterations:**
  - Consider moving more of the prompt variable extraction and chaining logic to the backend for consistency and maintainability.
  - Add support for branching, parallel execution, and more complex data flows in the workflow engine.
  - Expand the debug UI to show token usage, cost per node, and raw API responses for deeper analysis.
  - Continue to iterate on prompt engineering patterns for multi-step refinement chains.

## System Architecture Overview

### Core Components
1. **LLM Wrapper Layer** - Unified interface for all supported LLMs
2. **Workflow Engine** - Executes node sequences and manages data flow
3. **Visual Editor** - Drag-and-drop interface for creating workflows
4. **Template Library** - Pre-built workflow templates
5. **User Management** - Authentication, API key management, subscriptions
6. **Execution Runtime** - Handles workflow execution and monitoring

### Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Payment**: Stripe
- **Hosting**: Vercel
- **State Management**: Zustand
- **Workflow Visualization**: React Flow
- **Authentication**: NextAuth.js with Supabase
- **Testing**: Jest, Vitest, Playwright
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Vercel Analytics

## Development Phases

### Phase 1: Project Setup & Foundation
**Goal**: Get basic project structure and LLM wrappers working

#### ✅ 1.1 Project Setup (COMPLETED)
- ✅ Initialize Next.js 14 project with TypeScript
- ✅ Set up Tailwind CSS
- ✅ Install core dependencies
- ✅ Create basic project structure
- ✅ Basic error handling system

#### ✅ 1.2 Core Interfaces (COMPLETED)
```typescript
interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  execute(prompt: string, config: LLMConfig): Promise<LLMResponse>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  executionTime: number;
}

interface WorkflowNode {
  id: string;
  type: 'llm' | 'input' | 'output' | 'transform';
  position: { x: number; y: number };
  data: any;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
```

#### 1.3 Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table (encrypted)
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  user_id UUID REFERENCES users(id),
  input_prompt TEXT NOT NULL,
  output_result TEXT,
  execution_time_ms INTEGER,
  total_cost DECIMAL(10,6),
  status VARCHAR(50) DEFAULT 'running',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### ✅ 1.4 LLM Provider Implementation (COMPLETED)
Build wrappers for:
1. ✅ OpenAI (GPT-4, GPT-3.5-turbo)
2. ✅ Anthropic Claude (Claude-3.5-sonnet, Claude-3-haiku)
3. ⏳ Google Gemini (Gemini-1.5-pro, Gemini-1.5-flash) - TODO
4. ⏳ DeepSeek (DeepSeek-V2) - TODO

### ✅ Phase 2: Workflow Engine (COMPLETED)
**Goal**: Build the core workflow execution engine

#### ✅ 2.1 Execution Engine (COMPLETED)
Build basic execution engine that:
- ✅ Takes a workflow and input prompt
- ✅ Executes nodes in sequence
- ✅ Handles errors gracefully
- ✅ Returns final output
- ✅ Cost tracking and execution metrics
- ✅ Workflow validation

#### ✅ 2.2 Prompt Processing (COMPLETED)
Basic prompt cleaning and validation:
- ✅ Template variable substitution
- ✅ Prompt processing pipeline
- ✅ Basic error handling

### 🚧 Phase 3: Visual Editor (CURRENT FOCUS)
**Goal**: Create drag-and-drop workflow builder

#### 3.1 React Flow Integration (NEXT)
Build visual workflow editor with:
- ⏳ Drag and drop nodes (LLM providers, input, output)
- ⏳ Connect nodes with edges  
- ⏳ Basic node configuration panels
- ⏳ Save/load workflows

#### 3.2 UI Components (NEXT)
- ⏳ Node library sidebar
- ⏳ Workflow canvas
- ⏳ Configuration panels
- ⏳ Execution controls
- ⏳ Results display

### Phase 4: Template Library & User Features
**Goal**: Build template system and user management

#### 4.1 Template System
- Create template library with curated workflows
- Template categories and tags
- Template sharing and public/private settings

#### 4.2 User Dashboard
- Workflow management
- Execution history
- Usage analytics
- API key management
- Billing information

#### 4.3 Subscription Management
- Stripe integration for payments
- Usage-based billing
- Feature gating (free vs paid)

### Phase 5: Production Deployment
**Goal**: Deploy the working product

#### 5.1 Basic Security & Performance
- API key encryption
- Rate limiting
- Input validation
- Error handling

#### 5.2 Deployment
- Deploy to Vercel (SaaS version)
- Set up Supabase database
- Configure environment variables
- Basic monitoring

## API Design

### Core Endpoints
```typescript
// Workflow Management
POST /api/workflows - Create workflow
GET /api/workflows - List user workflows
GET /api/workflows/:id - Get workflow details
PUT /api/workflows/:id - Update workflow
DELETE /api/workflows/:id - Delete workflow

// Workflow Execution
POST /api/workflows/:id/execute - Execute workflow
GET /api/executions/:id - Get execution details

// Templates
GET /api/templates - List public templates
POST /api/templates - Create template
GET /api/templates/:id - Get template details

// User Management
POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/user/profile - Get user profile
PUT /api/user/api-keys - Update API keys
GET /api/user/usage - Get usage statistics
```

## Deployment Strategy

### Open Source Version
- Single Docker container
- Local database (PostgreSQL)
- Environment variable configuration
- Documentation for self-hosting

### SaaS Version
- Vercel deployment
- Supabase managed database
- Environment variables for API keys and secrets

## Next Steps

1. **Phase 1**: Set up Next.js project and implement LLM wrappers
2. **Phase 2**: Build workflow execution engine
3. **Phase 3**: Create visual editor with React Flow
4. **Phase 4**: Add template library and user management
5. **Phase 5**: Deploy to production

This design focuses on getting a working product deployed quickly while maintaining clean, maintainable code. 