// Input/Output Variable System inspired by Langflow
export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'any' | 'foreign';

export interface IOPort {
  id: string;
  name: string;
  dataType: DataType;
  required?: boolean;
  defaultValue?: any;
  description?: string;
  isTemplate?: boolean; // For template variables like $config.api_key
}

export interface InputPort extends IOPort {
  value?: any;
  connectedTo?: string; // Reference to output port: "nodeId.outputName"
}

export interface OutputPort extends IOPort {
  value?: any;
}

export interface NodeIOConfig {
  inputs: { [key: string]: InputPort };
  outputs: { [key: string]: OutputPort };
}

// Base class for node I/O configuration
export abstract class BaseNodeIOConfig {
  abstract getInputPorts(): { [key: string]: InputPort };
  abstract getOutputPorts(): { [key: string]: OutputPort };
  
  // Validate that all required inputs are connected or have values
  validateInputs(): { valid: boolean; errors: string[] } {
    const inputs = this.getInputPorts();
    const errors: string[] = [];
    
    Object.entries(inputs).forEach(([name, port]) => {
      if (port.required && !port.value && !port.connectedTo) {
        errors.push(`Required input '${name}' is not connected or has no value`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Get input value, resolving references if needed
  getInputValue(inputName: string, context?: { [nodeId: string]: any }): any {
    const inputs = this.getInputPorts();
    const input = inputs[inputName];
    
    if (!input) return undefined;
    
    // If connected to another node's output
    if (input.connectedTo && context) {
      const [nodeId, outputName] = input.connectedTo.split('.');
      return context[nodeId]?.[outputName];
    }
    
    return input.value;
  }
}

// LLM Node I/O Configuration
export class LLMNodeIOConfig extends BaseNodeIOConfig {
  getInputPorts(): { [key: string]: InputPort } {
    return {
      api_key: {
        id: 'api_key',
        name: 'API Key',
        dataType: 'string',
        required: true,
        description: 'LLM API key for authentication',
        isTemplate: true,
        defaultValue: '$config.llm_api_key'
      },
      model: {
        id: 'model',
        name: 'Model',
        dataType: 'string',
        required: true,
        description: 'LLM model to use',
        isTemplate: true,
        defaultValue: '$config.llm_model'
      },
      system_prompt: {
        id: 'system_prompt',
        name: 'System Prompt',
        dataType: 'string',
        required: false,
        description: 'System instructions for the LLM'
      },
      user_prompt: {
        id: 'user_prompt',
        name: 'User Prompt',
        dataType: 'string',
        required: false,
        description: 'User message or question'
      },
      context: {
        id: 'context',
        name: 'Context',
        dataType: 'string',
        required: false,
        description: 'Additional context for the LLM'
      },
      temperature: {
        id: 'temperature',
        name: 'Temperature',
        dataType: 'number',
        required: false,
        defaultValue: 0.7,
        description: 'Controls randomness in output'
      },
      max_tokens: {
        id: 'max_tokens',
        name: 'Max Tokens',
        dataType: 'number',
        required: false,
        defaultValue: 2048,
        description: 'Maximum tokens to generate'
      }
    };
  }

  getOutputPorts(): { [key: string]: OutputPort } {
    return {
      response: {
        id: 'response',
        name: 'Response',
        dataType: 'string',
        description: 'LLM generated response'
      },
      summary: {
        id: 'summary',
        name: 'Summary',
        dataType: 'string',
        description: 'Generated summary (alias for response)'
      },
      tokens_used: {
        id: 'tokens_used',
        name: 'Tokens Used',
        dataType: 'number',
        description: 'Number of tokens consumed'
      }
    };
  }
}

// Tool Node I/O Configuration
export class ToolNodeIOConfig extends BaseNodeIOConfig {
  constructor(private toolType: string = 'api_call') {
    super();
  }

  getInputPorts(): { [key: string]: InputPort } {
    const commonPorts = {
      input_data: {
        id: 'input_data',
        name: 'Input Data',
        dataType: 'any' as DataType,
        required: false,
        description: 'Data to process'
      }
    };

    switch (this.toolType) {
      case 'youtube':
        return {
          ...commonPorts,
          video_url: {
            id: 'video_url',
            name: 'Video URL',
            dataType: 'string',
            required: true,
            description: 'YouTube video URL'
          },
          api_key: {
            id: 'api_key',
            name: 'API Key',
            dataType: 'string',
            required: true,
            description: 'YouTube API key',
            isTemplate: true,
            defaultValue: '$config.youtube_api_key'
          }
        };
      
      case 'api_call':
        return {
          ...commonPorts,
          endpoint: {
            id: 'endpoint',
            name: 'API Endpoint',
            dataType: 'string',
            required: true,
            description: 'API endpoint URL'
          },
          method: {
            id: 'method',
            name: 'HTTP Method',
            dataType: 'string',
            required: false,
            defaultValue: 'GET',
            description: 'HTTP method'
          },
          headers: {
            id: 'headers',
            name: 'Headers',
            dataType: 'object',
            required: false,
            description: 'HTTP headers'
          },
          payload: {
            id: 'payload',
            name: 'Payload',
            dataType: 'object',
            required: false,
            description: 'Request payload'
          }
        };
      
      default:
        return commonPorts;
    }
  }

  getOutputPorts(): { [key: string]: OutputPort } {
    const commonPorts = {
      output: {
        id: 'output',
        name: 'Output',
        dataType: 'any' as DataType,
        description: 'Tool output'
      },
      status: {
        id: 'status',
        name: 'Status',
        dataType: 'string' as DataType,
        description: 'Execution status'
      }
    };

    switch (this.toolType) {
      case 'youtube':
        return {
          ...commonPorts,
          transcript: {
            id: 'transcript',
            name: 'Transcript',
            dataType: 'string',
            description: 'Extracted video transcript'
          }
        };
      
      case 'api_call':
        return {
          ...commonPorts,
          response: {
            id: 'response',
            name: 'Response',
            dataType: 'object',
            description: 'API response'
          },
          status_code: {
            id: 'status_code',
            name: 'Status Code',
            dataType: 'number',
            description: 'HTTP status code'
          }
        };
      
      default:
        return commonPorts;
    }
  }
}

// Interrupt Node I/O Configuration
export class InterruptNodeIOConfig extends BaseNodeIOConfig {
  getInputPorts(): { [key: string]: InputPort } {
    return {
      message: {
        id: 'message',
        name: 'Message',
        dataType: 'string',
        required: true,
        description: 'Message to display to user'
      },
      default_value: {
        id: 'default_value',
        name: 'Default Value',
        dataType: 'string',
        required: false,
        description: 'Default input value'
      }
    };
  }

  getOutputPorts(): { [key: string]: OutputPort } {
    return {
      string: {
        id: 'string',
        name: 'User Input',
        dataType: 'string',
        description: 'User provided input'
      },
      value: {
        id: 'value',
        name: 'Value',
        dataType: 'string',
        description: 'User input value (alias for string)'
      }
    };
  }
}

// Start Node I/O Configuration
export class StartNodeIOConfig extends BaseNodeIOConfig {
  getInputPorts(): { [key: string]: InputPort } {
    return {}; // Start nodes typically have no inputs
  }

  getOutputPorts(): { [key: string]: OutputPort } {
    return {
      trigger: {
        id: 'trigger',
        name: 'Trigger',
        dataType: 'boolean',
        description: 'Workflow start trigger'
      }
    };
  }
}

// End Node I/O Configuration
export class EndNodeIOConfig extends BaseNodeIOConfig {
  getInputPorts(): { [key: string]: InputPort } {
    return {
      result: {
        id: 'result',
        name: 'Result',
        dataType: 'any',
        required: false,
        description: 'Final workflow result'
      }
    };
  }

  getOutputPorts(): { [key: string]: OutputPort } {
    return {}; // End nodes typically have no outputs
  }
}

// Input Node I/O Configuration (for interrupt-style inputs)
export class InputNodeIOConfig extends BaseNodeIOConfig {
  getInputPorts(): { [key: string]: InputPort } {
    return {
      string: {
        id: 'string',
        name: 'Input String',
        dataType: 'string',
        required: false,
        description: 'Input from interrupt or user'
      }
    };
  }

  getOutputPorts(): { [key: string]: OutputPort } {
    return {
      value: {
        id: 'value',
        name: 'Value',
        dataType: 'string',
        description: 'Output value'
      }
    };
  }
}

// Factory to create I/O configurations
export class IOConfigFactory {
  static createIOConfig(nodeType: string, subType?: string): BaseNodeIOConfig {
    switch (nodeType) {
      case 'llm':
        return new LLMNodeIOConfig();
      case 'tool':
        return new ToolNodeIOConfig(subType || 'api_call');
      case 'interrupt':
        return new InterruptNodeIOConfig();
      case 'start':
        return new StartNodeIOConfig();
      case 'end':
        return new EndNodeIOConfig();
      case 'input':
        return new InputNodeIOConfig();
      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  }
}