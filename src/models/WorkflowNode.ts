// src/models/WorkflowNode.ts

export type NodeType = 'start' | 'end' | 'llm' | 'tool' | 'interrupt';

// Base interface for data attached to a node
export interface NodeData {
  label: string;
  description: string;
  config?: NodeConfig;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

// --- CONFIGURATION CLASSES ---

export abstract class BaseNodeConfig {
  abstract getConfigType(): string;
}

export class LLMNodeConfig extends BaseNodeConfig {
  model: string = 'gpt-4';
  temperature: number = 0.7;
  maxTokens: number = 1024;

  constructor(config?: Partial<LLMNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'llm'; }
}

export class ToolNodeConfig extends BaseNodeConfig {
  toolName: string = '';
  parameters: Record<string, any> = {};

  constructor(config?: Partial<ToolNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'tool'; }
}

export class InterruptNodeConfig extends BaseNodeConfig {
  prompt: string = 'User input required';
  timeout: number = 60; // in seconds

  constructor(config?: Partial<InterruptNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'interrupt'; }
}

export type NodeConfig = LLMNodeConfig | ToolNodeConfig | InterruptNodeConfig;


// --- MAIN WORKFLOW NODE CLASS ---

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
    this.data = this.initializeNodeData(type, data);
  }

  private initializeNodeData(type: NodeType, data: NodeData): NodeData {
    const inputs: Record<string, any> = {};
    const outputs: Record<string, any> = {};

    switch (type) {
      case 'start':
        outputs['value'] = 'string';
        break;
      case 'llm':
        inputs['context'] = '';
        outputs['summary'] = 'string';
        break;
      case 'tool':
        outputs['result'] = 'string';
        break;
      case 'interrupt':
        inputs['string'] = '$interrupt.string';
        outputs['value'] = 'string';
        break;
    }

    return { ...data, inputs: data.inputs || inputs, outputs: data.outputs || outputs };
  }

  isStartNode(): boolean { return this.type === 'start'; }
  isEndNode(): boolean { return this.type === 'end'; }

  getConfig<T extends BaseNodeConfig>(): T | undefined {
    return this.data.config as T | undefined;
  }
  
  clone(): WorkflowNode {
    let clonedConfig: NodeConfig | undefined;

    // Correctly re-instantiate the config class
    if (this.data.config) {
      const configData = { ...this.data.config };
      switch (this.type) {
        case 'llm':
          clonedConfig = new LLMNodeConfig(configData as LLMNodeConfig);
          break;
        case 'tool':
          clonedConfig = new ToolNodeConfig(configData as ToolNodeConfig);
          break;
        case 'interrupt':
          clonedConfig = new InterruptNodeConfig(configData as InterruptNodeConfig);
          break;
      }
    }
    
    const clonedData = { ...this.data, config: clonedConfig };
    
    return new WorkflowNode(this.id, this.type, { ...this.position }, clonedData);
  }

  updateData(newData: Partial<NodeData>): WorkflowNode {
    return new WorkflowNode(this.id, this.type, this.position, { ...this.data, ...newData });
  }

  updatePosition(newPosition: { x: number; y: number }): WorkflowNode {
    return new WorkflowNode(this.id, this.type, newPosition, this.data);
  }
}