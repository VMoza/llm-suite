# Multi-Agent LLM Orchestration Platform - Technical Design Document

## Executive Summary

A platform that enables users to create complex workflows by chaining multiple state-of-the-art LLMs together through a visual drag-and-drop interface. The system processes prompts through configurable LLM sequences before delivering optimized outputs.

## Recent Implementation Milestones (2024)

### ✅ Unified Workflow Studio (COMPLETED - MAJOR MILESTONE)

- **Seamless Visual Editor + Test Interface:**
  - Created a unified interface that combines visual workflow building with real-time testing capabilities
  - Users can now build workflows visually AND execute them in the same interface
  - Left sidebar: Node library, API keys, node configuration, and test controls
  - Center canvas: Visual workflow editor with drag-and-drop functionality
  - Right sidebar: Debug information (on by default) and final output (separate panels)

- **Robust Workflow Chaining Engine:**
  - **FIXED CRITICAL CHAINING ISSUE:** The execution engine now properly passes all previous node outputs to each node's prompt template processing
  - Enhanced template variable system supports: `{input}`, `{llm-1}`, `{llm-2}`, `{llm-2_edits}`, `{llm-2_reasoning}`, etc.
  - Automatic extraction of tagged content from LLM outputs (e.g., `<B_Edits>`, `<B_Reasoning>`)
  - Context-aware prompt processing that maintains the full execution history

- **Advanced Debug & Output Separation:**
  - Debug information is now on by default and displayed in a dedicated middle panel
  - Final output is cleanly separated in the rightmost panel
  - Step-by-step execution tracking with detailed prompt/output inspection
  - Real-time cost and execution time monitoring

- **Interactive Node Configuration:**
  - Click any node to configure its properties in the left sidebar
  - Support for different LLM providers (OpenAI, Anthropic)
  - Model selection, prompt templates, temperature, max tokens, etc.
  - Visual feedback with node selection highlighting

- **Production-Ready Workflow Execution:**
  - Air-tight chaining logic that properly propagates context between nodes
  - Robust error handling and execution status tracking
  - Template variable substitution with full context awareness
  - Support for complex multi-step refinement workflows

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

## 🚨 CRITICAL ISSUES TO RESOLVE

### Issue #1: Final Output Formatting & Display Problem
**Status**: CRITICAL - Needs immediate attention  
**Discovered**: 2024-12-XX  
**Description**: The workflow execution engine is functioning correctly (chaining works, LLMs execute properly), but the final output display is showing incorrect content fragments instead of the complete final response.

**Evidence**:
- Debug logs show proper LLM execution with correct output lengths (1521 → 1684 → 2106 characters)
- Individual node outputs in debug panel show complete responses
- Final output panel shows only a fragment from the middle of the last response
- Template variable substitution is working correctly
- All LLM API calls are successful with proper chaining

**Root Cause Hypotheses**:
1. **Output Processing Issue**: The final output extraction/processing may be corrupted
2. **Model-Specific Issue**: GPT-4o-mini may have inconsistent output formatting that breaks parsing
3. **Unstructured Output Problem**: LLM responses are unstructured text, making reliable extraction difficult

**Immediate Actions Required**:
1. **Test with Different Models**: Try Claude-3.5-sonnet, GPT-4o, or other models to isolate if this is model-specific
2. **Implement Structured Output Format**: Instruct LLMs to format responses with clear delimiters:
   ```
   <output>
   [Main response content here]
   </output>
   
   <reasoning>
   [Optional reasoning/explanation]
   </reasoning>
   ```
3. **Add Output Parsing Logic**: Create robust parsing to extract content from structured tags
4. **Enhanced Debug Logging**: Add more granular logging around final output processing

**Technical Implementation**:
- Modify prompt templates to include output structure instructions
- Add parsing logic in execution engine to extract `<output>` content
- Fallback to raw response if structured parsing fails
- Test across multiple LLM providers to ensure consistency

**Priority**: HIGH - This breaks the core user experience of seeing final workflow results

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

### ✅ Phase 3: Unified Workflow Studio (COMPLETED)
**Goal**: Create seamless visual workflow builder with integrated testing

#### ✅ 3.1 Unified Interface (COMPLETED)
- **Complete overhaul:** Merged visual editor and test interface into a single, seamless experience
- **Three-panel layout:** Left sidebar (controls/config), center canvas (visual editor), right sidebar (debug/output)
- **Production-ready workflow builder:** Drag-and-drop nodes, visual connections, real-time configuration
- **Integrated testing:** Build workflows visually, then execute them immediately in the same interface
- **Code:** See `src/app/workflow/page.tsx` for the unified implementation

#### ✅ 3.2 Advanced Node System (COMPLETED)
- **Interactive node configuration:** Click any node to configure its properties in the left sidebar
- **Multi-provider support:** OpenAI, Anthropic with model selection
- **Template system:** Advanced prompt templates with variable substitution
- **Visual feedback:** Node selection highlighting, provider/model display on nodes
- **Drag-and-drop:** Intuitive node creation from sidebar library

#### ✅ 3.3 Execution & Debug Integration (COMPLETED)
- **Real-time execution:** Execute workflows directly from the editor
- **Comprehensive debugging:** Step-by-step execution tracking with full prompt/output visibility
- **Separated output:** Clean final output panel separate from debug information
- **Cost tracking:** Real-time cost and execution time monitoring
- **Error handling:** Robust error display and workflow validation

**How to verify:**
- Visit `/workflow` in the running app
- Drag nodes onto canvas, connect them with edges
- Click nodes to configure (provider, model, prompt, etc.)
- Add API keys in left sidebar
- Execute workflow and see debug info + final output in right panels
- Modify node configurations and re-execute to see changes

**Key Features:**
- **Air-tight chaining:** Fixed critical issues with prompt variable substitution
- **Context awareness:** Each node receives full execution history
- **Template variables:** Support for `{input}`, `{llm-1}`, `{llm-2_edits}`, `{llm-2_reasoning}`, etc.
- **Debug by default:** Debug information always visible for transparency
- **Production ready:** Robust execution engine with comprehensive error handling

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