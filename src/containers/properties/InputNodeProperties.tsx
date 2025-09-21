// src/containers/properties/InputNodeProperties.tsx

import React, { useState, useEffect } from 'react';
import { useWorkflowContext } from '../../context/workflowContext';
import { WorkflowNode } from '../../models';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface InputNodePropertiesProps {
  node: WorkflowNode;
}

interface InputField {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' ;
  required: boolean;
  validation?: string; // Regex pattern for validation
}

export const InputNodeProperties: React.FC<InputNodePropertiesProps> = ({ node }) => {
  const { updateNode } = useWorkflowContext();

  // Initialize state from the node's inputs, providing defaults
  const [inputFields, setInputFields] = useState<InputField[]>(
    node.data.inputs?.input_fields || [
      {
        key: '',
        value: '',
        type: 'string',
        required: true,
      }
    ]
  );
  const [error, setError] = useState('');

  // Effect to reset the form if a different node is selected
  useEffect(() => {
    setInputFields(node.data.inputs?.input_fields || [
      {
        key: '',
        value: '',
        type: 'string',
        required: true,
      }
    ]);
    setError('');
  }, [node]);

  const handleSave = () => {
    // Validation

    if (inputFields.length === 0) {
      setError('At least one input field is required.');
      return;
    }

    // Check for duplicate field keys
    const fieldKeys = inputFields.map(field => field.key);
    const uniqueKeys = new Set(fieldKeys);
    if (fieldKeys.length !== uniqueKeys.size) {
      setError('Input field keys must be unique.');
      return;
    }

    // Check for empty field keys or labels
    const hasEmptyKeys = inputFields.some(field => !field.key.trim() || !field.value.trim());
    if (hasEmptyKeys) {
      setError('All input fields must have both key and label.');
      return;
    }

    setError('');

    const updatedInputs = {
      ...node.data.inputs,
      input_fields: inputFields,
    };

    updateNode(node.id, { inputs: updatedInputs });
  };

  const addInputField = () => {
    const newField: InputField = {
      key: ``,
      value: '',
      type: 'string',
      required: false,
    };
    setInputFields([...inputFields, newField]);
  };

  const updateInputField = (index: number, updatedField: Partial<InputField>) => {
    const updated = inputFields.map((field, i) => 
      i === index ? { ...field, ...updatedField } : field
    );
    setInputFields(updated);
  };

  const removeInputField = (index: number) => {
    if (inputFields.length > 1) {
      setInputFields(inputFields.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-gray-800">Input Node Configuration</h4>


      {/* Input Fields Configuration */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-semibold text-gray-800">Input Fields</h5>
          <button
            onClick={addInputField}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            <Plus size={14} className="mr-1" />
            Add Field
          </button>
        </div>

        {inputFields.map((field, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-700">Field {index + 1}</span>
              {inputFields.length > 1 && (
                <button
                  onClick={() => removeInputField(index)}
                  className="text-red-600 hover:text-red-800"
                  title="Remove field"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => updateInputField(index, { key: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="field_key"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={field.type}
                  onChange={(e) => updateInputField(index, { type: e.target.value as InputField['type'] })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="text">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  
                 
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Input Value</label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateInputField(index, { value: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Enter the input value"
              />
            </div>

            {/* <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required_${index}`}
                  checked={field.required}
                  onChange={(e) => updateInputField(index, { required: e.target.checked })}
                  className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`required_${index}`} className="ml-1 text-xs text-gray-600">
                  Required
                </label>
              </div>
              
            </div> */}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle size={14} className="mr-1" /> {error}
        </p>
      )}

      <button 
        onClick={handleSave} 
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
      >
        <Save size={16} className="mr-2" />
        Save Configuration
      </button>
    </div>
  );
};