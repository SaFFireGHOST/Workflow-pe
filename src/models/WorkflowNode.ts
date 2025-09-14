export type NodeType = 'start' | 'end' | 'llm' | 'tool' | 'interrupt';

export interface NodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  config?: Record<string, any>;
}

// Base class for all specialized node configurations
export abstract class BaseNodeConfig {
  abstract getConfigType(): string;
  abstract validate(): boolean;
}

// LLM Node Configuration
export class LLMNodeConfig extends BaseNodeConfig {
  apiKey: string = '';
  model: string = 'gpt-3.5-turbo';
  temperature: number = 0.7;
  maxTokens: number = 2048;
  systemPrompt: string = '';

  constructor(config?: Partial<LLMNodeConfig>) {
    super();
    if (config) {
      Object.assign(this, config);
    }
  }

  getConfigType(): string {
    return 'llm';
  }

  validate(): boolean {
    return this.apiKey.length > 0 && this.maxTokens > 0 && this.temperature >= 0 && this.temperature <= 2;
  }
}

// Tool Node Configuration
export class ToolNodeConfig extends BaseNodeConfig {
  toolName: 'api_call' | 'database_query' | 'custom_code' | 'file_operation' | 'email_send' = 'api_call';
  apiEndpoint: string = '';
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
  databaseConnection: string = '';
  customCode: string = '';
  description: string = '';
  parameters: Record<string, any> = {};

  constructor(config?: Partial<ToolNodeConfig>) {
    super();
    if (config) {
      Object.assign(this, config);
    }
  }

  getConfigType(): string {
    return 'tool';
  }

  validate(): boolean {
    switch (this.toolName) {
      case 'api_call':
        return this.apiEndpoint.length > 0;
      case 'database_query':
        return this.databaseConnection.length > 0;
      case 'custom_code':
        return this.customCode.length > 0;
      default:
        return true;
    }
  }
}

// Interrupt Node Configuration
export class InterruptNodeConfig extends BaseNodeConfig {
  message: string = 'Please provide input';
  timeout: number = 300;
  allowedResponses: string[] = ['yes', 'no'];
  requiresApproval: boolean = false;
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

  constructor(config?: Partial<InterruptNodeConfig>) {
    super();
    if (config) {
      Object.assign(this, config);
    }
  }

  getConfigType(): string {
    return 'interrupt';
  }

  validate(): boolean {
    return this.message.length > 0 && this.timeout > 0 && this.allowedResponses.length > 0;
  }
}

// Specialized node data interfaces
export interface LLMNodeData extends NodeData {
  config?: LLMNodeConfig;
}

export interface ToolNodeData extends NodeData {
  config?: ToolNodeConfig;
}

export interface InterruptNodeData extends NodeData {
  config?: InterruptNodeConfig;
}

export class WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;

  constructor(
    id: string,
    type: NodeType,
    position: { x: number; y: number },
    data: NodeData
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.data = data;
  }

  // Method to update node data
  updateData(newData: Partial<NodeData>): WorkflowNode {
    return new WorkflowNode(
      this.id,
      this.type,
      this.position,
      { ...this.data, ...newData }
    );
  }

  // Method to update node position
  updatePosition(newPosition: { x: number; y: number }): WorkflowNode {
    return new WorkflowNode(
      this.id,
      this.type,
      newPosition,
      this.data
    );
  }

  // Method to check if node is a start node
  isStartNode(): boolean {
    return this.type === 'start';
  }

  // Method to check if node is an end node
  isEndNode(): boolean {
    return this.type === 'end';
  }

  // Method to create a copy of the node
  clone(): WorkflowNode {
    return new WorkflowNode(
      this.id,
      this.type,
      { ...this.position },
      { ...this.data }
    );
  }
}
