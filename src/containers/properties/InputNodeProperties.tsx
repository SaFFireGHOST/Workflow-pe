import React from 'react';
import { useState, useEffect } from 'react';
import { useWorkflowContext } from '../../context/workflowContext';
import { WorkflowNode } from '../../models';
import { Save, AlertCircle, PlusCircle, XCircle } from 'lucide-react';

interface InputNodePropertiesProps {
  node: WorkflowNode;
}

// Interface to manage the state of each input field in the UI
interface InputField {
  id: string; // For React key prop
  name: string; // Corresponds to the key in the 'outputs' object (e.g., "video_url")
  type: 'string' | 'number' | 'boolean'; // Corresponds to the value (e.g., "string")
  label: string; // User-friendly label for the form
}

// Helper to transform the node's `outputs` object into the UI state array
const transformOutputsToState = (outputs: { [key: string]: string } | undefined): InputField[] => {
  if (!outputs) return [];
  return Object.entries(outputs).map(([name, type]) => ({
    id: crypto.randomUUID(),
    name,
    type: type as 'string' | 'number' | 'boolean',
    label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // A default label
  }));
};


export const InputNodeProperties: React.FC<InputNodePropertiesProps> = ({ node }) => {
  const { updateNode } = useWorkflowContext();

  // The main state is an array of objects, representing each input field to be configured.
  const [inputFields, setInputFields] = useState<InputField[]>(transformOutputsToState(node.data.outputs));
  const [error, setError] = useState('');

  // Effect to update the form if a different node is selected
  useEffect(() => {
    setInputFields(transformOutputsToState(node.data.outputs));
    setError('');
  }, [node]);

  const handleFieldChange = (index: number, event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const updatedFields = [...inputFields];
    updatedFields[index] = { ...updatedFields[index], [event.target.name]: event.target.value };
    setInputFields(updatedFields);
  };

  const addField = () => {
    setInputFields([...inputFields, { id: crypto.randomUUID(), name: '', type: 'string', label: '' }]);
  };

  const removeField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setError('');
    const names = new Set<string>();

    // Validation
    for (const field of inputFields) {
      if (!field.name.trim() || !field.label.trim()) {
        setError('Field Name and Label cannot be empty.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
        setError(`Field Name "${field.name}" is invalid. Use only letters, numbers, and underscores.`);
        return;
      }
      if (names.has(field.name)) {
        setError(`Duplicate Field Name "${field.name}" found. Names must be unique.`);
        return;
      }
      names.add(field.name);
    }

    // Transform the UI state array back into the required `outputs` object format
    const updatedOutputs = inputFields.reduce((acc, field) => {
      acc[field.name] = field.type;
      return acc;
    }, {} as { [key: string]: string });

    // Save the updated `outputs` object to the node's data
    updateNode(node.id, { outputs: updatedOutputs });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-gray-800">Input Fields Configuration</h4>
      <p className="text-xs text-gray-500 -mt-3">Define the data this node will provide to the workflow.</p>

      <div className="space-y-3">
        {inputFields.map((field, index) => (
          <div key={field.id} className="p-3 border border-gray-200 rounded-md space-y-2 relative">
            <button 
              onClick={() => removeField(index)} 
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
              <XCircle size={16} />
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
              <input
                type="text"
                name="label"
                value={field.label}
                onChange={(e) => handleFieldChange(index, e)}
                placeholder="e.g., YouTube Video URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                <input
                  type="text"
                  name="name"
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, e)}
                  placeholder="e.g., video_url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                <select
                  name="type"
                  value={field.type}
                  onChange={(e) => handleFieldChange(index, e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addField}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-dashed border-gray-400 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm"
      >
        <PlusCircle size={14} className="mr-2"/>
        Add Field
      </button>

      {error && <p className="text-sm text-red-600 flex items-center"><AlertCircle size={14} className="mr-1"/> {error}</p>}
      
      <button onClick={handleSave} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
        <Save size={16} className="mr-2"/>
        Save Configuration
      </button>
    </div>
  );
};