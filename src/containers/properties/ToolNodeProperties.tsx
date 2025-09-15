// src/containers/properties/ToolNodeProperties.tsx

import React, { useState, useEffect } from 'react';
import { useWorkflowContext } from '../../context/workflowContext';
import { WorkflowNode } from '../../models';
import { Save, AlertCircle } from 'lucide-react';

interface ToolNodePropertiesProps {
  node: WorkflowNode;
}

export const ToolNodeProperties: React.FC<ToolNodePropertiesProps> = ({ node }) => {
  const { updateNode } = useWorkflowContext();

  // Initialize state from the node's inputs, providing defaults.
  const [toolType, setToolType] = useState(node.data.inputs?.tool_type || 'API');
  const [endpoint, setEndpoint] = useState(node.data.inputs?.endpoint || '');
  const [method, setMethod] = useState(node.data.inputs?.method || 'GET');
  const [headers, setHeaders] = useState(node.data.inputs?.headers || '{}');
  const [payload, setPayload] = useState(node.data.inputs?.payload || '{}');
  const [error, setError] = useState('');

  // Effect to reset the form if a different node is selected.
  useEffect(() => {
    setToolType(node.data.inputs?.tool_type || 'API');
    setEndpoint(node.data.inputs?.endpoint || '');
    setMethod(node.data.inputs?.method || 'GET');
    setHeaders(node.data.inputs?.headers || '{}');
    setPayload(node.data.inputs?.payload || '{}');
    setError('');
  }, [node]);

  const handleSave = () => {
    if (toolType === 'API' && !endpoint.trim()) {
      setError('API Endpoint is required.');
      return;
    }
    // Simple JSON validation for headers and payload
    try {
      JSON.parse(headers);
    } catch (e) {
      setError('Headers field contains invalid JSON.');
      return;
    }
    try {
      JSON.parse(payload);
    } catch (e) {
      setError('Payload field contains invalid JSON.');
      return;
    }
    setError('');

    const updatedInputs = {
      ...node.data.inputs,
      tool_type: toolType,
      endpoint,
      method,
      headers,
      payload,
    };

    updateNode(node.id, { inputs: updatedInputs });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-gray-800">Tool Inputs</h4>

      {/* Tool Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tool Type</label>
        <select value={toolType} onChange={(e) => setToolType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option value="API">API Call</option>
          <option value="Function">Function</option>
        </select>
      </div>

      {/* API Endpoint */}
      {toolType === 'API' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
            <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON)</label>
            <textarea value={headers} onChange={(e) => setHeaders(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payload (JSON)</label>
            <textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600 flex items-center"><AlertCircle size={14} className="mr-1"/> {error}</p>}
      
      <button onClick={handleSave} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
        <Save size={16} className="mr-2"/>
        Save Inputs
      </button>
    </div>
  );
};