import React, { useState, useRef } from 'react';
import { X, Save, Trash2, AlertCircle, CheckCircle, Settings2 } from 'lucide-react';
import { useWorkflowContext } from '../../context/workflowContext';
import { 
  LLMNodeConfig, 
  ToolNodeConfig, 
  InterruptNodeConfig, 
  ConditionalEdgeConfig, 
  ParallelEdgeConfig, 
  LoopingEdgeConfig
} from '../../models';
import { IOVariableManager } from '../../components/IOVariableManager';

export const PropertiesPanel: React.FC = () => {
  const { 
    selectedNode, 
    selectedEdge, 
    setSelectedNode, 
    setSelectedEdge, 
    updateNode, 
    updateNodeId,
    updateEdge,
    conditionalEdgeMode,
    conditionalSourceNode,
    startConditionalEdgeMode,
    exitConditionalEdgeMode,
    getAllVariables,
    deleteNode,
    deleteEdge
  } = useWorkflowContext();

  const [nodeId, setNodeId] = useState(selectedNode?.id || '');
  const [nodeLabel, setNodeLabel] = useState(selectedNode?.data.label || '');
  const [nodeDescription, setNodeDescription] = useState(selectedNode?.data.description || '');
  const [edgeLabel, setEdgeLabel] = useState(selectedEdge?.data.label || '');
  const [edgeCondition, setEdgeCondition] = useState(selectedEdge?.data.condition || '');

  // LLM Node Configuration
  const [llmModel, setLlmModel] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmTemperature, setLlmTemperature] = useState(0.7);
  const [llmMaxTokens, setLlmMaxTokens] = useState(150);
  const [llmPrompt, setLlmPrompt] = useState('');

  // Tool Node Configuration
  const [toolType, setToolType] = useState('API');
  const [toolEndpoint, setToolEndpoint] = useState('');
  const [toolMethod, setToolMethod] = useState('GET');
  const [toolHeaders, setToolHeaders] = useState('');
  const [toolPayload, setToolPayload] = useState('');

  // Interrupt Node Configuration
  const [interruptMessage, setInterruptMessage] = useState('');
  const [interruptTimeout, setInterruptTimeout] = useState(300);
  const [interruptPriority, setInterruptPriority] = useState('medium');
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Edge Configuration
  const [condition, setCondition] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const [maxBranches, setMaxBranches] = useState(2);
  const [synchronizeAll, setSynchronizeAll] = useState(true);
  const [maxIterations, setMaxIterations] = useState(3);
  const [retryDelay, setRetryDelay] = useState(1000);

  // UI State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'io'>('config');
  const [showIOManager, setShowIOManager] = useState(false);
  
  // State for conditional edge builder
  const [selectedVariable, setSelectedVariable] = useState('result');
  const [selectedOperator, setSelectedOperator] = useState('==');
  const [conditionValue, setConditionValue] = useState('true');
  
  // Debounce timer ref
  const saveTimeoutRef = useRef<any>(null);

  React.useEffect(() => {
    if (selectedNode) {
      setNodeId(selectedNode.id);
      setNodeLabel(selectedNode.data.label);
      setNodeDescription(selectedNode.data.description || '');
      

      
      console.log('Loading node configuration:', {
        id: selectedNode.id,
        type: selectedNode.type,
        data: selectedNode.data,
        config: selectedNode.data.config
      });
      
      // Initialize configuration based on node type
      if (selectedNode.type === 'llm') {
        const config = selectedNode.data.config as LLMNodeConfig;
        setLlmModel(config?.model || 'gpt-3.5-turbo');
        setLlmApiKey(config?.apiKey || '');
        setLlmTemperature(config?.temperature || 0.7);
        setLlmMaxTokens(config?.maxTokens || 150);
        setLlmPrompt(config?.systemPrompt || '');
        console.log('LLM config loaded:', config);
      } else if (selectedNode.type === 'tool') {
        const config = selectedNode.data.config as ToolNodeConfig;
        setToolType(config?.toolName || 'api_call');
        setToolEndpoint(config?.apiEndpoint || '');
        setToolMethod(config?.httpMethod || 'GET');
        setToolHeaders(config?.parameters ? JSON.stringify(config.parameters, null, 2) : '');
        setToolPayload(config?.customCode || '');
        console.log('Tool config loaded:', config);
      } else if (selectedNode.type === 'interrupt') {
        const config = selectedNode.data.config as InterruptNodeConfig;
        setInterruptMessage(config?.message || '');
        setInterruptTimeout(config?.timeout || 300);
        setInterruptPriority(config?.priorityLevel || 'normal');
        setRequiresApproval(config?.requiresApproval || false);
        console.log('Interrupt config loaded:', config);
      }
    }
  }, [selectedNode]);

  React.useEffect(() => {
    if (selectedEdge) {
      setEdgeLabel(selectedEdge.data.label || '');
      setEdgeCondition(selectedEdge.data.condition || '');
      
      // Initialize configuration based on edge type
      if (selectedEdge.type === 'conditional') {
        const config = selectedEdge.data.config as ConditionalEdgeConfig;
        const existingCondition = config?.condition || selectedEdge.data.condition || '';
        setCondition(existingCondition);
        
        // Use saved components if available, otherwise parse condition string
        if (selectedEdge.data.conditionVariable) {
          setSelectedVariable(String(selectedEdge.data.conditionVariable) || 'result');
          setSelectedOperator(String(selectedEdge.data.conditionOperator) || '==');
          setConditionValue(String(selectedEdge.data.conditionValue) || 'true');
        } else if (existingCondition) {
          // Fallback to parsing condition string
          const parts = existingCondition.split(' ');
          if (parts.length >= 3) {
            setSelectedVariable(parts[0] || 'result');
            setSelectedOperator(parts[1] || '==');
            setConditionValue(parts.slice(2).join(' ') || 'true');
          }
        }
        
        setThreshold(config?.threshold || 0.5);
      } else if (selectedEdge.type === 'parallel') {
        const config = selectedEdge.data.config as ParallelEdgeConfig;
        setMaxBranches(config?.branches?.length || 2);
        setSynchronizeAll(config?.waitForAll || true);
      } else if (selectedEdge.type === 'looping') {
        const config = selectedEdge.data.config as LoopingEdgeConfig;
        setMaxIterations(config?.maxIterations || 3);
        setRetryDelay(config?.retryDelay || 1000);
      }
    }
  }, [selectedEdge]);

  // Debounced auto-save function (disabled for now)
  // const debouncedSave = useCallback((type: 'node' | 'edge') => {
  //   if (saveTimeoutRef.current) {
  //     clearTimeout(saveTimeoutRef.current);
  //   }
  //   
  //   saveTimeoutRef.current = setTimeout(() => {
  //     if (type === 'node') {
  //       handleSaveNode();
  //     } else {
  //       handleSaveEdge();
  //     }
  //   }, 1000); // Save after 1 second of inactivity
  // }, []);

  // Auto-save on form changes (disabled for now to prevent conflicts)
  // React.useEffect(() => {
  //   if (selectedNode) {
  //     debouncedSave('node');
  //   }
  // }, [nodeLabel, nodeDescription, llmModel, llmApiKey, llmTemperature, llmMaxTokens, llmPrompt, 
  //     toolType, toolEndpoint, toolMethod, toolHeaders, toolPayload,
  //     interruptMessage, interruptTimeout, interruptPriority, requiresApproval, selectedNode]);

  // React.useEffect(() => {
  //   if (selectedEdge) {
  //     debouncedSave('edge');
  //   }
  // }, [edgeLabel, edgeCondition, condition, threshold, maxBranches, synchronizeAll, 
  //     maxIterations, retryDelay, selectedEdge]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveNode = () => {
    if (!selectedNode) return;
    
    setSaveStatus('saving');
    setValidationErrors([]);
    
    try {
      let config;
      const errors: string[] = [];
      
      // Validate and update node ID if changed
      if (nodeId !== selectedNode.id) {
        if (!nodeId || nodeId.trim() === '') {
          errors.push('Node ID cannot be empty');
        } else if (!updateNodeId(selectedNode.id, nodeId)) {
          errors.push('Node ID already exists or is invalid');
        }
      }
      
      // Create configuration based on node type
      if (selectedNode.type === 'llm') {
        if (!llmApiKey.trim()) {
          errors.push('API Key is required for LLM nodes');
        }
        if (llmTemperature < 0 || llmTemperature > 2) {
          errors.push('Temperature must be between 0 and 2');
        }
        if (llmMaxTokens <= 0 || llmMaxTokens > 4096) {
          errors.push('Max Tokens must be between 1 and 4096');
        }

        if (errors.length === 0) {
          config = new LLMNodeConfig({
            model: llmModel,
            apiKey: llmApiKey,
            temperature: llmTemperature,
            maxTokens: llmMaxTokens,
            systemPrompt: llmPrompt
          });
          
          if (!config.validate()) {
            errors.push('Invalid LLM configuration');
          }
        }
      } else if (selectedNode.type === 'tool') {
        if (toolType === 'api_call' && !toolEndpoint.trim()) {
          errors.push('API Endpoint is required for API calls');
        }

        let parsedHeaders = {};
        if (toolHeaders.trim()) {
          try {
            parsedHeaders = JSON.parse(toolHeaders);
          } catch (e) {
            errors.push('Invalid JSON in headers field');
          }
        }

        if (errors.length === 0) {
          config = new ToolNodeConfig({
            toolName: toolType as 'api_call' | 'database_query' | 'custom_code' | 'file_operation' | 'email_send',
            apiEndpoint: toolEndpoint,
            httpMethod: toolMethod as 'GET' | 'POST' | 'PUT' | 'DELETE',
            parameters: parsedHeaders,
            customCode: toolPayload
          });
          
          if (!config.validate()) {
            errors.push('Invalid Tool configuration');
          }
        }
      } else if (selectedNode.type === 'interrupt') {
        if (!interruptMessage.trim()) {
          errors.push('Message is required for interrupt nodes');
        }
        if (interruptTimeout < 0) {
          errors.push('Timeout cannot be negative');
        }

        if (errors.length === 0) {
          config = new InterruptNodeConfig({
            message: interruptMessage,
            timeout: interruptTimeout,
            priorityLevel: interruptPriority as 'low' | 'normal' | 'high' | 'urgent',
            requiresApproval: requiresApproval
          });
          
          if (!config.validate()) {
            errors.push('Invalid Interrupt configuration');
          }
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setSaveStatus('error');
        return;
      }

      updateNode(selectedNode.id, {
        label: nodeLabel,
        description: nodeDescription,
        config: config
      });

      console.log('Node updated with config:', {
        id: selectedNode.id,
        label: nodeLabel,
        description: nodeDescription,
        config: config,
        type: selectedNode.type
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving node configuration:', error);
      setValidationErrors(['An unexpected error occurred while saving']);
      setSaveStatus('error');
    }
  };

  const handleSaveEdge = () => {
    if (!selectedEdge) return;
    
    setSaveStatus('saving');
    setValidationErrors([]);
    
    try {
      let config;
      const errors: string[] = [];
      
      // Create configuration based on edge type
      if (selectedEdge.type === 'conditional') {
        if (!condition.trim()) {
          errors.push('Condition expression is required');
        }

        if (errors.length === 0) {
          config = new ConditionalEdgeConfig({
            condition: condition,
            threshold: threshold
          });
        }
      } else if (selectedEdge.type === 'parallel') {
        if (maxBranches < 2) {
          errors.push('Parallel edges must have at least 2 branches');
        }

        if (errors.length === 0) {
          config = new ParallelEdgeConfig({
            branches: [], // This would be populated from node connections
            waitForAll: synchronizeAll
          });
        }
      } else if (selectedEdge.type === 'looping') {
        if (maxIterations <= 0) {
          errors.push('Max iterations must be greater than 0');
        }
        if (retryDelay < 0) {
          errors.push('Retry delay cannot be negative');
        }

        if (errors.length === 0) {
          config = new LoopingEdgeConfig({
            maxIterations: maxIterations,
            retryDelay: retryDelay
          });
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setSaveStatus('error');
        return;
      }

      // Build the complete condition string
      const finalCondition = condition || `${selectedVariable} ${selectedOperator} ${conditionValue}`;
      
      // Save both the generated condition and the edge label
      updateEdge(selectedEdge.id, {
        label: edgeLabel,
        condition: finalCondition,
        config: config,
        // Also save individual components for later editing
        conditionVariable: selectedVariable,
        conditionOperator: selectedOperator,
        conditionValue: conditionValue
      });

      console.log('Saving edge with condition:', finalCondition);
      console.log('Edge components:', { variable: selectedVariable, operator: selectedOperator, value: conditionValue });
      console.log('Complete edge data:', { label: edgeLabel, condition: finalCondition, config: config });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving edge configuration:', error);
      setValidationErrors(['An unexpected error occurred while saving']);
      setSaveStatus('error');
    }
  };

  const handleClose = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleDeleteNode = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
    }
  };

  const handleDeleteEdge = () => {
    if (selectedEdge) {
      deleteEdge(selectedEdge.id);
      setSelectedEdge(null);
    }
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Selection</h3>
            <p className="text-sm text-gray-600">
              Select a node or edge to view and edit its properties.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedNode ? 'Node Properties' : 'Edge Properties'}
        </h3>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Status and Validation Messages */}
      {(saveStatus === 'saved' || saveStatus === 'error' || validationErrors.length > 0) && (
        <div className="px-4 py-2 border-b border-gray-200">
          {saveStatus === 'saved' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle size={16} className="mr-2" />
              Changes saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle size={16} className="mr-2" />
              Error saving changes
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start text-red-600 text-sm">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-6">
        {selectedNode && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Configuration
              </button>
              <button
                onClick={() => setActiveTab('io')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'io'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                I/O Variables
              </button>
            </div>

            {activeTab === 'config' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Node Type
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span className="text-sm text-gray-900 capitalize font-medium">
                      {selectedNode.type}
                    </span>
                  </div>
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node ID
              </label>
              <input
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter unique node ID"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for this node. Used in variable references and exports.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter node label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter node description"
              />
            </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveNode}
                    disabled={saveStatus === 'saving'}
                    className={`
                      flex-1 px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors
                      ${saveStatus === 'saving' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : saveStatus === 'saved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : saveStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      } text-white
                    `}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Saved</span>
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <AlertCircle size={16} />
                        <span>Retry</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDeleteNode}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center transition-colors"
                    title="Delete Node"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'io' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings2 className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Input/Output Variables</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Define input and output variables for this node and configure data flow connections.
                  </p>
                  
                  {selectedNode && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="font-medium text-blue-800">Input Variables</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedNode.data.inputs ? Object.keys(selectedNode.data.inputs).length : 0}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="font-medium text-green-800">Output Variables</div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedNode.data.outputs ? Object.keys(selectedNode.data.outputs).length : 0}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          console.log('Opening IO Variable Manager for node:', selectedNode?.id);
                          setShowIOManager(true);
                        }}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Settings2 size={20} />
                        <span>Manage Variables</span>
                      </button>
                    </div>
                  )}
                </div>


              </div>
            )}
          </>
        )}

        {selectedEdge && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edge Type
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-sm text-gray-900 capitalize font-medium">
                  {selectedEdge.type}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={edgeLabel}
                onChange={(e) => setEdgeLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter edge label"
              />
            </div>

            {selectedEdge.type === 'parallel' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Branches
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={maxBranches}
                    onChange={(e) => setMaxBranches(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="synchronizeAll"
                    checked={synchronizeAll}
                    onChange={(e) => setSynchronizeAll(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="synchronizeAll" className="text-sm font-medium text-gray-700">
                    Wait for all branches to complete
                  </label>
                </div>
              </div>
            )}

            {selectedEdge.type === 'looping' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Delay (ms)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={retryDelay}
                    onChange={(e) => setRetryDelay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}



            {selectedEdge.type === 'conditional' && (
              <div className="space-y-4 bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <h3 className="text-lg font-bold text-orange-800 mb-4">
                  🔀 Conditional Edge Configuration
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Variable to Check</label>
                    <select 
                      value={selectedVariable}
                      onChange={(e) => {
                        setSelectedVariable(e.target.value);
                        const newCondition = `${e.target.value} ${selectedOperator} ${conditionValue}`;
                        setCondition(newCondition);
                      }}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    >
                      <optgroup label="Common Variables">
                        <option value="result">result (generic)</option>
                        <option value="status">status (generic)</option>
                        <option value="output">output (generic)</option>
                        <option value="error">error (generic)</option>
                        <option value="success">success (generic)</option>
                      </optgroup>
                      {getAllVariables().length > 0 && getAllVariables().map(nodeVars => (
                        <optgroup key={nodeVars.nodeId} label={`📦 ${nodeVars.nodeName}`}>
                          {nodeVars.variables.map(variable => (
                            <option 
                              key={`${nodeVars.nodeId}.${variable.name}`} 
                              value={`${nodeVars.nodeId}.${variable.name}`}
                            >
                              {nodeVars.nodeId.slice(0, 8)}...{variable.name} ({variable.type === 'input' ? '🔽' : '🔼'} {variable.dataType})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      {getAllVariables().length === 0 && (
                        <optgroup label="ℹ️ Node Variables">
                          <option disabled>No variables configured yet - use I/O tab to add variables</option>
                        </optgroup>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Comparison Operator</label>
                    <select 
                      value={selectedOperator}
                      onChange={(e) => {
                        setSelectedOperator(e.target.value);
                        const newCondition = `${selectedVariable} ${e.target.value} ${conditionValue}`;
                        setCondition(newCondition);
                      }}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    >
                      <option value="==">== (equals)</option>
                      <option value="!=">!= (not equals)</option>
                      <option value=">">&gt; (greater than)</option>
                      <option value="<">&lt; (less than)</option>
                      <option value=">=">&gt;= (greater or equal)</option>
                      <option value="<=">&lt;= (less or equal)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Comparison Value</label>
                    <input
                      type="text"
                      value={conditionValue}
                      onChange={(e) => {
                        setConditionValue(e.target.value);
                        const newCondition = `${selectedVariable} ${selectedOperator} ${e.target.value}`;
                        setCondition(newCondition);
                      }}
                      placeholder="Enter value to compare against"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded border-2 border-orange-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Final Condition Preview
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border rounded text-lg font-mono text-orange-700 font-bold">
                    {condition || `${selectedVariable} ${selectedOperator} ${conditionValue}`}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> When the workflow runs, this condition will be evaluated. 
                    If TRUE, the flow continues along this edge. If FALSE, an alternative path can be taken.
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdge}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={handleDeleteEdge}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center transition-colors"
                title="Delete Edge"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
        </div>
      </div>
      
      {/* I/O Variable Manager Modal */}
      {showIOManager && selectedNode && (
        <IOVariableManager
          nodeId={selectedNode.id}
          nodeType={selectedNode.type}
          onClose={() => setShowIOManager(false)}
        />
      )}
    </div>
  );
};