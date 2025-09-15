import React, { useState, useEffect } from 'react';
import { useWorkflowContext } from '../../context/workflowContext';
import { WorkflowNode } from '../../models';
import { Save, AlertCircle } from 'lucide-react';

interface LLMNodePropertiesProps {
  node: WorkflowNode;
}

export const LLMNodeProperties: React.FC<LLMNodePropertiesProps> = ({ node }) => {
  const { updateNode } = useWorkflowContext();
  
  // Initialize state directly from the node's inputs, providing defaults if they don't exist.
  const [apiKey, setApiKey] = useState(node.data.inputs?.api_key || '');
  const [model, setModel] = useState(node.data.inputs?.model || 'gpt-4');
  const [temperature, setTemperature] = useState(node.data.inputs?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(node.data.inputs?.max_tokens || 1024);
  const [systemPrompt, setSystemPrompt] = useState(node.data.inputs?.system_prompt || '');
  const [userPrompt, setUserPrompt] = useState(node.data.inputs?.user_prompt || '');
  const [error, setError] = useState('');

  // This effect ensures the form updates if the user selects a different node.
  useEffect(() => {
    setApiKey(node.data.inputs?.api_key || '');
    setModel(node.data.inputs?.model || 'gpt-4');
    setTemperature(node.data.inputs?.temperature || 0.7);
    setMaxTokens(node.data.inputs?.max_tokens || 1024);
    setSystemPrompt(node.data.inputs?.system_prompt || '');
    setUserPrompt(node.data.inputs?.user_prompt || '');
    setError(''); // Reset error when node changes.
  }, [node]);

  const handleSave = () => {
    // Simple validation.
    if (!apiKey.trim()) {
      setError('API Key is required.');
      return;
    }
    setError('');

    // Create a new `inputs` object with all the updated values.
    const updatedInputs = {
      ...node.data.inputs, // Preserve any other inputs (like 'context').
      api_key: apiKey,
      model,
      temperature,
      max_tokens: maxTokens,
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
    };

    // Use the context function to save the updated `inputs` object to the node's data.
    updateNode(node.id, { inputs: updatedInputs });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-gray-800">LLM Inputs</h4>
      
      {/* Model Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
      
      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>
      
      {/* Temperature Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Temperature ({temperature})</label>
        <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full" />
      </div>
      
      {/* Max Tokens Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
        <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>
      
      {/* System Prompt Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>
      
      {/* User Prompt Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">User Prompt</label>
        <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>

      {/* Error Message Display */}
      {error && <p className="text-sm text-red-600 flex items-center"><AlertCircle size={14} className="mr-1"/> {error}</p>}
      
      {/* Save Button */}
      <button onClick={handleSave} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
        <Save size={16} className="mr-2"/>
        Save Inputs
      </button>
    </div>
  );
};