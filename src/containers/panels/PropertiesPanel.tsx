// src/containers/panels/PropertiesPanel.tsx

import React from 'react';
import { X,Trash2 } from 'lucide-react';
import { useWorkflowContext } from '../../context/workflowContext';
import { LLMNodeProperties } from '../properties/LLMNodeProperties';
import { ToolNodeProperties } from '../properties/ToolNodeProperties';
import { InterruptNodeProperties } from '../properties/InterupptNodeProperties';
import { EdgeProperties } from '../properties/EdgeProperties';

export const PropertiesPanel: React.FC = () => {
  const { selectedNode, selectedEdge, setSelectedNode, setSelectedEdge,updateNode, updateEdge, deleteNode } = useWorkflowContext();

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedNode) return;
    const { name, value } = e.target;
    updateNode(selectedNode.id, { [name]: value });
  };


  const handleDeleteNode = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      
    }
  };

  const renderNodeProperties = () => {
    if (!selectedNode) return null;

    // The "switch" statement acts as a dispatcher
    switch (selectedNode.type) {
      case 'llm':
        return <LLMNodeProperties node={selectedNode} />;
      case 'tool':
        return <ToolNodeProperties node={selectedNode} />;
      case 'interrupt':
        return <InterruptNodeProperties node={selectedNode} />;
      default:
        return <p className="text-sm text-gray-500">This node has no specific properties to configure.</p>;
    }
  };

  const renderContent = () => {
    if (selectedNode) {
      return (
        <>
          <div className="mb-4">
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              id="label"
              name="label"
              value={selectedNode.data.label}
              onChange={handleDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={selectedNode.data.description}
              onChange={handleDataChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <hr className="my-4" />

          {/* Render the specific properties for the selected node type */}
          {renderNodeProperties()}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDeleteNode}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center transition-colors"
              title="Delete Node"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Node
            </button>
          </div>
        </>
      );
    }

    if (selectedEdge) {
      return <EdgeProperties edge={selectedEdge} />;
    }

    return (
      <div className="text-center text-gray-500 mt-10">
        <p>Select a node or edge to view its properties.</p>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Properties</h2>
        {(selectedNode || selectedEdge) && (
          <button
            onClick={() => setSelectedNode(null)} // Simplified reset
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};