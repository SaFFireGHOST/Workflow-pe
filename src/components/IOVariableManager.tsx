import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowRight, Settings2 } from 'lucide-react';
import {
  InputPort,
  OutputPort,
  DataType
} from '../models/IOVariable';
import { useWorkflowContext } from '../context/workflowContext';

interface IOVariableManagerProps {
  nodeId: string;
  nodeType: string;
  onClose: () => void;
}

export const IOVariableManager: React.FC<IOVariableManagerProps> = ({
  nodeId,
  nodeType,
  onClose
}) => {
  const { currentWorkflow, updateNode } = useWorkflowContext();
  const [inputs, setInputs] = useState<{ [key: string]: InputPort }>({});
  const [outputs, setOutputs] = useState<{ [key: string]: OutputPort }>({});
  const [newInputName, setNewInputName] = useState('');
  const [newOutputName, setNewOutputName] = useState('');

  useEffect(() => {
    // Load existing I/O configuration or initialize with defaults
    const node = currentWorkflow?.nodes.find(n => n.id === nodeId);
    console.log('Loading IOVariableManager for node:', { nodeId, node, inputs: node?.data.inputs, outputs: node?.data.outputs });
    
    if (node?.data.inputs && node?.data.outputs && 
        typeof node.data.inputs === 'object' && typeof node.data.outputs === 'object') {
      // Convert array format to object format if needed
      let nodeInputs = node.data.inputs;
      let nodeOutputs = node.data.outputs;
      
      if (Array.isArray(nodeInputs)) {
        const inputsObj: { [key: string]: InputPort } = {};
        nodeInputs.forEach((input: any) => {
          inputsObj[input.name] = {
            id: `${nodeId}_input_${input.name}`,
            name: input.name,
            dataType: input.dataType || 'string',
            value: input.value,
            connectedTo: input.connectedTo,
            required: input.required || false,
            description: input.description || ''
          };
        });
        nodeInputs = inputsObj;
      }
      
      if (Array.isArray(nodeOutputs)) {
        const outputsObj: { [key: string]: OutputPort } = {};
        nodeOutputs.forEach((output: any) => {
          outputsObj[output.name] = {
            id: `${nodeId}_output_${output.name}`,
            name: output.name,
            dataType: output.dataType || 'string',
            description: output.description || ''
          };
        });
        nodeOutputs = outputsObj;
      }
      
      setInputs(nodeInputs as { [key: string]: InputPort });
      setOutputs(nodeOutputs as { [key: string]: OutputPort });
      console.log('Loaded existing I/O config:', { inputs: nodeInputs, outputs: nodeOutputs });
    } else {
      // Initialize with predefined variables based on node type
      const defaultInputs = getDefaultInputsForNodeType(nodeType);
      const defaultOutputs = getDefaultOutputsForNodeType(nodeType);
      setInputs(defaultInputs);
      setOutputs(defaultOutputs);
      console.log('Using default I/O config:', { inputs: defaultInputs, outputs: defaultOutputs });
    }
  }, [nodeId, nodeType, currentWorkflow]);

  const getDefaultInputsForNodeType = (nodeType: string): { [key: string]: InputPort } => {
    const defaults: { [key: string]: { [key: string]: InputPort } } = {
      llm: {
        model: {
          id: `${nodeId}_input_model`,
          name: 'model',
          dataType: 'string',
          required: true,
          description: 'LLM model to use',
          value: 'gpt-3.5-turbo'
        },
        api_key: {
          id: `${nodeId}_input_api_key`,
          name: 'api_key',
          dataType: 'string',
          required: true,
          description: 'API key for the LLM service',
          isTemplate: true
        },
        max_tokens: {
          id: `${nodeId}_input_max_tokens`,
          name: 'max_tokens',
          dataType: 'number',
          required: false,
          description: 'Maximum tokens to generate',
          value: 150
        },
        temperature: {
          id: `${nodeId}_input_temperature`,
          name: 'temperature',
          dataType: 'number',
          required: false,
          description: 'Temperature for randomness',
          value: 0.7
        },
        system_prompt: {
          id: `${nodeId}_input_system_prompt`,
          name: 'system_prompt',
          dataType: 'string',
          required: false,
          description: 'System prompt for the LLM'
        },
        user_prompt: {
          id: `${nodeId}_input_user_prompt`,
          name: 'user_prompt',
          dataType: 'string',
          required: true,
          description: 'User prompt/query for the LLM'
        },
        context: {
          id: `${nodeId}_input_context`,
          name: 'context',
          dataType: 'foreign',
          required: false,
          description: 'Additional context for the LLM'
        }
      },
      tool: {
        tool_name: {
          id: `${nodeId}_input_tool_name`,
          name: 'tool_name',
          dataType: 'string',
          required: true,
          description: 'Name of the tool to execute'
        },
        parameters: {
          id: `${nodeId}_input_parameters`,
          name: 'parameters',
          dataType: 'object',
          required: false,
          description: 'Parameters for the tool'
        }
      },
      interrupt: {
        message: {
          id: `${nodeId}_input_message`,
          name: 'message',
          dataType: 'string',
          required: true,
          description: 'Message to display to the user'
        },
        timeout: {
          id: `${nodeId}_input_timeout`,
          name: 'timeout',
          dataType: 'number',
          required: false,
          description: 'Timeout in seconds',
          value: 300
        }
      }
    };

    return defaults[nodeType] || {};
  };

  const getDefaultOutputsForNodeType = (nodeType: string): { [key: string]: OutputPort } => {
    const defaults: { [key: string]: { [key: string]: OutputPort } } = {
      llm: {
        response: {
          id: `${nodeId}_output_response`,
          name: 'response',
          dataType: 'string',
          description: 'Generated response from the LLM'
        }
      },
      tool: {
        result: {
          id: `${nodeId}_output_result`,
          name: 'result',
          dataType: 'any',
          description: 'Result from tool execution'
        }
      },
      interrupt: {
        user_input: {
          id: `${nodeId}_output_user_input`,
          name: 'user_input',
          dataType: 'string',
          description: 'User input received'
        }
      },
      start: {
        trigger: {
          id: `${nodeId}_output_trigger`,
          name: 'trigger',
          dataType: 'boolean',
          description: 'Workflow start trigger'
        }
      },
      end: {}
    };

    return defaults[nodeType] || {};
  };

  const getDataTypeColor = (dataType: DataType): string => {
    const colors: Record<string, string> = {
      'string': 'bg-blue-100 text-blue-800 border-blue-200',
      'number': 'bg-green-100 text-green-800 border-green-200',
      'boolean': 'bg-purple-100 text-purple-800 border-purple-200',
      'object': 'bg-orange-100 text-orange-800 border-orange-200',
      'array': 'bg-red-100 text-red-800 border-red-200',
      'file': 'bg-gray-100 text-gray-800 border-gray-200',
      'any': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'foreign': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[dataType] || colors['any'];
  };

  const getAvailableVariables = () => {
    if (!currentWorkflow) return [];
    
    const variables: any[] = [];
    
    currentWorkflow.nodes
      .filter((node: any) => node.id !== nodeId)
      .forEach((node: any) => {
        const nodeLabel = node.data.label || node.id;
        
        // Add outputs
        if (node.data.outputs) {
          let nodeOutputs = node.data.outputs;
          
          // Convert array format to get actual variable names
          if (Array.isArray(nodeOutputs)) {
            nodeOutputs.forEach((output: any) => {
              if (output && output.name) {
                variables.push({
                  nodeId: node.id,
                  nodeName: nodeLabel,
                  variableName: output.name,
                  variableType: 'output',
                  dataType: output.dataType || 'any',
                  reference: `$${node.id}.${output.name}`,
                  displayName: `${nodeLabel} → ${output.name} (output)`
                });
              }
            });
          } else if (typeof nodeOutputs === 'object') {
            Object.entries(nodeOutputs).forEach(([outputName, output]: [string, any]) => {
              variables.push({
                nodeId: node.id,
                nodeName: nodeLabel,
                variableName: output?.name || outputName,
                variableType: 'output',
                dataType: output?.dataType || 'any',
                reference: `$${node.id}.${output?.name || outputName}`,
                displayName: `${nodeLabel} → ${output?.name || outputName} (output)`
              });
            });
          }
        }
        
        // Add inputs
        if (node.data.inputs) {
          let nodeInputs = node.data.inputs;
          
          // Convert array format to get actual variable names
          if (Array.isArray(nodeInputs)) {
            nodeInputs.forEach((input: any) => {
              if (input && input.name) {
                variables.push({
                  nodeId: node.id,
                  nodeName: nodeLabel,
                  variableName: input.name,
                  variableType: 'input',
                  dataType: input.dataType || 'any',
                  reference: `$${node.id}.${input.name}`,
                  displayName: `${nodeLabel} → ${input.name} (input)`
                });
              }
            });
          } else if (typeof nodeInputs === 'object') {
            Object.entries(nodeInputs).forEach(([inputName, input]: [string, any]) => {
              variables.push({
                nodeId: node.id,
                nodeName: nodeLabel,
                variableName: input?.name || inputName,
                variableType: 'input',
                dataType: input?.dataType || 'any',
                reference: `$${node.id}.${input?.name || inputName}`,
                displayName: `${nodeLabel} → ${input?.name || inputName} (input)`
              });
            });
          }
        }
      });
      
    return variables;
  };

  const addInput = () => {
    if (!newInputName.trim()) return;
    
    const newInput: InputPort = {
      id: `${nodeId}_input_${newInputName}`,
      name: newInputName,
      dataType: 'any',
      required: false,
      description: ''
    };
    
    setInputs(prev => ({
      ...prev,
      [newInputName]: newInput
    }));
    setNewInputName('');
  };

  const addOutput = () => {
    if (!newOutputName.trim()) return;
    
    const newOutput: OutputPort = {
      id: `${nodeId}_output_${newOutputName}`,
      name: newOutputName,
      dataType: 'any',
      description: ''
    };
    
    setOutputs(prev => ({
      ...prev,
      [newOutputName]: newOutput
    }));
    setNewOutputName('');
  };

  const updateInput = (inputName: string, updates: Partial<InputPort>) => {
    setInputs(prev => ({
      ...prev,
      [inputName]: { ...prev[inputName], ...updates }
    }));
  };

  const updateOutput = (outputName: string, updates: Partial<OutputPort>) => {
    setOutputs(prev => ({
      ...prev,
      [outputName]: { ...prev[outputName], ...updates }
    }));
  };

  const deleteInput = (inputName: string) => {
    setInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[inputName];
      return newInputs;
    });
  };

  const deleteOutput = (outputName: string) => {
    setOutputs(prev => {
      const newOutputs = { ...prev };
      delete newOutputs[outputName];
      return newOutputs;
    });
  };

  const renderInputValueField = (inputName: string, input: InputPort) => {
    if (input.connectedTo) {
      return (
        <div className="flex items-center space-x-2">
          <ArrowRight className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-mono bg-blue-50 px-2 py-1 rounded">
            {input.connectedTo}
          </span>
          <button
            onClick={() => updateInput(inputName, { connectedTo: undefined })}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // For foreign data type, force connection selection
    if (input.dataType === 'foreign') {
      return (
        <div className="p-2 bg-pink-50 border border-pink-200 rounded text-sm text-pink-700">
          Foreign variables must be connected to another node's output. Use the connection selector below.
        </div>
      );
    }

    switch (input.dataType) {
      case 'string':
        return (
          <input
            type="text"
            value={input.value || ''}
            onChange={(e) => updateInput(inputName, { value: e.target.value })}
            placeholder="Enter string value"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={input.value || ''}
            onChange={(e) => updateInput(inputName, { value: parseFloat(e.target.value) || 0 })}
            placeholder="Enter number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
      case 'boolean':
        return (
          <select
            value={input.value || 'false'}
            onChange={(e) => updateInput(inputName, { value: e.target.value === 'true' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        );
      default:
        return (
          <textarea
            value={typeof input.value === 'string' ? input.value : JSON.stringify(input.value || '')}
            onChange={(e) => updateInput(inputName, { value: e.target.value })}
            placeholder="Enter value"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
    }
  };

  const renderConnectionSelector = (inputName: string) => {
    const availableVariables = getAvailableVariables();
    
    return (
      <div className="mt-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Connect to variable:
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              updateInput(inputName, { connectedTo: e.target.value, value: undefined });
            }
          }}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="">Select variable to connect...</option>
          {availableVariables.map((variable) => (
            <option key={variable.reference} value={variable.reference}>
              {variable.displayName} ({variable.dataType})
            </option>
          ))}
        </select>
      </div>
    );
  };

  const handleSave = () => {
    console.log('Saving I/O variables:', { nodeId, inputs, outputs });
    try {
      // Convert back to the format expected by the workflow
      const inputsArray = Object.values(inputs).map(input => ({
        name: input.name,
        dataType: input.dataType,
        value: input.value || '',
        reference: input.connectedTo || '',
        required: input.required || false,
        description: input.description || ''
      }));
      
      const outputsArray = Object.values(outputs).map(output => ({
        name: output.name,
        dataType: output.dataType,
        description: output.description || ''
      }));
      
      console.log('Converted arrays:', { inputsArray, outputsArray });
      
      updateNode(nodeId, {
        inputs: inputsArray,
        outputs: outputsArray
      });
      
      console.log('I/O variables saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving I/O variables:', error);
      alert('Error saving variables: ' + error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-4/5 max-w-4xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">Configure Variables</h2>
            <p className="text-sm text-gray-600">Node: {nodeId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 h-full">
            
            {/* Input Variables */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  Input Variables
                  <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                    {Object.keys(inputs).length}
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newInputName}
                    onChange={(e) => setNewInputName(e.target.value)}
                    placeholder="Input name"
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                    onKeyPress={(e) => e.key === 'Enter' && addInput()}
                  />
                  <button
                    onClick={addInput}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(inputs).map(([inputName, input]) => (
                  <div key={inputName} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={input.name}
                          onChange={(e) => updateInput(inputName, { name: e.target.value })}
                          className="font-medium text-sm bg-transparent border-none outline-none"
                        />
                        <select
                          value={input.dataType}
                          onChange={(e) => updateInput(inputName, { dataType: e.target.value as DataType })}
                          className={`px-2 py-1 rounded text-xs border ${getDataTypeColor(input.dataType)}`}
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                          <option value="file">file</option>
                          <option value="any">any</option>
                          <option value="foreign">foreign</option>
                        </select>
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={input.required || false}
                            onChange={(e) => updateInput(inputName, { required: e.target.checked })}
                            className="mr-1"
                          />
                          Required
                        </label>
                      </div>
                      <button
                        onClick={() => deleteInput(inputName)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={input.description || ''}
                      onChange={(e) => updateInput(inputName, { description: e.target.value })}
                      placeholder="Description..."
                      className="w-full text-xs text-gray-600 mb-3 border-none outline-none bg-gray-50 px-2 py-1 rounded"
                    />

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">Value:</label>
                      {renderInputValueField(inputName, input)}
                      {(!input.connectedTo || input.dataType === 'foreign') && renderConnectionSelector(inputName)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Variables */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  Output Variables
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                    {Object.keys(outputs).length}
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newOutputName}
                    onChange={(e) => setNewOutputName(e.target.value)}
                    placeholder="Output name"
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                    onKeyPress={(e) => e.key === 'Enter' && addOutput()}
                  />
                  <button
                    onClick={addOutput}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(outputs).map(([outputName, output]) => (
                  <div key={outputName} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={output.name}
                          onChange={(e) => updateOutput(outputName, { name: e.target.value })}
                          className="font-medium text-sm bg-transparent border-none outline-none"
                        />
                        <select
                          value={output.dataType}
                          onChange={(e) => updateOutput(outputName, { dataType: e.target.value as DataType })}
                          className={`px-2 py-1 rounded text-xs border ${getDataTypeColor(output.dataType)}`}
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                          <option value="file">file</option>
                          <option value="any">any</option>
                          <option value="foreign">foreign</option>
                        </select>
                      </div>
                      <button
                        onClick={() => deleteOutput(outputName)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={output.description || ''}
                      onChange={(e) => updateOutput(outputName, { description: e.target.value })}
                      placeholder="Description..."
                      className="w-full text-xs text-gray-600 mb-2 border-none outline-none bg-gray-50 px-2 py-1 rounded"
                    />

                    <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                      Reference: ${nodeId}.{outputName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log('Save Variables button clicked');
              handleSave();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
          >
            <Settings2 className="w-4 h-4" />
            <span>Save Variables</span>
          </button>
        </div>
      </div>
    </div>
  );
};