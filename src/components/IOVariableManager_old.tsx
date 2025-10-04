import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings2, ArrowRight } from 'lucide-react';
import {
  IOConfigFactory,
  BaseNodeIOConfig,
  InputPort,
  OutputPort,
  DataType
} from '../models/IOVariable';
import { useWorkflowContext } from '../context/workflowContext';interface IOVariableManagerProps {
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
  const [ioConfig, setIoConfig] = useState<BaseNodeIOConfig | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: string]: any }>({});
  const [connections, setConnections] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    try {
      const config = IOConfigFactory.createIOConfig(nodeType);
      setIoConfig(config);
      
      // Load existing connections from node data
      const node = currentWorkflow?.findNode(nodeId);
      if (node?.data.ioConnections) {
        setConnections((node.data.ioConnections as any)?.inputs || {});
        setInputValues(node.data.ioValues || {});
      }
    } catch (error) {
      console.warn('Could not create I/O config:', error);
    }
  }, [nodeId, nodeType, currentWorkflow]);

  const getDataTypeColor = (dataType: DataType): string => {
    const colors: Record<string, string> = {
      'string': 'bg-blue-100 text-blue-800 border-blue-200',
      'number': 'bg-green-100 text-green-800 border-green-200',
      'boolean': 'bg-purple-100 text-purple-800 border-purple-200',
      'object': 'bg-orange-100 text-orange-800 border-orange-200',
      'array': 'bg-red-100 text-red-800 border-red-200',
      'file': 'bg-gray-100 text-gray-800 border-gray-200',
      'any': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[dataType] || colors['any'];
  };

  const getAvailableConnections = () => {
    if (!currentWorkflow) return [];
    
    return currentWorkflow.nodes
      .filter((node: any) => node.id !== nodeId)
      .map((node: any) => {
        try {
          const nodeIoConfig = IOConfigFactory.createIOConfig(node.type);
          return {
            nodeId: node.id,
            nodeName: node.data.label,
            outputs: nodeIoConfig.getOutputPorts()
          };
        } catch (error) {
          return {
            nodeId: node.id,
            nodeName: node.data.label,
            outputs: {}
          };
        }
      })
      .filter((node: any) => Object.keys(node.outputs).length > 0);
  };

  const handleInputValueChange = (inputName: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [inputName]: value
    }));
  };

  const handleConnectionChange = (inputName: string, connection: string | null) => {
    setConnections(prev => {
      const newConnections = { ...prev };
      if (connection) {
        newConnections[inputName] = connection;
      } else {
        delete newConnections[inputName];
      }
      return newConnections;
    });
  };

  const handleSave = () => {
    const ioData = {
      ioConnections: {
        inputs: connections,
        outputs: {} // Outputs are determined by connections from other nodes
      },
      ioValues: inputValues
    };

    updateNode(nodeId, ioData);
    onClose();
  };

  const renderInputField = (inputName: string, input: InputPort) => {
    const isConnected = connections[inputName];
    const currentValue = inputValues[inputName] || input.defaultValue;

    if (isConnected) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <Link size={14} className="inline mr-2 text-blue-600" />
            <span className="text-blue-800 font-mono">{isConnected}</span>
          </div>
          <button
            onClick={() => handleConnectionChange(inputName, null)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            title="Disconnect"
          >
            <Unlink size={16} />
          </button>
        </div>
      );
    }

    switch (input.dataType) {
      case 'string':
        return (
          <div className="space-y-2">
            {input.isTemplate ? (
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleInputValueChange(inputName, e.target.value)}
                placeholder={input.defaultValue || 'Enter template variable'}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono bg-gray-50"
              />
            ) : (
              <textarea
                value={currentValue || ''}
                onChange={(e) => handleInputValueChange(inputName, e.target.value)}
                placeholder={`Enter ${input.name.toLowerCase()}`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
              />
            )}
            <ConnectionSelector
              inputName={inputName}
              inputDataType={input.dataType}
              onConnect={(connection) => handleConnectionChange(inputName, connection)}
              availableConnections={getAvailableConnections()}
            />
          </div>
        );
        
      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={currentValue || ''}
              onChange={(e) => handleInputValueChange(inputName, parseFloat(e.target.value) || 0)}
              placeholder={`Enter ${input.name.toLowerCase()}`}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <ConnectionSelector
              inputName={inputName}
              inputDataType={input.dataType}
              onConnect={(connection) => handleConnectionChange(inputName, connection)}
              availableConnections={getAvailableConnections()}
            />
          </div>
        );
        
      case 'boolean':
        return (
          <div className="space-y-2">
            <select
              value={currentValue?.toString() || 'false'}
              onChange={(e) => handleInputValueChange(inputName, e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="false">False</option>
              <option value="true">True</option>
            </select>
            <ConnectionSelector
              inputName={inputName}
              inputDataType={input.dataType}
              onConnect={(connection) => handleConnectionChange(inputName, connection)}
              availableConnections={getAvailableConnections()}
            />
          </div>
        );
        
      case 'object':
        return (
          <div className="space-y-2">
            <textarea
              value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue || '{}'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputValueChange(inputName, parsed);
                } catch {
                  handleInputValueChange(inputName, e.target.value);
                }
              }}
              placeholder="Enter JSON object"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
            />
            <ConnectionSelector
              inputName={inputName}
              inputDataType={input.dataType}
              onConnect={(connection) => handleConnectionChange(inputName, connection)}
              availableConnections={getAvailableConnections()}
            />
          </div>
        );
        
      default:
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={currentValue || ''}
              onChange={(e) => handleInputValueChange(inputName, e.target.value)}
              placeholder={`Enter ${input.name.toLowerCase()}`}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <ConnectionSelector
              inputName={inputName}
              inputDataType={input.dataType}
              onConnect={(connection) => handleConnectionChange(inputName, connection)}
              availableConnections={getAvailableConnections()}
            />
          </div>
        );
    }
  };

  if (!ioConfig) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">I/O Variables</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600">Could not load I/O configuration for this node type.</p>
        </div>
      </div>
    );
  }

  const inputs = ioConfig.getInputPorts();
  const outputs = ioConfig.getOutputPorts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-4/5 max-w-4xl max-h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Settings className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold">I/O Variables Configuration</h3>
            <span className="text-sm text-gray-500">({nodeType})</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Inputs */}
          <div className="flex-1 p-6 overflow-y-auto border-r">
            <h4 className="text-md font-semibold mb-4 flex items-center">
              Input Variables
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                {Object.keys(inputs).length}
              </span>
            </h4>
            
            <div className="space-y-4">
              {Object.entries(inputs).map(([name, input]) => {
                const inputPort = input as InputPort;
                return (
                <div key={name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{inputPort.name}</span>
                        <span className={`px-2 py-1 rounded text-xs border ${getDataTypeColor(inputPort.dataType)}`}>
                          {inputPort.dataType}
                        </span>
                        {inputPort.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                        {inputPort.isTemplate && (
                          <span className="bg-purple-100 text-purple-600 px-1 py-0.5 rounded text-xs">
                            template
                          </span>
                        )}
                      </div>
                      {inputPort.description && (
                        <p className="text-xs text-gray-600 mb-2">{inputPort.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {renderInputField(name, inputPort)}
                </div>
                );
              })}
            </div>
          </div>

          {/* Outputs */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <h4 className="text-md font-semibold mb-4 flex items-center">
              Output Variables
              <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                {Object.keys(outputs).length}
              </span>
            </h4>
            
            <div className="space-y-3">
              {Object.entries(outputs).map(([name, output]) => {
                const outputPort = output as OutputPort;
                return (
                <div key={name} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{outputPort.name}</span>
                    <span className={`px-2 py-1 rounded text-xs border ${getDataTypeColor(outputPort.dataType)}`}>
                      {outputPort.dataType}
                    </span>
                  </div>
                  {outputPort.description && (
                    <p className="text-xs text-gray-600">{outputPort.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    Reference: ${nodeId}.{name}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Connection Selector Component
interface ConnectionSelectorProps {
  inputName: string;
  inputDataType: DataType;
  onConnect: (connection: string) => void;
  availableConnections: Array<{
    nodeId: string;
    nodeName: string;
    outputs: { [key: string]: OutputPort };
  }>;
}

const ConnectionSelector: React.FC<ConnectionSelectorProps> = ({
  inputDataType,
  onConnect,
  availableConnections
}) => {
  const [showConnections, setShowConnections] = useState(false);

  const compatibleConnections = availableConnections.flatMap(conn =>
    Object.entries(conn.outputs)
      .filter(([_, output]) => 
        inputDataType === 'any' || 
        output.dataType === 'any' || 
        inputDataType === output.dataType
      )
      .map(([outputName, output]) => ({
        id: `${conn.nodeId}.${outputName}`,
        display: `${conn.nodeName}.${output.name}`,
        dataType: output.dataType,
        description: output.description
      }))
  );

  if (compatibleConnections.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConnections(!showConnections)}
        className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 flex items-center justify-center space-x-1"
      >
        <Link size={14} />
        <span>Connect to Output</span>
      </button>
      
      {showConnections && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
          {compatibleConnections.map((connection) => (
            <button
              key={connection.id}
              onClick={() => {
                onConnect(connection.id);
                setShowConnections(false);
              }}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{connection.display}</div>
                  {connection.description && (
                    <div className="text-xs text-gray-600">{connection.description}</div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs border ${
                  connection.dataType === 'string' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  connection.dataType === 'number' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {connection.dataType}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};