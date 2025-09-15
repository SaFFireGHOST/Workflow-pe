// src/containers/properties/InterruptNodeProperties.tsx

import React, { useState, useEffect } from 'react';
import { useWorkflowContext } from '../../context/workflowContext';
import { WorkflowNode } from '../../models';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

interface InterruptNodePropertiesProps {
  node: WorkflowNode;
}

export const InterruptNodeProperties: React.FC<InterruptNodePropertiesProps> = ({ node }) => {
  const { updateNode } = useWorkflowContext();

  // Initialize state from the node's inputs, providing defaults.
  const [message, setMessage] = useState(node.data.inputs?.message || '');
  const [timeout, setTimeoutValue] = useState(node.data.inputs?.timeout || 300);
  const [priority, setPriority] = useState(node.data.inputs?.priority || 'medium');
  const [requiresApproval, setRequiresApproval] = useState(node.data.inputs?.requires_approval || false);
  const [error, setError] = useState('');

  // Effect to reset the form if a different node is selected.
  useEffect(() => {
    setMessage(node.data.inputs?.message || '');
    setTimeoutValue(node.data.inputs?.timeout || 300);
    setPriority(node.data.inputs?.priority || 'medium');
    setRequiresApproval(node.data.inputs?.requires_approval || false);
    setError('');
  }, [node]);

  const handleSave = () => {
    if (!message.trim()) {
      setError('A message is required for the interrupt.');
      return;
    }
    setError('');

    const updatedInputs = {
      ...node.data.inputs,
      message,
      timeout,
      priority,
      requires_approval: requiresApproval,
    };

    updateNode(node.id, { inputs: updatedInputs });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-gray-800">Interrupt Inputs</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter message to display to user"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seconds)</label>
        <input
          type="number"
          min="0"
          value={timeout}
          onChange={(e) => setTimeoutValue(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <p className="text-xs text-gray-500 mt-1">0 = no timeout</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="requiresApproval"
          checked={requiresApproval}
          onChange={(e) => setRequiresApproval(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="requiresApproval" className="ml-2 block text-sm font-medium text-gray-700">
          Requires Approval
        </label>
      </div>
      
      {error && <p className="text-sm text-red-600 flex items-center"><AlertCircle size={14} className="mr-1"/> {error}</p>}
      
      <button onClick={handleSave} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
        <Save size={16} className="mr-2"/>
        Save Inputs
      </button>
    </div>
  );
};