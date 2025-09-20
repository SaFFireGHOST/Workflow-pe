// src/models/WorkflowNode.ts

export type NodeType = 'start' | 'end' | 'llm' | 'tool' | 'interrupt' | 'userInput';

// Base interface for data attached to a node.
export interface NodeData {
  label?: string;
  description?: string;
  config?: NodeConfig;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}


// --- CONFIGURATION CLASSES ---
// These classes hold non-input settings, like UI properties or execution metadata (e.g., timeouts, retries).
// For now, they are minimal, providing a clean structure for future features.

export abstract class BaseNodeConfig {
  abstract getConfigType(): string;
}

export class LLMNodeConfig extends BaseNodeConfig {
  // This class is intentionally sparse. All operational parameters are now in `node.data.inputs`.
  // You could add UI-specific properties here later, e.g., `nodeColor: string = '#A1A1AA';`
  constructor(config?: Partial<LLMNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'llm'; }
}

export class ToolNodeConfig extends BaseNodeConfig {
  // Also intentionally sparse. Tool parameters are in `node.data.inputs`.
  constructor(config?: Partial<ToolNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'tool'; }
}

export class InterruptNodeConfig extends BaseNodeConfig {
  constructor(config?: Partial<InterruptNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'interrupt'; }
}

export class InputNodeConfig extends BaseNodeConfig {
  constructor(config?: Partial<InputNodeConfig>) {
    super();
    if (config) Object.assign(this, config);
  }

  getConfigType(): string { return 'userInput'; }
}

export type NodeConfig = LLMNodeConfig | ToolNodeConfig | InterruptNodeConfig | InputNodeConfig; 


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

  /**
   * Initializes the inputs and outputs for a node based on its type.
   * This ensures every node is created with a complete and correct data structure.
   */
  private initializeNodeData(type: NodeType, data: NodeData): NodeData {
    const inputs: Record<string, any> = {};
    const outputs: Record<string, any> = {};

    switch (type) {
      case 'start':
        outputs['value'] = 'string';
        break;
      case 'llm':
        // All operational parameters are now defined as default inputs.
        inputs['api_key'] = '';
        inputs['model'] = 'gpt-4';
        inputs['temperature'] = 0.7;
        inputs['max_tokens'] = 1024;
        inputs['system_prompt'] = 'You are a helpful assistant.';
        inputs['user_prompt'] = '';
        inputs['context'] = ''; // This is the dynamic input that will come from another node.
        outputs['summary'] = 'string';
        break;
      case 'tool':
        // All tool parameters are now defined as default inputs.
        inputs['tool_type'] = 'API'; // e.g., 'API', 'Function', 'Plugin'
        inputs['endpoint'] = '';
        inputs['method'] = 'GET';
        inputs['headers'] = '{}'; // Stored as a JSON string
        inputs['payload'] = '{}'; // Stored as a JSON string
        outputs['result'] = 'string'; // The output of the tool call
        break;
      case 'interrupt':
        // All interrupt parameters are now defined as default inputs.
        inputs['message'] = 'User input required.';
        inputs['timeout'] = 300; // in seconds
        inputs['priority'] = 'medium';
        inputs['requires_approval'] = false;
        // This is the dynamic input that comes from another node.
        inputs['string'] = ''; 
        outputs['value'] = 'string';
        break;
    }

    // Preserve any existing data while applying the new defaults for inputs/outputs if they don't exist.
    return { ...data, inputs: data.inputs || inputs, outputs: data.outputs || outputs };
  }

  isStartNode(): boolean { return this.type === 'start'; }
  isEndNode(): boolean { return this.type === 'end'; }

  getConfig<T extends BaseNodeConfig>(): T | undefined {
    return this.data.config as T | undefined;
  }
  
  /**
   * Creates a deep copy of the node, correctly re-instantiating the config class.
   */
  clone(): WorkflowNode {
    let clonedConfig: NodeConfig | undefined;

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
        case 'userInput':
          clonedConfig = new InputNodeConfig(configData as InputNodeConfig);
          break;  
      }
    }
    
    // Create a deep copy of the data object
    const clonedData = { 
      ...this.data,
      config: clonedConfig,
      inputs: this.data.inputs ? { ...this.data.inputs } : undefined,
      outputs: this.data.outputs ? { ...this.data.outputs } : undefined
    };
    
    return new WorkflowNode(this.id, this.type, { ...this.position }, clonedData);
  }

  /**
   * Returns a new WorkflowNode instance with updated data.
   */
  updateData(newData: Partial<NodeData>): WorkflowNode {
    return new WorkflowNode(this.id, this.type, this.position, { ...this.data, ...newData });
  }

  /**
   * Returns a new WorkflowNode instance with an updated position.
   */
  updatePosition(newPosition: { x: number; y: number }): WorkflowNode {
    return new WorkflowNode(this.id, this.type, newPosition, this.data);
  }
}