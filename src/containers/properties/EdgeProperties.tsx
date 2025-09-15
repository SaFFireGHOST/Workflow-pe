import React, { useState, useEffect } from 'react';
import { useWorkflowContext } from '../../context/workflowContext';
import { 
  WorkflowEdge, 
  EdgeType, // Import EdgeType
  ConditionalEdgeConfig, 
  ParallelEdgeConfig, 
  LoopingEdgeConfig 
} from '../../models';
import { Save, Trash2, AlertCircle } from 'lucide-react';

interface EdgePropertiesProps {
  edge: WorkflowEdge;
}

export const EdgeProperties: React.FC<EdgePropertiesProps> = ({ edge }) => {
  const { updateEdge, deleteEdge, setSelectedEdge } = useWorkflowContext();

  // --- State for common edge properties ---
  const [edgeType, setEdgeType] = useState<EdgeType>(edge.type); // State for the dropdown
  const [edgeLabel, setEdgeLabel] = useState(edge.data.label || '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // --- State for specific edge configurations ---
  const [condition, setCondition] = useState('');
  const [synchronizeAll, setSynchronizeAll] = useState(true);
  const [maxIterations, setMaxIterations] = useState(5);

  // Effect to sync local state when a new edge is selected
  useEffect(() => {
    setEdgeType(edge.type);
    setEdgeLabel(edge.data.label || '');
    setValidationErrors([]);

    const config = edge.getConfig();
    if (edge.isConditional() && config instanceof ConditionalEdgeConfig) {
      setCondition(config.condition || '');
    } else if (edge.isParallel() && config instanceof ParallelEdgeConfig) {
      setSynchronizeAll(config.waitForAll || true);
    } else if (edge.isLooping() && config instanceof LoopingEdgeConfig) {
      setMaxIterations(config.maxIterations || 3);
    }
  }, [edge]);

  // --- NEW: Handler for changing the edge type ---
  const handleTypeChange = (newType: EdgeType) => {
    setEdgeType(newType);

    // When the type changes, create a new default config for that type
    let newConfig;
    if (newType === 'conditional') {
      newConfig = new ConditionalEdgeConfig();
    } else if (newType === 'looping') {
      newConfig = new LoopingEdgeConfig();
    } else if (newType === 'parallel') {
      newConfig = new ParallelEdgeConfig();
    }
    // 'default' type has no config

    // Immediately update the edge in the global state.
    // This will cause the component to re-render with the correct fields.
    updateEdge(edge.id, { type: newType, config: newConfig });
  };

  const handleSave = () => {
  if (!edge) return;
  
  setValidationErrors([]);
  const errors: string[] = [];
  let config;

  if (edgeType === 'conditional') {
    if (!condition.trim()) errors.push('Condition expression is required');
    if (errors.length === 0) config = new ConditionalEdgeConfig({ condition });
  } else if (edgeType === 'parallel') {
    config = new ParallelEdgeConfig({ waitForAll: synchronizeAll });
  } else if (edgeType === 'looping') {
    if (maxIterations <= 0) errors.push('Max iterations must be greater than 0');
    if (errors.length === 0) config = new LoopingEdgeConfig({ maxIterations });
  }

  if (errors.length > 0) {
    setValidationErrors(errors);
    return;
  }
  // We need to wrap the updated properties in a `data` object
  // to match the structure of the WorkflowEdge class.
  updateEdge(edge.id, {
    type: edgeType,
    data: {
      label: edgeLabel,
      config: config,
    },
  });
  // --- END OF CHANGE ---
};

  const handleDelete = () => {
    if (edge) {
      deleteEdge(edge.id);
      setSelectedEdge(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Edge Properties</h3>
      
      {/* --- UPDATED: Edge Type is now a dropdown --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Edge Type</label>
        <select
          value={edgeType}
          onChange={(e) => handleTypeChange(e.target.value as EdgeType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="default">Default</option>
          <option value="conditional">Conditional</option>
          <option value="looping">Looping</option>
          <option value="parallel">Parallel</option>
        </select>
      </div>

      {/* Edge Label Input */}
      <div>
        <label htmlFor="edge-label" className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          id="edge-label"
          type="text"
          value={edgeLabel}
          onChange={(e) => setEdgeLabel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter edge label"
        />
      </div>

      <hr className="my-2" />

      {/* --- Conditional, Parallel, Looping inputs remain the same --- */}
      {edgeType=='conditional' && (
        // ... conditional JSX
        <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition Expression</label>
            <textarea
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="e.g., $llm_node.output.confidence > 0.8"
            />
        </div>
      )}
      {edgeType=='parallel' && (
        // ... parallel JSX
        <div className="flex items-center">
            <input
              type="checkbox"
              id="synchronizeAll"
              checked={synchronizeAll}
              onChange={(e) => setSynchronizeAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="synchronizeAll" className="ml-2 text-sm font-medium text-gray-700">
              Wait for all branches to complete
            </label>
        </div>
      )}
      {edgeType=='looping' && (
        // ... looping JSX
        <div>
            <label htmlFor="maxIterations" className="block text-sm font-medium text-gray-700 mb-1">Max Iterations</label>
            <input
              id="maxIterations"
              type="number"
              min="1"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
      )}

      {validationErrors.length > 0 && (
         <div className="space-y-1">
          {validationErrors.map((err, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1"/> {err}
            </p>
          ))}
        </div>
      )}
      
      <div className="flex space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
        >
          <Save size={16} className="mr-2"/> Save
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center transition-colors"
          title="Delete Edge"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};